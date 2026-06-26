from rest_framework import serializers
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

class AISessionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISessionLog
        fields = ['id', 'change_type', 'description', 'status', 'timestamp']

class PortfolioSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioSection
        fields = ['id', 'section_type', 'order', 'content_data']

class PortfolioPageSerializer(serializers.ModelSerializer):
    sections = PortfolioSectionSerializer(many=True, read_only=True)

    class Meta:
        model = PortfolioPage
        fields = ['id', 'name', 'slug', 'order', 'sections']
