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
    theme_accent = models.CharField(max_length=50, default="dark")  # Tracks selected workspace color layouts

    def __str__(self):
        return self.name


# -----------------------------------------------------------------
# 3. INTERACTIVE CANVAS COMPONENT LAYOUT BLOCKS SCHEMA
# -----------------------------------------------------------------
class PortfolioSection(models.Model):
    # Supported block layout targets: 'hero', 'about', 'skills', 'projects_grid', 'contact'
    SECTION_CHOICES = [
        ('hero', 'Hero (Name & Headline)'),
        ('about', 'About Me Summary'),
        ('skills', 'Skills with Levels'),
        ('projects_grid', 'Featured Projects Grid'),
        ('contact', 'Contact Action Channel'),
    ]

    page = models.ForeignKey(PortfolioPage, on_delete=models.CASCADE, related_name="sections")
    section_type = models.CharField(max_length=50, choices=SECTION_CHOICES)
    order = models.IntegerField(default=0)
    
    # Stores structural fields (headings, skills arrays, project items) dynamically
    content_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Block Node: [{self.section_type.upper()}] on Page: ({self.page.name})"


# -----------------------------------------------------------------
# 4. WORKSPACE AI OPERATION EXECUTION STREAM FEED LOGS
# -----------------------------------------------------------------
class AISessionLog(models.Model):
    change_type = models.CharField(max_length=50)  # e.g., 'Generation', 'Refinement', 'Parse'
    description = models.TextField()               # Holds the narrative mutation message string
    status = models.CharField(max_length=50, default="applied")  # e.g., 'applied', 'failed'
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"AI Execution Event Log #{self.id} -> Status: [{self.status.upper()}]"

    def to_frontend_dict(self):
        """
        Formats log record to match React frontend child requirements:
        { id, type, desc, status }
        """
        return {
            "id": self.id,
            "type": self.change_type,
            "desc": self.description,
            "status": self.status
        }
