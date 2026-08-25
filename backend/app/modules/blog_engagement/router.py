from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, get_current_user_optional, require_permission
from app.modules.blog_engagement.schemas import (
    CommentCreateRequest,
    CommentListResponse,
    CommentRead,
    ReactionCountsRead,
    ReactionSetRequest,
    ShareCountRead,
    ShareRequest,
)
from app.modules.blog_engagement.service import BlogEngagementService

router = APIRouter(prefix="/api/v1/public/blog", tags=["blog-engagement"])


def get_service(db: Session = Depends(get_db)) -> BlogEngagementService:
    return BlogEngagementService(db)


@router.get("/{slug}/comments", response_model=CommentListResponse)
def list_comments(
    slug: str,
    svc: BlogEngagementService = Depends(get_service),
    user: User | None = Depends(get_current_user_optional),
) -> CommentListResponse:
    """Public — anyone can read comments (censored for banned words), not
    just logged-in users. Only writing a comment requires login."""
    return svc.list_comments(slug, viewer_user_id=user.id if user else None, is_admin=False)


@router.post(
    "/{slug}/comments",
    response_model=CommentRead,
    status_code=201,
    dependencies=[Depends(require_permission("ratings.manage_own"))],
)
def create_comment(
    slug: str,
    payload: CommentCreateRequest,
    user: User = Depends(get_current_user),
    svc: BlogEngagementService = Depends(get_service),
) -> CommentRead:
    return svc.create_comment(slug, user_id=user.id, content=payload.content, parent_id=payload.parentId)


@router.delete(
    "/{slug}/comments/{comment_id}",
    status_code=204,
    dependencies=[Depends(require_permission("ratings.manage_own"))],
)
def delete_comment(
    slug: str,
    comment_id: int,
    user: User = Depends(get_current_user),
    svc: BlogEngagementService = Depends(get_service),
) -> None:
    """Deletes the caller's own comment. Admin moderation (deleting anyone's
    comment) goes through the separate blog_admin endpoint instead, which
    checks catalog.manage rather than comment ownership."""
    svc.delete_comment(slug, comment_id=comment_id, user_id=user.id, is_admin=False)


@router.get("/{slug}/reaction", response_model=ReactionCountsRead)
def get_reaction(
    slug: str,
    svc: BlogEngagementService = Depends(get_service),
    user: User | None = Depends(get_current_user_optional),
) -> ReactionCountsRead:
    return svc.get_reaction_counts(slug, viewer_user_id=user.id if user else None)


@router.post(
    "/{slug}/reaction",
    response_model=ReactionCountsRead,
    dependencies=[Depends(require_permission("ratings.manage_own"))],
)
def set_reaction(
    slug: str,
    payload: ReactionSetRequest,
    user: User = Depends(get_current_user),
    svc: BlogEngagementService = Depends(get_service),
) -> ReactionCountsRead:
    """Sending the same reaction twice clears it (unlike/undislike) — see
    BlogEngagementService.set_reaction."""
    return svc.set_reaction(slug, user_id=user.id, reaction=payload.reaction)


@router.delete(
    "/{slug}/reaction",
    response_model=ReactionCountsRead,
    dependencies=[Depends(require_permission("ratings.manage_own"))],
)
def remove_reaction(
    slug: str,
    user: User = Depends(get_current_user),
    svc: BlogEngagementService = Depends(get_service),
) -> ReactionCountsRead:
    return svc.remove_reaction(slug, user_id=user.id)


@router.post("/{slug}/share", response_model=ShareCountRead)
def log_share(
    slug: str,
    payload: ShareRequest,
    svc: BlogEngagementService = Depends(get_service),
) -> ShareCountRead:
    """No auth required — sharing (or clicking "copy link") shouldn't be
    gated behind login, anonymous visitors sharing the article still count."""
    return svc.log_share(slug, network=payload.network)
