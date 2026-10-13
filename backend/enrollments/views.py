from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import Enrollment
from .serializers import EnrollmentSerializer
from courses.models import Course
from courses.permissions import IsCourseOwnerOrAdmin

class CourseEnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        course = get_object_or_404(Course, id=id)
        user = request.user

        # Prevent duplicate enrollment
        if Enrollment.objects.filter(student=user, course=course).exists():
            return Response(
                {
                    "error": "Already enrolled in this course",
                    "code": "ALREADY_ENROLLED"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure course is published unless user is admin or course instructor
        if not course.is_published and not (user.role == 'ADMIN' or user.is_staff or course.instructor == user):
            return Response(
                {
                    "error": "Cannot enroll in an unpublished course",
                    "code": "COURSE_NOT_PUBLISHED"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            enrollment = Enrollment.objects.create(
                student=user,
                course=course,
                status='ACTIVE'
            )
        except IntegrityError:
            return Response(
                {
                    "error": "Already enrolled in this course",
                    "code": "ALREADY_ENROLLED"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            EnrollmentSerializer(enrollment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class MyEnrollmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = Enrollment.objects.filter(
            student=request.user
        ).select_related('course', 'course__instructor')
        
        serializer = EnrollmentSerializer(enrollments, many=True, context={'request': request})
        return Response(serializer.data)


class CourseStudentsView(APIView):
    permission_classes = [IsCourseOwnerOrAdmin]

    def get(self, request, id):
        course = get_object_or_404(Course, id=id)
        self.check_object_permissions(request, course)

        enrollments = Enrollment.objects.filter(
            course=course
        ).select_related('student')

        serializer = EnrollmentSerializer(enrollments, many=True, context={'request': request})
        return Response(serializer.data)
