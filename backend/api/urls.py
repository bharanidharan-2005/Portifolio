from django.urls import path
from . import views
from .views import (
    PageListAPIView, 
    SectionDetailAPIView, 
    AISectionRefinementView, 
    ResumeUploadAPIView, 
    AITemplateGeneratorView,
    PortfolioReviewAPIView,
    generate_custom_image # ⚡ Step 1: Make sure this is imported
)
from django.conf import settings
from django.conf.urls.static import static





urlpatterns = [
    path('pages/', PageListAPIView.as_view(), name='page-list'),
    path('sections/<int:pk>/', SectionDetailAPIView.as_view(), name='section-detail'),
    path('ai-refinement/', AISectionRefinementView.as_view(), name='ai-refinement'),
    path('upload-resume/', ResumeUploadAPIView.as_view(), name='upload-resume'),
    path('ai-generate-template/', AITemplateGeneratorView.as_view(), name='ai-generate-template'),
    path('send-otp/', views.send_verification_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp_code, name='verify_otp'),
    # ⚡ Step 2: Register the review analytics path endpoint
    path('portfolio-review/', PortfolioReviewAPIView.as_view(), name='portfolio-review'), 
    path('generate-image/',generate_custom_image, name='generate_custom_image'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
