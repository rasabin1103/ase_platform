from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.comment_filter import censor_text
from app.core.html_sanitize import sanitize_plain_text
from app.models.blog_post import BlogPost
from app.models.enums import BlogPostStatus, BlogReactionType, BlogShareNetwork
from app.modules.blog_engagement.repository import BlogEngagementRepository
from app.modules.blog_engagement.schemas import (
    CommentListResponse,
    CommentRead,
    ReactionCountsRead,
    ShareCountRead,
)
from app.modules.public_blog.repository import BlogRepository


class BlogEngagementService:
    def __init__(self, db: Session):
        self.db = db
        self.blog_repo = BlogRepository(db)
        self.repo = BlogEngagementRepository(db)

    def _require_published_post(self, slug: str) -> BlogPost:
        post = self.blog_repo.get_by_slug(slug)
        if post is None or post.status != BlogPostStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
        return post

    # --- comments -----------------------------------------------------------

    def list_comments(self, slug: str, *, viewer_user_id: int | None, is_admin: bool) -> CommentListResponse:
        post = self._require_published_post(slug)
        rows = self.repo.comments_for_post(post.id)

        nodes: dict[int, CommentRead] = {}
        top_level_ancestor: dict[int, int] = {}  # comment_id -> id of its nearest top-level ancestor
        for comment, display_name, first, last in rows:
            author = display_name or " ".join(p for p in (first, last) if p).strip() or "Usuario ASE"
            content = comment.content if is_admin else censor_text(comment.content)
            is_own = viewer_user_id is not None and comment.user_id == viewer_user_id
            nodes[comment.id] = CommentRead(
                id=comment.id,
                authorName=author,
                content=content,
                createdAt=comment.created_at,
                parentId=comment.parent_id,
                isOwn=is_own,
                canDelete=is_own or is_admin,
                replies=[],
            )

        # Resolve each comment to its nearest top-level ancestor (walking up
        # parent_id chains), so any accidental multi-level reply still shows
        # up flattened under the right top-level thread — the UI only ever
        # offers replying to a top-level comment, but this stays correct
        # even if that ever changes.
        def _ancestor(comment_id: int) -> int:
            if comment_id in top_level_ancestor:
                return top_level_ancestor[comment_id]
            node = nodes.get(comment_id)
            if node is None or node.parentId is None:
                top_level_ancestor[comment_id] = comment_id
                return comment_id
            result = _ancestor(node.parentId)
            top_level_ancestor[comment_id] = result
            return result

        top_level: list[CommentRead] = []
        for comment, *_rest in rows:
            node = nodes[comment.id]
            if node.parentId is None:
                top_level.append(node)
            else:
                ancestor_id = _ancestor(comment.id)
                ancestor = nodes.get(ancestor_id)
                if ancestor is not None and ancestor_id != comment.id:
                    ancestor.replies.append(node)

        return CommentListResponse(comments=top_level, total=len(rows))

    def create_comment(self, slug: str, *, user_id: int, content: str, parent_id: int | None) -> CommentRead:
        post = self._require_published_post(slug)
        cleaned = sanitize_plain_text(content)
        if not cleaned:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment cannot be empty")

        if parent_id is not None:
            parent = self.repo.get_comment(parent_id)
            if parent is None or parent.blog_post_id != post.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")

        comment = self.repo.add_comment(blog_post_id=post.id, user_id=user_id, content=cleaned, parent_id=parent_id)
        self.db.commit()

        from app.modules.users.repository import UsersRepository

        user = UsersRepository(self.db).get_by_id(user_id)
        author = "Usuario ASE"
        if user is not None:
            author = user.display_name or " ".join(p for p in (user.first_name, user.last_name) if p).strip() or "Usuario ASE"

        return CommentRead(
            id=comment.id,
            authorName=author,
            content=comment.content,
            createdAt=comment.created_at,
            parentId=comment.parent_id,
            isOwn=True,
            canDelete=True,
            replies=[],
        )

    def delete_comment(self, slug: str, *, comment_id: int, user_id: int, is_admin: bool) -> None:
        post = self._require_published_post(slug)
        comment = self.repo.get_comment(comment_id)
        if comment is None or comment.blog_post_id != post.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        if not is_admin and comment.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments")
        self.repo.delete_comment(comment)
        self.db.commit()

    # --- reactions --------------------------------------------------------

    def _counts(self, post: BlogPost, *, viewer_user_id: int | None) -> ReactionCountsRead:
        likes, dislikes = self.repo.reaction_counts_for_post(post.id)
        my_reaction = None
        if viewer_user_id is not None:
            existing = self.repo.get_reaction(blog_post_id=post.id, user_id=viewer_user_id)
            my_reaction = existing.reaction if existing is not None else None
        return ReactionCountsRead(likesCount=likes, dislikesCount=dislikes, myReaction=my_reaction)

    def get_reaction_counts(self, slug: str, *, viewer_user_id: int | None) -> ReactionCountsRead:
        post = self._require_published_post(slug)
        return self._counts(post, viewer_user_id=viewer_user_id)

    def set_reaction(self, slug: str, *, user_id: int, reaction: BlogReactionType) -> ReactionCountsRead:
        post = self._require_published_post(slug)
        existing = self.repo.get_reaction(blog_post_id=post.id, user_id=user_id)
        if existing is not None and existing.reaction == reaction:
            # Clicking the same reaction again clears it — that's how the
            # frontend toggle button is meant to behave.
            self.repo.delete_reaction(existing)
        else:
            self.repo.upsert_reaction(blog_post_id=post.id, user_id=user_id, reaction=reaction)
        self.db.commit()
        return self._counts(post, viewer_user_id=user_id)

    def remove_reaction(self, slug: str, *, user_id: int) -> ReactionCountsRead:
        post = self._require_published_post(slug)
        existing = self.repo.get_reaction(blog_post_id=post.id, user_id=user_id)
        if existing is not None:
            self.repo.delete_reaction(existing)
            self.db.commit()
        return self._counts(post, viewer_user_id=user_id)

    # --- shares -----------------------------------------------------------

    def log_share(self, slug: str, *, network: BlogShareNetwork) -> ShareCountRead:
        post = self._require_published_post(slug)
        self.repo.log_share(blog_post_id=post.id, network=network)
        self.db.commit()
        total = self.repo.share_totals_for_posts([post.id]).get(post.id, 0)
        return ShareCountRead(total=total)
