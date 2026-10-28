from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.academy_run import AcademyRun
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus
from app.models.user import User
from app.modules.academy.schemas import (
    AcademyCourseAccessRead,
    AcademyRunListResponse,
    AcademyRunRead,
    AcademyRunSummary,
    AcademyRunWrite,
    AcademySeriesCourseRead,
    AcademySeriesRead,
)
from app.modules.auth.dependencies import is_super_admin
from app.modules.consumer_catalog.service import CONSUMER_DETAIL_STATUSES, ConsumerCatalogService


class AcademyService:
    def __init__(self, db: Session):
        self.db = db

    def find_catalog_item(self, course_key: str) -> CatalogItem | None:
        """Visible catalog item linked to this simulator course. If several
        exist (e.g. a re-edition), the published one wins, then the newest."""
        stmt = (
            select(CatalogItem)
            .where(
                CatalogItem.academy_course_key == course_key,
                CatalogItem.status.in_(CONSUMER_DETAIL_STATUSES),
            )
            .order_by(
                case((CatalogItem.status == CatalogItemStatus.published, 0), else_=1),
                CatalogItem.id.desc(),
            )
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_access(self, course_key: str, user: User | None) -> AcademyCourseAccessRead:
        key = course_key.strip().lower()
        item = self.find_catalog_item(key)
        authenticated = user is not None
        if item is None:
            return AcademyCourseAccessRead(
                courseKey=key,
                linked=False,
                authenticated=authenticated,
                hasAccess=bool(user and is_super_admin(self.db, user)),
            )
        is_free = self._is_free(item)
        has_access = self._has_access(item, user, purchased=None)
        return AcademyCourseAccessRead(
            courseKey=key,
            linked=True,
            catalogSlug=item.slug,
            catalogType=item.type,
            catalogStatus=item.status,
            title=item.title,
            trailerUrl=item.trailer_url,
            price=item.price,
            currency=item.currency,
            isFree=is_free,
            authenticated=authenticated,
            hasAccess=has_access,
        )

    @staticmethod
    def _is_free(item: CatalogItem) -> bool:
        return item.price is None or item.price <= 0

    def _has_access(self, item: CatalogItem, user: User | None, *, purchased: set[str] | None) -> bool:
        # Regla comercial: sin precio (0) y publicado → curso completo gratis
        # para quien tenga cuenta (registrarse es el «precio»). Con precio → el
        # resto requiere comprarlo (o un plan). En los dos casos la primera
        # misión es una demo abierta sin cuenta (lo decide el frontend).
        if user is None:
            return False
        if self._is_free(item) and item.status == CatalogItemStatus.published:
            return True
        if is_super_admin(self.db, user):
            return True
        if purchased is None:
            purchased = ConsumerCatalogService(self.db).purchased_slugs(user.id)
        return item.slug in purchased

    def get_series(self, course_key: str, user: User | None) -> AcademySeriesRead:
        """Todos los cursos de la serie del curso (vistos o no), en orden, con
        el acceso y el progreso del usuario en cada uno."""
        key = course_key.strip().lower()
        item = self.find_catalog_item(key)
        if item is None or not item.series_name:
            return AcademySeriesRead(courseKey=key)
        catalog = ConsumerCatalogService(self.db)
        siblings = catalog.repo.series_siblings(item.series_name, statuses=CONSUMER_DETAIL_STATUSES)
        purchased = catalog.purchased_slugs(user.id) if user is not None else set()
        progress: dict[str, tuple[int, int]] = {}
        keys = [s.academy_course_key for s in siblings if s.academy_course_key]
        if user is not None and keys:
            rows = self.db.execute(
                select(
                    AcademyRun.course_key,
                    func.count(AcademyRun.id),
                    func.count(case((AcademyRun.finished.is_(True), 1))),
                )
                .where(AcademyRun.user_id == user.id, AcademyRun.course_key.in_(keys))
                .group_by(AcademyRun.course_key)
            ).all()
            progress = {r[0]: (int(r[1]), int(r[2])) for r in rows}
        items = []
        for sib in siblings:
            started, finished = progress.get(sib.academy_course_key or "", (0, 0))
            items.append(
                AcademySeriesCourseRead(
                    catalogSlug=sib.slug,
                    catalogType=sib.type,
                    catalogStatus=sib.status,
                    courseKey=sib.academy_course_key,
                    title=sib.title,
                    titleEn=sib.title_en,
                    seriesOrder=sib.series_order,
                    price=sib.price,
                    currency=sib.currency,
                    isFree=self._is_free(sib),
                    hasAccess=self._has_access(sib, user, purchased=purchased),
                    isCurrent=sib.id == item.id,
                    missionsStarted=started,
                    missionsFinished=finished,
                )
            )
        return AcademySeriesRead(courseKey=key, seriesName=item.series_name, items=items)


class AcademyRunService:
    """Saved progress per (user, course, mission). See AcademyRun."""

    def __init__(self, db: Session):
        self.db = db

    def _get(self, user_id: int, course_key: str, mission_id: str) -> AcademyRun | None:
        return self.db.execute(
            select(AcademyRun).where(
                AcademyRun.user_id == user_id,
                AcademyRun.course_key == course_key,
                AcademyRun.mission_id == mission_id,
            )
        ).scalar_one_or_none()

    @staticmethod
    def _to_read(run: AcademyRun) -> AcademyRunRead:
        return AcademyRunRead(
            courseKey=run.course_key,
            missionId=run.mission_id,
            seed=run.seed,
            actions=run.actions_json or [],
            finished=run.finished,
            finishedAt=run.finished_at,
            updatedAt=run.updated_at,
        )

    def get(self, user_id: int, course_key: str, mission_id: str) -> AcademyRunRead | None:
        run = self._get(user_id, course_key, mission_id)
        return self._to_read(run) if run else None

    def save(self, user_id: int, course_key: str, mission_id: str, payload: AcademyRunWrite) -> AcademyRunRead:
        run = self._get(user_id, course_key, mission_id)
        if run is None:
            run = AcademyRun(user_id=user_id, course_key=course_key, mission_id=mission_id, seed=payload.seed)
            self.db.add(run)
        run.seed = payload.seed
        run.actions_json = payload.actions
        if payload.finished and not run.finished:
            run.finished_at = datetime.now(timezone.utc)
        if not payload.finished:
            run.finished_at = None
        run.finished = payload.finished
        self.db.commit()
        self.db.refresh(run)
        return self._to_read(run)

    def list_for_course(self, user_id: int, course_key: str) -> AcademyRunListResponse:
        runs = self.db.execute(
            select(AcademyRun).where(AcademyRun.user_id == user_id, AcademyRun.course_key == course_key)
        ).scalars().all()
        return AcademyRunListResponse(
            courseKey=course_key,
            items=[
                AcademyRunSummary(
                    missionId=r.mission_id,
                    finished=r.finished,
                    actionsCount=len(r.actions_json or []),
                    updatedAt=r.updated_at,
                )
                for r in runs
            ],
        )
