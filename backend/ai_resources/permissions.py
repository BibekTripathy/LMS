from rest_framework import permissions
from enrollments.models import Enrollment

class CanRequestAIResourceForLesson(permissions.BasePermission):
    """
    Ensures the user is authorized to request AI resources for a given lesson:
    1. Admins / Staff always allowed.
    2. Course instructors allowed.
    3. Students must have an ACTIVE enrollment in the course containing the lesson.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, lesson):
        user = request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return True

        course = lesson.module.course
        if course.instructor == user:
            return True

        return Enrollment.objects.filter(
            student=user,
            course=course,
            status='ACTIVE'
        ).exists()


class IsResourceOwnerOrAdmin(permissions.BasePermission):
    """
    Ensures that only the student who requested/owns the AIResource or an admin can access it.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return True
        return obj.student == user
