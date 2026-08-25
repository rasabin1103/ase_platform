"""Polls GitHub Actions for every still-active TestRun and syncs its
status/conclusion — see app.modules.test_execution. No webhook is
configured on this backend today (no public HTTPS endpoint registered as a
GitHub webhook target), so polling every ~45s is how a run's state ever
progresses past the initial dispatch, run from app.main's APScheduler
(TEST_RUN_POLL_SWEEP_ENABLED)."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import github_client
from app.core.config import settings
from app.models.catalog_item import CatalogItem
from app.models.enums import TestRunConclusion, TestRunStatus
from app.models.test_run import TestRun

logger = logging.getLogger(__name__)

_ACTIVE_STATUSES = (TestRunStatus.pending, TestRunStatus.queued, TestRunStatus.in_progress)

_STATUS_MAP: dict[str, TestRunStatus] = {
    "queued": TestRunStatus.queued,
    "in_progress": TestRunStatus.in_progress,
    "completed": TestRunStatus.completed,
}

_CONCLUSION_MAP: dict[str, TestRunConclusion] = {
    "success": TestRunConclusion.success,
    "failure": TestRunConclusion.failure,
    "cancelled": TestRunConclusion.cancelled,
    "timed_out": TestRunConclusion.timed_out,
    "action_required": TestRunConclusion.action_required,
}


def run_test_run_polling_sweep(db: Session) -> int:
    """Returns how many TestRun rows were updated this tick. Every row is
    handled independently — a GitHub API error on one run (revoked token,
    deleted repo, transient rate limit) is logged and skipped, never lets
    one bad repo block the rest of the sweep or crash the scheduler."""
    token = settings.GITHUB_ACCESS_TOKEN
    if not token:
        return 0

    runs = list(db.execute(select(TestRun).where(TestRun.status.in_(_ACTIVE_STATUSES))).scalars().all())
    if not runs:
        return 0

    item_ids = {r.catalog_item_id for r in runs}
    items = {
        i.id: i for i in db.execute(select(CatalogItem).where(CatalogItem.id.in_(item_ids))).scalars().all()
    }

    updated = 0
    for run in runs:
        item = items.get(run.catalog_item_id)
        if item is None or not item.test_repo_url:
            continue

        try:
            if run.github_run_id is None:
                # The initial dispatch either hasn't been located yet (the
                # trigger-time best-effort lookup came up empty because
                # GitHub hadn't registered the run fast enough) or dispatch
                # itself only just happened — keep looking by timestamp
                # until we find it or give up in a future tick.
                found = github_client.find_latest_dispatched_run(
                    repo_url=item.test_repo_url,
                    workflow_file=item.test_workflow_file or "",
                    token=token,
                    dispatched_after=run.created_at,
                )
                if found is None:
                    continue
                run.github_run_id = found.get("id")
                run.github_run_url = found.get("html_url")
            else:
                found = github_client.get_workflow_run(
                    repo_url=item.test_repo_url, token=token, run_id=run.github_run_id,
                )

            row_changed = False

            mapped_status = _STATUS_MAP.get(found.get("status", ""))
            if mapped_status is not None and mapped_status != run.status:
                run.status = mapped_status
                if mapped_status == TestRunStatus.in_progress and run.started_at is None:
                    run.started_at = datetime.now(timezone.utc)
                if mapped_status == TestRunStatus.completed and run.completed_at is None:
                    run.completed_at = datetime.now(timezone.utc)
                row_changed = True

            gh_conclusion = found.get("conclusion")
            if gh_conclusion:
                mapped_conclusion = _CONCLUSION_MAP.get(gh_conclusion, TestRunConclusion.unknown)
                if run.conclusion != mapped_conclusion:
                    run.conclusion = mapped_conclusion
                    row_changed = True

            if run.status == TestRunStatus.completed:
                if run.progress_percent != 100:
                    run.progress_percent = 100
                    row_changed = True
            elif run.status in (TestRunStatus.queued, TestRunStatus.in_progress) and run.github_run_id is not None:
                # Best-effort: a run can be "in_progress" with zero jobs
                # listed yet (GitHub hasn't assigned a runner), in which
                # case this just leaves progress_percent as it was rather
                # than resetting it to 0 — never regress the bar backwards.
                try:
                    jobs = github_client.list_workflow_run_jobs(
                        repo_url=item.test_repo_url, token=token, run_id=run.github_run_id,
                    )
                except github_client.GithubWorkflowError:
                    jobs = []
                steps = [s for j in jobs for s in j.get("steps", [])]
                if steps:
                    completed = sum(1 for s in steps if s.get("status") == "completed")
                    percent = round(completed / len(steps) * 100)
                    if run.progress_percent != percent:
                        run.progress_percent = percent
                        row_changed = True

            if row_changed:
                updated += 1
        except github_client.GithubWorkflowError:
            logger.warning(
                "Test run polling failed for run id=%s catalog_item_id=%s", run.id, run.catalog_item_id,
                exc_info=True,
            )
            continue

    if updated:
        db.commit()
    return updated
