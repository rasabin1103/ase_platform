from __future__ import annotations

from enum import Enum


class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    invited = "invited"
    suspended = "suspended"
    deleted = "deleted"


class OrganizationType(str, Enum):
    individual = "individual"
    business = "business"
    enterprise = "enterprise"
    academy = "academy"


class OrganizationStatus(str, Enum):
    active = "active"
    suspended = "suspended"


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


class CatalogPurchaseProvider(str, Enum):
    internal = "internal"
    amazon = "amazon"
    external = "external"
    request_only = "request_only"


class PricingPlanType(str, Enum):
    free = "free"
    one_time = "one_time"
    subscription = "subscription"
    lifetime = "lifetime"
    request_quote = "request_quote"


class PricingBillingInterval(str, Enum):
    none = "none"
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"


class PricingSupportLevel(str, Enum):
    none = "none"
    basic = "basic"
    priority = "priority"
    enterprise = "enterprise"


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
