from django.urls import path
from .views import (
    PageListAPIView,
    SectionDetailAPIView,
    AISectionRefinementView,
    AITemplateGeneratorView
)

urlpatterns = [
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    
    # ⚡ MUST MATCH EXACTLY WHAT AXIOS POSTS TO (Check trailing slashes)
    path('ai-refinement/', AISectionRefinementView.as_view(), name='ai-refinement'),
    
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-template-generator'),
]
