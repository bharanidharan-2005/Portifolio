from django.db import models

# -----------------------------------------------------------------
# 1. MAIN SYSTEM PORTFOLIO SCHEMA
# -----------------------------------------------------------------
class Portfolio(models.Model):
    title = models.CharField(max_length=200)
    owner_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.owner_name}'s Master Studio Shell"


# -----------------------------------------------------------------
# 2. SITE ROUTING PAGES SCHEMA
# -----------------------------------------------------------------
class PortfolioPage(models.Model):
    portfolio = models.ForeignKey('Portfolio', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    order = models.IntegerField(default=0)
    theme_accent = models.CharField(max_length=50, default="dark")

    def __str__(self):
        return self.name


# -----------------------------------------------------------------
# 3. INTERACTIVE CANVAS COMPONENT LAYOUT BLOCKS SCHEMA
# -----------------------------------------------------------------
class PortfolioSection(models.Model):
    page = models.ForeignKey(PortfolioPage, on_delete=models.CASCADE, related_name="sections")
    section_type = models.CharField(max_length=50)  # e.g., 'hero', 'projects_grid'
    order = models.IntegerField(default=0)
    content_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Block Node: [{self.section_type.upper()}] on Page: ({self.page.name})"


# -----------------------------------------------------------------
# 4. WORKSPACE AI OPERATION EXECUTION STREAM FEED LOGS
# -----------------------------------------------------------------
class AISessionLog(models.Model):
    change_type = models.CharField(max_length=50)  # e.g., 'Generation', 'Refinement'
    description = models.TextField()
    status = models.CharField(max_length=50, default="applied")  # e.g., 'applied', 'failed'
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Execution Event Log #{self.id} -> Status: [{self.status.upper()}]"
