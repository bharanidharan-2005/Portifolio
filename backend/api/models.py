from django.db import models
from django.contrib.auth.models import User

class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="My Portfolio")
    subdomain = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class PortfolioPage(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='pages')
    name = models.CharField(max_length=100) 
    slug = models.SlugField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} (/{self.slug})"

class PortfolioSection(models.Model):
    page = models.ForeignKey(PortfolioPage, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=50) 
    order = models.PositiveIntegerField(default=0)
    content_data = models.JSONField(default=dict) 

    class Meta:
        ordering = ['order']

class AISessionLog(models.Model):
    STATUS_CHOICES = [('applied', 'Applied'), ('pending', 'Pending')]
    change_type = models.CharField(max_length=50) 
    description = models.CharField(max_length=255) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
    class PortfolioPage(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    order = models.IntegerField(default=0)
    # Add this layout accent tracker field:
    theme_accent = models.CharField(max_length=50, default="purple") 

    def __str__(self):
        return self.name
