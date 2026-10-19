from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from enrollments.models import Enrollment


class IsStudentOrAdmin(permissions.BasePermission):
    """
    Allows access to student-specific analytics only for users with
    the STUDENT or ADMIN role (or staff/superusers).
    Instructors who are not admins are rejected.
    """
    message = "Only students or administrators can access student analytics."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if getattr(request.user, 'role', '') == 'ADMIN' or request.user.is_staff or request.user.is_superuser:
            return True
        if getattr(request.user, 'role', '') == 'STUDENT':
            return True
        return False


class IsCourseInstructorOrAdmin(permissions.BasePermission):
    """
    Allows access only to the instructor who owns the course, or an admin.
    Students and instructors who do not own the course are denied.
    """
    message = "You can only view analytics for courses you own."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser:
            return True

        course = getattr(obj, 'course', obj)
        if getattr(user, 'role', '') == 'INSTRUCTOR' and getattr(course, 'instructor_id', None) == user.id:
            return True

        return False


class IsAdminOnly(permissions.BasePermission):
    """
    Allows access only to platform administrators (role ADMIN, staff, or superusers).
    Students and instructors are strictly denied.
    """
    message = "Only platform administrators can access admin analytics."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'role', '') == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )


class CanAccessQuizLeaderboard(permissions.BasePermission):
    """
    Allows access to a quiz leaderboard if:
    1. User is an admin or staff.
    2. User is the instructor owning the course.
    3. User is actively enrolled in the quiz's course.
    Draft quizzes return 404 to non-owner/non-admin.
    """
    message = "You must be enrolled in this course to view the quiz leaderboard."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, quiz):
        user = request.user
        if getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser:
            return True

        course = quiz.course
        if getattr(user, 'role', '') == 'INSTRUCTOR' and course.instructor_id == user.id:
            return True

        # Draft quizzes are invisible to anyone except course instructor and admins
        if quiz.status == 'DRAFT':
            raise NotFound('Quiz not found.')

        is_enrolled = Enrollment.objects.filter(
            student=user,
            course=course,
            status='ACTIVE'
        ).exists()
        if not is_enrolled:
            raise PermissionDenied("You must be enrolled in this course to view the quiz leaderboard.")

        return True
