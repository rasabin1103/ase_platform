from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.core.media_storage import process_image_upload
from app.models.blog_post import BlogPost
from app.models.enums import BlogPostStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.blog_admin.schemas import (
    BlogPostAdminCreate,
    BlogPostAdminListResponse,
    BlogPostAdminRead,
    BlogPostAdminUpdate,
)
from app.modules.blog_admin.service import BlogAdminService
from app.modules.blog_engagement.schemas import CommentListResponse

router = APIRouter(prefix="/api/v1/admin/blog", tags=["blog-admin"])

# Blog content management is gated behind the same permission used for
# catalog content — this platform runs in MVP mode with only super_admin /
# independent_user roles, and require_permission() bypasses the specific
# code entirely for super_admin, so reusing "catalog.manage" here is
# equivalent to a dedicated "blog.manage" code without adding one.
_MANAGE = Depends(require_permission("catalog.manage"))


def get_service(db: Session = Depends(get_db)) -> BlogAdminService:
    return BlogAdminService(db)


@router.get("", response_model=BlogPostAdminListResponse, dependencies=[_MANAGE])
def list_blog_admin(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = None,
    tags: list[str] | None = Query(default=None),
    status_filter: BlogPostStatus | None = Query(default=None, alias="status"),
    svc: BlogAdminService = Depends(get_service),
):
    return svc.list(limit=limit, offset=offset, search=search, tags=tags, status_filter=status_filter)


@router.get("/tags", response_model=list[str], dependencies=[_MANAGE])
def list_blog_admin_tags(svc: BlogAdminService = Depends(get_service)):
    """Distinct tags across every post (any status) — powers the admin filter chips."""
    return svc.list_tags()


@router.post("/{post_id}/image", dependencies=[_MANAGE])
async def upload_blog_cover_image(
    post_id: int,
    file: UploadFile = File(...),
    svc: BlogAdminService = Depends(get_service),
):
    content = await file.read()
    try:
        content, mime = process_image_upload(content, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    svc.upload_cover_image(post_id, content, mime)
    return {"ok": True}


@router.delete("/{post_id}/image", dependencies=[_MANAGE])
def clear_blog_cover_image(post_id: int, svc: BlogAdminService = Depends(get_service)):
    svc.clear_cover_image(post_id)
    return {"ok": True}


@router.get("/{post_id}/image", dependencies=[_MANAGE])
def get_blog_cover_image_admin(post_id: int, db: Session = Depends(get_db)):
    post = db.get(BlogPost, post_id)
    if post is None or not post.cover_image_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    # See catalog_admin/router.py: admin editing views re-request this a lot.
    return Response(
        content=bytes(post.cover_image_data),
        media_type=post.cover_image_mime or "image/jpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )


@router.get("/{post_id}", response_model=BlogPostAdminRead, dependencies=[_MANAGE])
def get_blog_admin_post(post_id: int, svc: BlogAdminService = Depends(get_service)):
    return svc.get(post_id)


@router.post("", response_model=BlogPostAdminRead, status_code=201, dependencies=[_MANAGE])
def create_blog_post(
    payload: BlogPostAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: BlogAdminService = Depends(get_service),
):
    post = svc.create(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="blog_post.create",
        entity_type="blog_post",
        entity_id=str(post.id),
        metadata={"title": post.title, "status": post.status.value if hasattr(post.status, "value") else str(post.status)},
    )
    return post


@router.patch("/{post_id}", response_model=BlogPostAdminRead, dependencies=[_MANAGE])
def update_blog_post(
    post_id: int,
    payload: BlogPostAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: BlogAdminService = Depends(get_service),
):
    post = svc.update(post_id, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="blog_post.update",
        entity_type="blog_post",
        entity_id=str(post.id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return post


@router.get("/{post_id}/comments", response_model=CommentListResponse, dependencies=[_MANAGE])
def list_blog_comments_admin(post_id: int, svc: BlogAdminService = Depends(get_service)):
    """Raw, uncensored comment text for moderation — never the public,
    banned-words-censored version."""
    return svc.list_comments(post_id)


@router.delete("/{post_id}/comments/{comment_id}", status_code=204, dependencies=[_MANAGE])
def delete_blog_comment_admin(
    post_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    svc: BlogAdminService = Depends(get_service),
):
    """Admin can delete anyone's comment (moderation), not just their own."""
    svc.delete_comment(post_id, comment_id, admin_user_id=current_user.id)


@router.delete("/{post_id}", status_code=204, dependencies=[_MANAGE])
def delete_blog_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: BlogAdminService = Depends(get_service),
):
    post = svc.get(post_id)
    svc.delete(post_id)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="blog_post.delete",
        entity_type="blog_post",
        entity_id=str(post_id),
        metadata={"title": post.title},
    )
