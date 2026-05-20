"""
Physical delete: remove all rows that reference a user before deleting the user row.

Order respects FK RESTRICT / SET NULL. Optional tables are skipped when not deployed.
"""

from __future__ import annotations

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.schema_checks import table_exists
from app.models.enums import OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember


def cascade_delete_user_dependencies(
    db: Session,
    user_id: int,
    *,
    reassign_org_owner_to: int | None,
) -> None:
    _delete_user_leaf_rows(db, user_id)
    _nullify_user_references(db, user_id)
    _delete_user_membership_graph(db, user_id)
    _delete_invitations_sent_by_user(db, user_id)
    _delete_owned_organizations(db, user_id, reassign_org_owner_to=reassign_org_owner_to)
    db.flush()


def _delete_user_leaf_rows(db: Session, user_id: int) -> None:
    """Tables with user_id FK and ondelete=CASCADE (explicit for clarity)."""
    if table_exists(db, "catalog_favorites"):
        from app.models.catalog_favorite import CatalogFavorite

        db.execute(delete(CatalogFavorite).where(CatalogFavorite.user_id == user_id))

    if table_exists(db, "catalog_purchases"):
        from app.models.catalog_purchase import CatalogPurchase

        db.execute(delete(CatalogPurchase).where(CatalogPurchase.user_id == user_id))

    if table_exists(db, "course_enrollments"):
        from app.models.course_enrollment import CourseEnrollment

        db.execute(delete(CourseEnrollment).where(CourseEnrollment.user_id == user_id))

    if table_exists(db, "courses"):
        from app.models.course import Course
        from app.models.course_enrollment import CourseEnrollment

        personal_course_ids = select(Course.id).where(
            Course.owner_user_id == user_id,
            Course.organization_id.is_(None),
        )
        db.execute(delete(CourseEnrollment).where(CourseEnrollment.course_id.in_(personal_course_ids)))
        db.execute(delete(Course).where(Course.id.in_(personal_course_ids)))

    if table_exists(db, "resource_assignments"):
        from app.models.resource_assignment import ResourceAssignment

        db.execute(
            delete(ResourceAssignment).where(ResourceAssignment.assigned_to_user_id == user_id)
        )

    if table_exists(db, "access_requests"):
        from app.models.access_request import AccessRequest

        db.execute(delete(AccessRequest).where(AccessRequest.requested_by_user_id == user_id))


def _nullify_user_references(db: Session, user_id: int) -> None:
    """FKs with ondelete=SET NULL — clear before user row delete."""
    if table_exists(db, "access_requests"):
        from app.models.access_request import AccessRequest

        db.execute(
            update(AccessRequest)
            .where(AccessRequest.reviewed_by_user_id == user_id)
            .values(reviewed_by_user_id=None)
        )

    if table_exists(db, "resource_assignments"):
        from app.models.resource_assignment import ResourceAssignment

        db.execute(
            update(ResourceAssignment)
            .where(ResourceAssignment.assigned_by_user_id == user_id)
            .values(assigned_by_user_id=None)
        )

    if table_exists(db, "courses"):
        from app.models.course import Course

        db.execute(
            update(Course).where(Course.owner_user_id == user_id).values(owner_user_id=None)
        )

    if table_exists(db, "products"):
        from app.models.product import Product

        db.execute(
            update(Product).where(Product.owner_user_id == user_id).values(owner_user_id=None)
        )

    if table_exists(db, "audit_logs"):
        from app.models.audit_log import AuditLog

        db.execute(
            update(AuditLog).where(AuditLog.actor_user_id == user_id).values(actor_user_id=None)
        )


def _delete_user_membership_graph(db: Session, user_id: int) -> None:
    """
    member_roles.assigned_by_user_id is RESTRICT — remove all roles tied to the user
    (as assigner or as member) before memberships / user row are removed.
    """
    member_ids = select(OrganizationMember.id).where(OrganizationMember.user_id == user_id)

    db.execute(delete(MemberRole).where(MemberRole.organization_member_id.in_(member_ids)))
    db.execute(delete(MemberRole).where(MemberRole.assigned_by_user_id == user_id))
    db.execute(delete(OrganizationMember).where(OrganizationMember.user_id == user_id))


def _delete_invitations_sent_by_user(db: Session, user_id: int) -> None:
    if not table_exists(db, "invitations"):
        return
    from app.models.invitation import Invitation

    db.execute(delete(Invitation).where(Invitation.invited_by_user_id == user_id))


def _delete_owned_organizations(
    db: Session,
    user_id: int,
    *,
    reassign_org_owner_to: int | None,
) -> None:
    owned_orgs = list(
        db.execute(select(Organization).where(Organization.owner_user_id == user_id)).scalars().all()
    )
    for org in owned_orgs:
        if org.type == OrganizationType.individual:
            _delete_organization_tree(db, org)
        elif reassign_org_owner_to is not None:
            org.owner_user_id = reassign_org_owner_to


def _delete_organization_tree(db: Session, org: Organization) -> None:
    """Remove an individual org and its dependents (members, roles, catalog, etc.)."""
    org_id = org.id

    if table_exists(db, "invitations"):
        from app.models.invitation import Invitation

        db.execute(delete(Invitation).where(Invitation.organization_id == org_id))

    if table_exists(db, "access_requests"):
        from app.models.access_request import AccessRequest

        db.execute(delete(AccessRequest).where(AccessRequest.organization_id == org_id))

    if table_exists(db, "resource_assignments"):
        from app.models.resource_assignment import ResourceAssignment

        db.execute(delete(ResourceAssignment).where(ResourceAssignment.organization_id == org_id))

    member_ids = select(OrganizationMember.id).where(OrganizationMember.organization_id == org_id)
    db.execute(delete(MemberRole).where(MemberRole.organization_member_id.in_(member_ids)))
    db.execute(delete(OrganizationMember).where(OrganizationMember.organization_id == org_id))

    if table_exists(db, "subscriptions"):
        from app.models.subscription import Subscription

        db.execute(delete(Subscription).where(Subscription.organization_id == org_id))

    if table_exists(db, "courses"):
        from app.models.course import Course
        from app.models.course_enrollment import CourseEnrollment

        course_ids = select(Course.id).where(Course.organization_id == org_id)
        db.execute(delete(CourseEnrollment).where(CourseEnrollment.course_id.in_(course_ids)))
        db.execute(delete(Course).where(Course.organization_id == org_id))

    db.execute(delete(Organization).where(Organization.id == org_id))
