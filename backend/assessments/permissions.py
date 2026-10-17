from rest_framework import permissions
from enrollments.models import Enrollment


class CanAccessQuiz(permissions.BasePermission):
    """
    Object-level permission allowing access to a quiz if:
    1. User is an admin or staff.
    2. User is the course instructor.
    3. User is actively enrolled in the quiz's course.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser:
            return True

        course = getattr(obj, 'course', None)
        if not course and hasattr(obj, 'quiz'):
            course = obj.quiz.course

        if not course:
            return False

        if course.instructor == user:
            return True

        return Enrollment.objects.filter(
            student=user,
            course=course,
            status='ACTIVE'
        ).exists()


class IsAttemptStudent(permissions.BasePermission):
    """
    Object-level permission ensuring that only the student who started the attempt
    can view, edit, or submit it.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return obj.student == user
