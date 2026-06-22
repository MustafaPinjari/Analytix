from rest_framework import permissions

class HasTenantContext(permissions.BasePermission):
    message = "An organization context must be supplied via the X-Organization-Id header."

    def has_permission(self, request, view):
        return request.tenant is not None


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user_org_role == "SUPER_ADMIN")
        )


class IsOrgAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user_org_role in ["SUPER_ADMIN", "ORG_ADMIN"]


class IsAnalyst(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user_org_role in ["SUPER_ADMIN", "ORG_ADMIN", "ANALYST"]


class IsViewer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user_org_role in ["SUPER_ADMIN", "ORG_ADMIN", "ANALYST", "VIEWER"]
