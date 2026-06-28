from django.contrib import admin
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    # Removed 'subdomain' since it's not in the model anymore
    list_display = ('id', 'title', 'owner_name', 'created_at')
    search_fields = ('owner_name', 'title')


@admin.register(PortfolioPage)
class PortfolioPageAdmin(admin.ModelAdmin):
    # Removed 'portfolio' reference completely
    list_display = ('id', 'name', 'slug', 'order', 'theme_accent')
    search_fields = ('name', 'slug')


@admin.register(PortfolioSection)
class PortfolioSectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'page', 'section_type', 'order')
    list_filter = ('page', 'section_type')
    search_fields = ('section_type',)


@admin.register(AISessionLog)
class AISessionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'change_type', 'status', 'timestamp')
    list_filter = ('change_type', 'status')
    search_fields = ('description',)
