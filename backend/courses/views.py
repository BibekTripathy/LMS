from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max

from .models import Course, Module, Lesson
from .serializers import (
    CourseSerializer,
    CourseDetailSerializer,
    ModuleSerializer,
    LessonSerializer
)
from .permissions import IsInstructorOrAdmin, IsCourseOwnerOrAdmin, CanAccessLesson
from enrollments.models import Enrollment

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'category']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstructorOrAdmin()]
        return [AllowAny()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated:
            context['user_enrolled_courses'] = set(
                Enrollment.objects.filter(student=user, status='ACTIVE').values_list('course_id', flat=True)
            )
        return context

    def get_queryset(self):
        queryset = Course.objects.all().select_related('instructor').annotate(
            annotated_modules_count=Count('modules', distinct=True),
            annotated_lessons_count=Count('modules__lessons', distinct=True)
        )
        user = self.request.user
        
        # Check if user requested their authored courses
        my_courses = self.request.query_params.get('my_courses', '').lower() in ['true', '1']
        if my_courses and user.is_authenticated:
            queryset = queryset.filter(instructor=user)
        else:
            # For public listing, only show published courses unless user is admin or owner
            status_param = self.request.query_params.get('status')
            if user.is_authenticated and (user.role == 'ADMIN' or user.is_staff):
                if status_param:
                    queryset = queryset.filter(status=status_param.upper())
            else:
                queryset = queryset.filter(is_published=True)

        # Category and difficulty filters
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty__iexact=difficulty)

        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all().select_related('instructor').prefetch_related('modules__lessons')
    serializer_class = CourseDetailSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsCourseOwnerOrAdmin()]
        return [AllowAny()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated:
            context['user_enrolled_courses'] = set(
                Enrollment.objects.filter(student=user, status='ACTIVE').values_list('course_id', flat=True)
            )
        return context


class CoursePublishView(APIView):
    permission_classes = [IsCourseOwnerOrAdmin]

    def post(self, request, id):
        course = get_object_or_404(Course, id=id)
        self.check_object_permissions(request, course)
        course.is_published = True
        course.status = 'PUBLISHED'
        course.save()
        return Response(CourseDetailSerializer(course, context={'request': request}).data)


class CourseArchiveView(APIView):
    permission_classes = [IsCourseOwnerOrAdmin]

    def post(self, request, id):
        course = get_object_or_404(Course, id=id)
        self.check_object_permissions(request, course)
        course.is_published = False
        course.status = 'ARCHIVED'
        course.save()
        return Response(CourseDetailSerializer(course, context={'request': request}).data)


class CourseModulesView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCourseOwnerOrAdmin()]
        return [AllowAny()]

    def get(self, request, id):
        course = get_object_or_404(Course, id=id)
        modules = course.modules.all().prefetch_related('lessons')
        return Response(ModuleSerializer(modules, many=True, context={'request': request}).data)

    def post(self, request, id):
        course = get_object_or_404(Course, id=id)
        self.check_object_permissions(request, course)
        
        data = request.data.copy()
        data['course'] = str(course.id)
        if 'order' not in data and 'position' not in data:
            last_order = course.modules.aggregate(Max('order'))['order__max'] or 0
            data['order'] = last_order + 1

        serializer = ModuleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Module.objects.all().prefetch_related('lessons')
    serializer_class = ModuleSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsCourseOwnerOrAdmin()]
        return [AllowAny()]


class ModuleLessonsView(APIView):
    permission_classes = [IsCourseOwnerOrAdmin]

    def post(self, request, id):
        module = get_object_or_404(Module, id=id)
        self.check_object_permissions(request, module)
        
        data = request.data.copy()
        data['module'] = str(module.id)
        if 'order' not in data and 'position' not in data:
            last_order = module.lessons.aggregate(Max('order'))['order__max'] or 0
            data['order'] = last_order + 1

        serializer = LessonSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(module=module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.all().select_related('module__course')
    serializer_class = LessonSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsCourseOwnerOrAdmin()]
        return [CanAccessLesson()]
