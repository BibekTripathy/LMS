from rest_framework import permissions
from enrollments.models import Enrollment


class IsEnrolledInCourse(permissions.BasePermission):
    """
    Permission check to verify if the requesting student has an active enrollment
    in the course.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        # If obj is a Course
        if hasattr(obj, 'modules'):
            return Enrollment.objects.filter(
                student=user,
                course=obj,
                status='ACTIVE'
            ).exists()

        # If obj is an Enrollment
        if hasattr(obj, 'student') and hasattr(obj, 'course'):
            return obj.student == user and obj.status == 'ACTIVE'

        return False


class CanAccessAndModifyLessonProgress(permissions.BasePermission):
    """
    Object-level permission ensuring that students can only view or update
    their own lesson progress for courses they are actively enrolled in.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        # If obj is a Lesson
        if hasattr(obj, 'module') and hasattr(obj.module, 'course'):
            course = obj.module.course
            return Enrollment.objects.filter(
                student=user,
                course=course,
                status='ACTIVE'
            ).exists()

        # If obj is a LessonProgress
        if hasattr(obj, 'enrollment'):
            return (
                obj.enrollment.student == user and
                obj.enrollment.status == 'ACTIVE'
            )

        return False
