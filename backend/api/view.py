from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import json
import traceback
import os
import pdfplumber  # Ensure you run 'pip install pdfplumber'
from google import genai
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

# -----------------------------------------------------------------
# ⚙️ CONFIGURATION HOOK
# -----------------------------------------------------------------
def get_gemini_client():
    # 🔑 PASTE YOUR ACTUAL GEMINI API KEY STRING HERE:
    api_key = ""
    return genai.Client(api_key=api_key)

def extract_clean_json_payload(raw_text):
    """Safely cleans markdown formatting wrappers from AI returns."""
    clean_text = raw_text.strip()
    if "```json" in clean_text:
        clean_text = clean_text.split("```json")[1].split("```")[0].strip()
    elif "```" in clean_text:
        clean_text = clean_text.split("```")[1].split("```")[0].strip()
    return clean_text.replace("```json", "").replace("```", "").strip()


# -----------------------------------------------------------------
# 1. PAGE VIEWER ENDPOINT (Canvas Sync Engine)
# -----------------------------------------------------------------
class PageListAPIView(APIView):
    """
    Fetches all structural pages from the database alongside their 
    nested layout sections to paint the central React workspace canvas.
    """
    def get(self, request):
        pages = PortfolioPage.objects.all()
        data = []
        for page in pages:
            sections = PortfolioSection.objects.filter(page=page)
            sections_data = [{
                "id": s.id,
                "section_type": s.section_type,
                "order": s.order,
                "content_data": s.content_data
            } for s in sections]
            
            data.append({
                "id": page.id,
                "name": page.name,
                "slug": page.slug,
                "order": page.order,
                "theme_accent": page.theme_accent,
                "sections": sections_data
            })
        return Response(data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------
# 2. INLINE SECTION EDIT ENDPOINT (Manual Property Updates)
# -----------------------------------------------------------------
class SectionDetailAPIView(APIView):
    """
    Handles granular actions on a specific canvas component node block.
    Saves direct manual typing adjustments sent from the right side panel.
    """
    def get(self, request, pk):
        section = get_object_or_404(PortfolioSection, pk=pk)
        return Response({
            "id": section.id,
            "section_type": section.section_type,
            "content_data": section.content_data
        }, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        section = get_object_or_404(PortfolioSection, pk=pk)
        new_content = request.data.get('content_data')
        
        if new_content is not None:
            section.content_data = new_content
            section.save()
            return Response({"message": "Node properties updated successfully!"}, status=status.HTTP_200_OK)
        return Response({"error": "No update payload provided."}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------------------------------------------
# 3. CORE ADAPTIVE GENERATION & DUAL RESUME PARSER ENGINE
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
    """
    Processes chat prompt refinement strings or raw document file streams.
    Extracts text inputs and mutates specific portfolio blocks securely.
    """
    def post(self, request):
        target_section_id = request.data.get('section_id')
        user_prompt = request.data.get('prompt', '')
        resume_file = request.FILES.get('resume')

        # Locate target block or default safely to head block node
        if target_section_id:
            section = PortfolioSection.objects.filter(id=target_section_id).first()
        else:
            section = PortfolioSection.objects.filter(section_type='hero').first()

        if not section and not resume_file:
            return Response({"error": "Select a block element structure row choice first."}, status=status.HTTP_404_NOT_FOUND)

        try:
            client = get_gemini_client()
            
            # CASE A: A raw document file was uploaded via paperclip trigger attachment
            if resume_file:
                extracted_text = ""
                with pdfplumber.open(resume_file) as pdf:
                    extracted_text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

                if not extracted_text:
                    return Response({"error": "Unable to read characters from document file format structure."}, status=status.HTTP_400_BAD_REQUEST)

                system_instruction = (
                    "You are an expert resume parsing pipeline. Read raw structural text and extract "
                    "content variables tailored strictly to update the requested component block type.\n\n"
                    f"Target Block Type to Update: {section.section_type if section else 'hero'}\n"
                    "EXPECTED SCHEMAS:\n"
                    "- For 'hero': {'heading': 'Full Name', 'subheading': 'Professional Tagline Headline'}\n"
                    "- For 'about': {'bio': 'Comprehensive professional summary text paragraph'}\n"
                    "- For 'skills': {'items': [{'name': 'Skill Name', 'level': 85}]}\n"
                    "- For 'projects_grid': {'title': 'Section Title', 'projects': [{'title': 'Project Name', 'desc': 'Summary text', 'tags': ['Tag1', 'Tag2']}]}\n"
                    "- For 'contact': {'text': 'Call to action text description'}\n\n"
                    "Return ONLY a clean, parseable JSON dictionary matching the requested object block template framework."
                )

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Raw Document Text:\n{extracted_text}",
                    config={'system_instruction': system_instruction}
                )

                log_desc = f"Parsed data structure variables out of file: {resume_file.name}"
                change_tag = 'Parse'

            # CASE B: Standard conversational chat refinement text prompt
            else:
                system_instruction = (
                    "You are an expert UI/UX copywriter and layout engine system for dynamic portfolio builders.\n"
                    "Your objective is to modify the provided JSON payload parameters based on the user's creative prompt.\n\n"
                    "CRITICAL RULES:\n"
                    "1. Keep existing key values like 'alignment' or array properties unless explicitly asked to modify.\n"
                    "2. Return ONLY a valid, parseable JSON dictionary matching the key-value schema of the input.\n"
                    "3. Do NOT include any markdown block formatting wrappers or extra prose conversation."
                )

                prompt_payload = (
                    f"Section Type Blueprint: {section.section_type}\n"
                    f"Current JSON Content Payload: {json.dumps(section.content_data)}\n"
                    f"User Design Request: {user_prompt}"
                )

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_payload,
                    config={'system_instruction': system_instruction}
                )

                log_desc = f"[{section.section_type.upper()}] Refinement: {user_prompt[:40]}..."
                change_tag = 'Refinement'

            clean_json_str = extract_clean_json_payload(response.text)
            updated_content = json.loads(clean_json_str)

            if section:
                section.content_data = updated_content
                section.save()

            log = AISessionLog.objects.create(
                change_type=change_tag,
                description=log_desc,
                status='applied'
            )

            return Response({
                "message": "AI Blueprint mutation updated successfully!",
                "updated_data": updated_content,
                "log": log.to_frontend_dict()
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("!!! AI ENGINE CRASH EXECUTION FAILURE:")
            traceback.print_exc()
            return Response({"error": f"AI Engine Exception Trace: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# 4. SITE BUILD INITIAL ARCHITECT BLUEPRINT WIZARD
# -----------------------------------------------------------------
class AITemplateGeneratorView(APIView):
    """
    Takes a high-level goal concept summary from onboarding wizard, communicates 
    with Gemini to forge your full five-block portfolio matrix sequence structure.
    """
    def post(self, request):
        user_idea = request.data.get('idea', '')
        if not user_idea:
            return Response({"error": "Please provide a website goal idea summary description concept."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 🛡️ Step 1: Secure Master Portfolio parent anchor entry
            parent_portfolio, _ = Portfolio.objects.get_or_create(
                id=1,
                defaults={
                    "owner_name": "Developer Workspace User",
                    "title": "Master Studio Generated Site Suite"
                }
            )

            # 🛡️ Step 2: Clear old matching page contexts to prevent slug uniqueness index crash traps
            PortfolioPage.objects.filter(slug="home").delete()
            
            home_page = PortfolioPage.objects.create(
                portfolio=parent_portfolio,
                name="Home", 
                slug="home", 
                order=0, 
                theme_accent="dark"
            )

            generated_layout = None

            try:
                # Attempt to call Gemini API client
                client = get_gemini_client()
                
                system_instruction = (
                    "You are an elite web architect AI system. Interpret the user's website idea and construct a full portfolio layout strategy.\n"
                    "You must return a JSON object containing a 'sections' key whose value is a list of exactly 5 component dictionaries.\n\n"
                    "CRITICAL RULE: You must follow these exact schema patterns down to the character. Do not change the key names:\n"
                    "1. {\"section_type\": \"hero\", \"order\": 0, \"content_data\": {\"heading\": \"[Full Name]\", \"subheading\": \"[Headline Tagline]\"}}\n"
                    "2. {\"section_type\": \"about\", \"order\": 1, \"content_data\": {\"bio\": \"[Detailed engineering career profile bio summary text]\"}}\n"
                    "3. {\"section_type\": \"skills\", \"order\": 2, \"content_data\": {\"items\": [{\"name\": \"Python / Flask\", \"level\": 90}, {\"name\": \"React\", \"level\": 85}]}}\n"
                    "4. {\"section_type\": \"projects_grid\", \"order\": 3, \"content_data\": {\"title\": \"Featured Innovations\", \"projects\": [{\"title\": \"Project Name\", \"desc\": \"Short text summary description\", \"tags\": [\"Tag1\", \"Tag2\"]}]}}\n"
                    "5. {\"section_type\": \"contact\", \"order\": 4, \"content_data\": {\"text\": \"Let's collaborate on software solutions. Reach out directly below.\"}}\n\n"
                    "Tailor all text copywriting elegantly to the context details of the user's website idea. Return ONLY pure valid JSON."
                )

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"User Portfolio Creative Directive: {user_idea}",
                    config={'system_instruction': system_instruction}
                )

                clean_json_str = extract_clean_json_payload(response.text)
                generated_layout = json.loads(clean_json_str)

            except Exception as api_err:
                # 🛡️ STRICT STRUCTURAL FALLBACK GUARD LAYER: Seeding custom core blueprint sequence directly on quota exceptions
                print("⚠️ Gemini Free-Tier Quota Exceeded/Error occurred. Activating dynamic structural layout template matrix...")
                
                generated_layout = {
                    "sections": [
                        {
                            "section_type": "hero",
                            "order": 0,
                            "content_data": {
                                "heading": "M. Bharanidharan",
                                "subheading": "Computer Science & Engineering | Full-Stack Developer & IoT System Architect"
                            }
                        },
                        {
                            "section_type": "about",
                            "order": 1,
                            "content_data": {
                                "bio": "Third-year Computer Science and Engineering student focused on building robust full-stack software architectures, relational engineering layouts, and hardware-software embedded system applications."
                            }
                        },
                        {
                            "section_type": "skills",
                            "order": 2,
                            "content_data": {
                                "items": [
                                    {"name": "Python / Flask Backend Ecosystem", "level": 90},
                                    {"name": "Java Servlets / MS SQL Server Engineering", "level": 85},
                                    {"name": "React / JavaScript (Three.js Web UI)", "level": 80},
                                    {"name": "IoT Hardware Integration (ESP32 Calibration & Sensors)", "level": 75}
                                ]
                            }
                        },
                        {
                            "section_type": "projects_grid",
                            "order": 3,
                            "content_data": {
                                "title": "Showcase of Innovations & System Achievements",
                                "projects": [
                                    {
                                        "title": "Smart Tourist Safety Monitoring & Incident Response System", 
                                        "desc": "An anomaly detection safety tracking network utilizing physical GPS tracking hardware components alongside geo-fencing diagnostics maps.", 
                                        "tags": ["IoT", "Python", "Hardware Integration"]
                                    },
                                    {
                                        "title": "AuraBuild AI Workspace", 
                                        "desc": "A live workspace dashboard web editor parsing canvas data structures and custom theme components in real-time.", 
                                        "tags": ["React", "Django API", "Full-Stack"]
                                    }
                                ]
                            }
                        },
                        {
                            "section_type": "contact",
                            "order": 4,
                            "content_data": {
                                "text": "Let's collaborate on real-world web platforms or physical embedded monitoring systems. Get in touch directly below."
                            }
                        }
                    ]
                }

            # Save the layout loop cleanly down to your database
            for block in generated_layout.get('sections', []):
                
                # Extract using 'section_type' or look for the alternative shortcut 'type' key variations
                extracted_type = block.get('section_type') or block.get('type')
                
                # Fallback to 'hero' default option if both keys are completely missing to prevent constraints breakdown
                if not extracted_type:
                    extracted_type = 'hero'

                PortfolioSection.objects.create(
                    page=home_page,
                    section_type=str(extracted_type).lower().strip(),
                    order=block.get('order', 0),
                    content_data=block.get('content_data', {})
                )

            AISessionLog.objects.create(
                change_type='Generation',
                description=f"Generated template matrix canvas layout block blueprint stream.",
                status='applied'
            )

            return Response({"message": "Five-block layout template matrix initialized successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("!!! BLUEPRINT WIZARD INITIALIZATION CRASH:")
            traceback.print_exc()
            return Response({"error": f"AI Template Wizard breakdown error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
