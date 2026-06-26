from django.urls import path
from .views import (
    PageListAPIView, 
    SectionDetailAPIView, 
    AIRefinementPromptAPIView, 
    AISectionRefinementView,
    AITemplateGeneratorView # <-- Add this import
)

urlpatterns = [
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    path('ai-prompt/', AIRefinementPromptAPIView.as_view(), name='ai-prompt'),
    path('ai-refinement/', AISectionRefinementView.as_view(), name='ai-refinement'),
    
    # New Magic Blueprint Generator Loop Link
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-generate-template'),
]
