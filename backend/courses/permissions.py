from rest_framework import permissions
from enrollments.models import Enrollment

class IsInstructorOrAdmin(permissions.BasePermission):
    """
    Allows access only to authenticated users with role INSTRUCTOR or ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['INSTRUCTOR', 'ADMIN'] or request.user.is_staff or request.user.is_superuser)
        )


class IsCourseOwnerOrAdmin(permissions.BasePermission):
    """
    Allows access only to the instructor who owns the course, or an admin.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True
            
        # Determine owner depending on object type
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user
        elif hasattr(obj, 'course'):
            return obj.course.instructor == request.user
        elif hasattr(obj, 'module'):
            return obj.module.course.instructor == request.user
            
        return False


class CanAccessLesson(permissions.BasePermission):
    """
    Allows lesson content access if:
    1. User is the course instructor or an admin, OR
    2. User is enrolled in the lesson's course.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return True
            
        course = obj.module.course
        if course.instructor == user:
            return True
            
        # Check active enrollment
        return Enrollment.objects.filter(
            student=user,
            course=course,
            status='ACTIVE'
        ).exists()
