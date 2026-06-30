from django.urls import path
from .views import (
    PageListAPIView, 
    SectionDetailAPIView, 
    AISectionRefinementView, 
    ResumeUploadAPIView, 
    AITemplateGeneratorView,
    PortfolioReviewAPIView  # ⚡ Step 1: Make sure this is imported
)

urlpatterns = [
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    path('ai-refinement/', AISectionRefinementView.as_view(), name='ai-refinement'),
    path('upload-resume/', ResumeUploadAPIView.as_view(), name='upload-resume'),
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-generate-template'),
    
    # ⚡ Step 2: Register the review analytics path endpoint
    path('portfolio-review/', PortfolioReviewAPIView.as_view(), name='portfolio-review'), 
]
