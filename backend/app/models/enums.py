from __future__ import annotations

from enum import Enum


class UserStatus(str, Enum):
    active = "active"
    invited = "invited"
    suspended = "suspended"
    deleted = "deleted"


class SuspensionReason(str, Enum):
    """Why an automated account-lifecycle sweep suspended a user (see
    app/core/account_lifecycle.py). ``None`` on the user row means either
    never suspended, or suspended manually by an admin (pre-existing
    behavior, unrelated to this policy)."""

    two_factor_required = "two_factor_required"
    inactivity = "inactivity"


class OrganizationType(str, Enum):
    individual = "individual"
    business = "business"
    enterprise = "enterprise"
    academy = "academy"


class OrganizationStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    deleted = "deleted"


class MembershipStatus(str, Enum):
    invited = "invited"
    active = "active"
    suspended = "suspended"


class RoleScope(str, Enum):
    platform = "platform"
    organization = "organization"
    personal_workspace = "personal_workspace"
    product = "product"


class AccessRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class AccessRequestType(str, Enum):
    product_access = "product_access"
    demo_access = "demo_access"
    creator_access = "creator_access"
    course_access = "course_access"
    resource_access = "resource_access"
    operational = "operational"
    creator_application = "creator_application"
    product_creator_application = "product_creator_application"
    course_creator_application = "course_creator_application"


class AccessTargetType(str, Enum):
    product = "product"
    course = "course"
    book = "book"
    resource = "resource"
    platform_creator_permission = "platform_creator_permission"


class CreatorStatus(str, Enum):
    none = "none"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AccessRequestPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class ResourceAssignmentStatus(str, Enum):
    active = "active"
    revoked = "revoked"
    expired = "expired"


class CatalogItemType(str, Enum):
    product = "product"
    course = "course"
    book = "book"
    resource = "resource"


class CatalogItemStatus(str, Enum):
    draft = "draft"
    published = "published"
    coming_soon = "coming_soon"
    request_only = "request_only"


class CatalogItemLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class PricingPillarCode(str, Enum):
    """The 5 structural pillars of the pricing engine — fixed by design
    (not admin-creatable/deletable), mirroring CatalogItemType plus
    "service" for the standalone Service model. Each pillar has an
    admin-configurable base price plus an arbitrary set of
    PricingDimensionType "subelementos" (subtipo, complejidad,
    funcionalidad, páginas, horas...) — every one of them just multiplies
    into the final price, there is no separate subcategory concept — see
    app/models/pricing_dimension_type.py and
    app/models/pricing_dimension_level.py."""

    product = "product"
    course = "course"
    book = "book"
    resource = "resource"
    service = "service"


class BillingCycle(str, Enum):
    monthly = "monthly"
    yearly = "yearly"
    one_time = "one_time"


class SubscriptionProvider(str, Enum):
    stripe = "stripe"
    manual = "manual"


class SubscriptionStatus(str, Enum):
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    expired = "expired"


class ConsultingSlotStatus(str, Enum):
    """Lifecycle of a single bookable QA-consulting time slot. `open` slots
    are admin-created and visible to any authenticated user; `booked` means
    a user has claimed it; cancelling a booking resets the slot back to
    `open` rather than using a separate `cancelled` state, so it becomes
    bookable again — `cancelled` is reserved for slots the admin pulls
    entirely (e.g. no longer available) rather than freed-up bookings."""

    open = "open"
    booked = "booked"
    cancelled = "cancelled"


class LoyaltyTier(str, Enum):
    """Reward tier based on how many consecutive 6-month milestones a user
    has reached as an active subscriber (see app/core/loyalty.py). Ordered
    low to high — thresholds live alongside the sweep logic, not here."""

    silver = "silver"
    gold = "gold"
    platinum = "platinum"
    infinite = "infinite"


class ProductStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class AccessLevel(str, Enum):
    read = "read"
    write = "write"
    admin = "admin"
    full = "full"


class CourseStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class EnrollmentStatus(str, Enum):
    active = "active"
    completed = "completed"
    canceled = "canceled"


class InvitationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    expired = "expired"


class OrganizationJoinRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class OrganizationMemberInviteStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    cancelled = "cancelled"


class ServiceCategory(str, Enum):
    platform_engineering = "platform_engineering"
    qa_automation = "qa_automation"
    training = "training"
    digital_products = "digital_products"
    consulting = "consulting"
    ai_automation = "ai_automation"
    frameworks = "frameworks"


class ServiceKind(str, Enum):
    service = "service"
    product = "product"
    framework = "framework"
    course = "course"
    book = "book"


class ServicePriceType(str, Enum):
    free = "free"
    fixed = "fixed"
    subscription = "subscription"
    custom = "custom"


class BlogPostStatus(str, Enum):
    draft = "draft"
    published = "published"


class BlogReactionType(str, Enum):
    like = "like"
    dislike = "dislike"


class BlogShareNetwork(str, Enum):
    linkedin = "linkedin"
    twitter = "twitter"
    facebook = "facebook"
    whatsapp = "whatsapp"
    instagram = "instagram"
    copy_link = "copy_link"
    native = "native"


class UserTokenPurpose(str, Enum):
    """What a `UserVerificationToken` row is for — kept as a single table
    with a purpose column instead of two near-identical tables."""

    password_reset = "password_reset"
    email_verification = "email_verification"


class ApiCredentialStatus(str, Enum):
    """A revoked credential's row is kept (not deleted) so past TestRun rows
    still resolve who triggered them — see ApiCredential."""

    active = "active"
    revoked = "revoked"


class TestRunStatus(str, Enum):
    """Mirrors a GitHub Actions workflow run's lifecycle (its own `status`
    field: queued -> in_progress -> completed). `pending` is our own
    pre-dispatch state, set the instant a run is accepted against quota but
    before the GitHub Actions API call has been confirmed."""

    pending = "pending"
    queued = "queued"
    in_progress = "in_progress"
    completed = "completed"
    failed_to_dispatch = "failed_to_dispatch"


class TestRunConclusion(str, Enum):
    """Mirrors a GitHub Actions workflow run's `conclusion` field — only
    meaningful once `TestRunStatus.completed`. Null on the row until then."""

    success = "success"
    failure = "failure"
    cancelled = "cancelled"
    timed_out = "timed_out"
    action_required = "action_required"
    unknown = "unknown"
