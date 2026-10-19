from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/v1/', include('users.urls')),
    path('api/v1/', include('courses.urls')),
    path('api/v1/', include('enrollments.urls')),
    path('api/v1/', include('progress.urls')),
    path('api/v1/', include('assessments.urls')),
    path('api/v1/', include('ai_study.urls')),
    path('api/v1/', include('analytics.urls')),
]
