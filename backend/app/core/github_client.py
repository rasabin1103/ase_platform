from __future__ import annotations

from datetime import datetime
from urllib.parse import urlparse

import httpx

GITHUB_API_BASE = "https://api.github.com"
_REQUEST_TIMEOUT_SECONDS = 10.0


class GithubInviteError(Exception):
    """Raised when a repo can't be resolved from a URL, or the GitHub API
    call to invite a collaborator fails for any reason."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def parse_owner_repo(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub repo URL, e.g.
    'https://github.com/arce-sabin/qa-book-code' -> ('arce-sabin', 'qa-book-code')."""
    parsed = urlparse(repo_url.strip())
    host = (parsed.netloc or "").lower()
    parts = [p for p in parsed.path.split("/") if p]
    if host not in ("github.com", "www.github.com") or len(parts) < 2:
        raise GithubInviteError("repo_url is not a valid GitHub repository URL (expected https://github.com/owner/repo)")
    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


class GithubContentError(Exception):
    """Raised when a file can't be read from a repo — not found, no read
    access with the configured token, or GitHub unreachable."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def get_file_content(*, repo_url: str, path: str, token: str) -> bytes:
    """Reads one file's raw bytes from `repo_url` at `path` via the GitHub
    Contents API, authenticated with `token` — works for private repos as
    long as the token has read access, no collaborator invite or end-user
    GitHub account involved. Used to power the in-platform read-only
    resource viewer and download, always behind our own ownership check
    (see ConsumerCatalogService) — the caller never gets raw repo access,
    only the one file they're entitled to."""
    owner, repo = parse_owner_repo(repo_url)
    clean_path = path.strip().lstrip("/")
    if not clean_path:
        raise GithubContentError("No file path configured for this item")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}"
    headers = {
        "Authorization": f"Bearer {token}",
        # application/vnd.github.raw returns the file's raw bytes directly
        # instead of a JSON envelope with base64-encoded content.
        "Accept": "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubContentError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.content
    if response.status_code == 404:
        raise GithubContentError("File not found in the repository", status_code=404)
    if response.status_code in (401, 403):
        raise GithubContentError(
            "The GitHub token is missing or does not have read access to this repository",
            status_code=403,
        )
    raise GithubContentError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def list_directory(*, repo_url: str, path: str, token: str) -> list[dict]:
    """Lists a folder's direct entries (name, path, type, ...) via the
    GitHub Contents API. Used for resource items' repo_path, which is meant
    to point at a folder — containing a README.md and/or a packaged .zip
    and/or a .docx/.xlsx — so we can find each one's exact filename without
    the admin having to type it in twice.

    Tolerates repo_path pointing directly at a single file instead of its
    containing folder (an easy admin mistake, and a perfectly reasonable
    thing to do for a one-file resource): the Contents API returns a lone
    JSON object rather than an array in that case, which we normalize into
    a one-entry list so every caller's "find README.md/.docx/.xlsx/.zip
    among these entries" logic keeps working unchanged, whether repo_path
    is a folder or the file itself."""
    owner, repo = parse_owner_repo(repo_url)
    clean_path = path.strip().strip("/")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}" if clean_path else f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubContentError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and data.get("type") == "file":
            return [data]
        raise GithubContentError(
            "Unexpected response from GitHub for this path", status_code=422
        )
    if response.status_code == 404:
        raise GithubContentError("Folder not found in the repository", status_code=404)
    if response.status_code in (401, 403):
        raise GithubContentError(
            "The GitHub token is missing or does not have read access to this repository",
            status_code=403,
        )
    raise GithubContentError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def invite_collaborator(*, repo_url: str, github_username: str, token: str) -> str:
    """Invites `github_username` as a collaborator on the private repo at
    `repo_url`, using a GitHub personal access token with admin rights on
    that repo. Returns 'invited' (a pending invitation was created — the
    user must accept it on GitHub) or 'already_collaborator' (they already
    had access, added immediately). Raises GithubInviteError otherwise."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/collaborators/{github_username}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.put(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubInviteError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 201:
        return "invited"
    if response.status_code == 204:
        return "already_collaborator"
    if response.status_code == 404:
        raise GithubInviteError("GitHub username not found", status_code=404)
    if response.status_code in (401, 403):
        raise GithubInviteError(
            "The GitHub token is missing or does not have admin rights on this repository",
            status_code=403,
        )
    raise GithubInviteError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


class GithubWorkflowError(Exception):
    """Raised when a workflow_dispatch call, run lookup, or status poll
    fails for any reason — bad repo/workflow reference, token without
    `workflow`/`actions:write` scope, GitHub unreachable, etc."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def dispatch_workflow(
    *, repo_url: str, workflow_file: str, token: str, ref: str = "main", inputs: dict | None = None,
) -> None:
    """Triggers a `workflow_dispatch` run of `workflow_file` (e.g.
    "run-tests.yml", matched against its filename under
    .github/workflows/) on `ref` (branch/tag, defaults to "main"). The
    GitHub API returns no run id on success (204 No Content) — the caller
    must locate the newly created run separately via
    `find_latest_dispatched_run`, matched by timestamp, which is the
    documented workaround for this API's lack of a direct response body."""
    owner, repo = parse_owner_repo(repo_url)
    clean_workflow_file = workflow_file.strip().lstrip("/")
    if not clean_workflow_file:
        raise GithubWorkflowError("No workflow file configured for this item")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{clean_workflow_file}/dispatches"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    payload = {"ref": ref, "inputs": inputs or {}}
    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 204:
        return
    if response.status_code == 404:
        raise GithubWorkflowError(
            "Workflow file not found in the repository (or ref does not exist)", status_code=404
        )
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have permission to dispatch workflows on this repository "
            "(needs the 'workflow' scope / Actions: write)",
            status_code=403,
        )
    if response.status_code == 422:
        raise GithubWorkflowError(
            "GitHub rejected the dispatch request — check that the workflow declares "
            "'on: workflow_dispatch' and that any required inputs were provided",
            status_code=422,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def find_latest_dispatched_run(
    *, repo_url: str, workflow_file: str, token: str, dispatched_after: datetime,
) -> dict | None:
    """Looks up the run created by the most recent `dispatch_workflow` call
    for this workflow, by listing its runs (newest first) and returning the
    first one with event="workflow_dispatch" and created_at at or after
    `dispatched_after`. Returns None if no matching run shows up yet — the
    GitHub API can take a few seconds to register a fresh dispatch, so
    callers should retry rather than treat a single None as failure."""
    owner, repo = parse_owner_repo(repo_url)
    clean_workflow_file = workflow_file.strip().lstrip("/")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{clean_workflow_file}/runs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {"event": "workflow_dispatch", "per_page": 10}
    try:
        response = httpx.get(url, headers=headers, params=params, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code != 200:
        raise GithubWorkflowError(
            f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
        )

    for run in response.json().get("workflow_runs", []):
        created_at_raw = run.get("created_at", "")
        try:
            created_at = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
        except ValueError:
            continue
        if created_at >= dispatched_after:
            return run
    return None


def list_workflow_run_jobs(*, repo_url: str, token: str, run_id: int) -> list[dict]:
    """Lists the jobs (and each job's steps) for a run — GitHub's own run
    status (queued/in_progress/completed) has no percentage, but each step
    inside a job does have its own status/conclusion, so this is what lets
    the polling job approximate a "3 of 7 steps done" progress percentage
    without anything fancier than counting. Returns GitHub's raw job dicts
    (each with a "steps" list); an empty list means the run has no jobs yet
    (e.g. still queued, GitHub hasn't assigned a runner)."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.json().get("jobs", [])
    if response.status_code == 404:
        raise GithubWorkflowError("Workflow run not found", status_code=404)
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have read access to this repository", status_code=403,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def list_workflow_run_artifacts(*, repo_url: str, token: str, run_id: int) -> list[dict]:
    """Lists artifacts uploaded during a run (e.g. the pytest HTML report
    via actions/upload-artifact) — each dict includes at least "id", "name",
    "size_in_bytes", and "expired" (artifacts are deleted by GitHub after
    their retention window, default 90 days; an expired one can't be
    downloaded even though it still shows up here)."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.json().get("artifacts", [])
    if response.status_code == 404:
        raise GithubWorkflowError("Workflow run not found", status_code=404)
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have read access to this repository", status_code=403,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def get_job_logs(*, repo_url: str, token: str, job_id: int) -> str:
    """Fetches the full raw console log for one job — every step's stdout
    concatenated by GitHub itself, in the exact same format regardless of
    which test tool produced it (unlike scraping a report artifact, which
    only works for tools this codebase specifically recognizes). This is
    what actually contains a failing test's traceback or a service's
    printed response body, for the "detailed output" view.

    The REST endpoint responds with a redirect to a short-lived blob URL
    that serves the plain text directly — httpx needs follow_redirects=True
    since it doesn't follow by default (same pattern as
    download_artifact_zip above)."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.text
    if response.status_code == 404:
        raise GithubWorkflowError("No logs available for this job yet", status_code=404)
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have read access to this repository", status_code=403,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def download_artifact_zip(*, repo_url: str, token: str, artifact_id: int) -> bytes:
    """Downloads one artifact's zip archive (GitHub always packages
    uploaded artifacts as a zip, even a single-file one like the pytest HTML
    report) — the caller extracts whatever it needs from the archive. Uses
    the server's own token; the buyer never gets a GitHub URL or GitHub
    access, only these already-authenticated bytes proxied through our own
    API, same "we own the credential" posture as everywhere else this repo
    integrates with GitHub."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.content
    if response.status_code == 404:
        raise GithubWorkflowError("Artifact not found (it may have expired)", status_code=404)
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have read access to this repository", status_code=403,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def get_workflow_run(*, repo_url: str, token: str, run_id: int) -> dict:
    """Fetches one run's current state — dict includes at least "status"
    (queued/in_progress/completed), "conclusion" (success/failure/... once
    completed, else None), and "html_url" (the run's page on GitHub, used
    as the customer-facing report link). Used by the polling job to keep
    TestRun rows in sync."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs/{run_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubWorkflowError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.json()
    if response.status_code == 404:
        raise GithubWorkflowError("Workflow run not found", status_code=404)
    if response.status_code in (401, 403):
        raise GithubWorkflowError(
            "The GitHub token is missing or does not have read access to this repository", status_code=403,
        )
    raise GithubWorkflowError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )
