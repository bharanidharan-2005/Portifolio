from django.urls import path
from .views import (
    PageListAPIView, 
    SectionDetailAPIView, 
    AISectionRefinementView, 
    AITemplateGeneratorView,
    ResumeUploadAPIView  # ⚡ ENSURE THIS IS IMPORTED CLEANLY
)

urlpatterns = [
    # 🧭 Canvas Structural Layout Sync Paths
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    
    # 🤖 AI Prompt / Single Section Fine-Tuning Channel
    path('ai-refinement/', AISectionRefinementView.as_view(), name='ai-refinement'),
    
    # 🚀 Master Full-Resume Sync Parser Matrix Channel
    path('upload-resume/', ResumeUploadAPIView.as_view(), name='upload-resume'),
    
    # ✨ Initial Onboarding Dynamic Blueprint Blueprint Generation Wizard
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-generate-template'),
]
