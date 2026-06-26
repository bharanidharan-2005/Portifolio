from django.contrib import admin
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

# Register your models so they show up in the admin control center dashboard
@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('title', 'subdomain', 'created_at')
    search_fields = ('title', 'subdomain')

@admin.register(PortfolioPage)
class PortfolioPageAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'portfolio')
    list_filter = ('portfolio',)

@admin.register(PortfolioSection)
class PortfolioSectionAdmin(admin.ModelAdmin):
    list_display = ('section_type', 'order', 'page')
    list_filter = ('page',)

@admin.register(AISessionLog)
class AISessionLogAdmin(admin.ModelAdmin):
    list_display = ('change_type', 'description', 'status', 'timestamp')
    list_filter = ('status', 'change_type')
