from django.urls import path
from .views import (
    GenerateFlashcardsView,
    GenerateSummaryView,
    GenerateMCQView,
    AIResourceListView,
    AIResourceDetailView,
)

urlpatterns = [
    path('generate-flashcards/', GenerateFlashcardsView.as_view(), name='ai-generate-flashcards'),
    path('generate-summary/', GenerateSummaryView.as_view(), name='ai-generate-summary'),
    path('generate-mcq/', GenerateMCQView.as_view(), name='ai-generate-mcq'),
    path('resources/', AIResourceListView.as_view(), name='ai-resource-list'),
    path('resources/<uuid:id>/', AIResourceDetailView.as_view(), name='ai-resource-detail'),
]
