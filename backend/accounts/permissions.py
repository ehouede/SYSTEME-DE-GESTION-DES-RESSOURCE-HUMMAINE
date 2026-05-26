from rest_framework import permissions


class EstRH(permissions.BasePermission):
    """Allow access only to users with role 'RH' (Human Resources)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) == 'RH'


class EstManagerOuPlus(permissions.BasePermission):
    """Allow access to users with role 'MANAGER' or higher (e.g., 'RH', 'ADMIN')."""

    allowed_roles = {'MANAGER', 'RH', 'ADMIN'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', None) in self.allowed_roles


class EstProprietaireOuRH(permissions.BasePermission):
    """Allow access if the user is the owner of the object or has RH role.
    Expected view to define `get_object` returning an object with a `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if getattr(request.user, 'role', None) == 'RH':
            return True
        # Assume object has a `user` field referencing the owner
        return getattr(obj, 'user', None) == request.user
