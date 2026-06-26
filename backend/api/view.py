from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import json
from google import genai
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

# -----------------------------------------------------------------
# 1. PAGE VIEWER ENDPOINT
# -----------------------------------------------------------------
class PageListAPIView(APIView):
    """
    Fetches all structural pages from the database alongside their 
    nested layout sections to paint the central React workspace canvas.
    """
    data.append({
                "id": page.id,
                "name": page.name,
                "slug": page.slug,
                "order": page.order,
                "theme_accent": page.theme_accent, # <-- Inject this tracking property hook
                "sections": sections_data
            })
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
            # Safe update without destroying structural fields
            section.content_data = new_content
            section.save()
            return Response({"message": "Node properties updated successfully!"}, status=status.HTTP_200_OK)
        return Response({"error": "No update payload provided."}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------------------------------------------
# 3. ORIGINAL AI PROMPT PLACEHOLDER VIEW
# -----------------------------------------------------------------
class AIRefinementPromptAPIView(APIView):
    def post(self, request):
        prompt = request.data.get('prompt', '')
        return Response({"status": "received", "prompt": prompt})


# -----------------------------------------------------------------
# 4. CORE LOVABLE-STYLE AI GENERATION ENGINE (Section-Wise)
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
    """
    Intercepts workspace prompts, targets the selected section block ID,
    hands it to Gemini while retaining style values like text alignment, 
    and applies changes directly to the layout layer.
    """
    def post(self, request):
        user_prompt = request.data.get('prompt')
        target_section_id = request.data.get('section_id')

        # Find the specific block selected by the user. If none, grab the first fallback hero block
        if target_section_id:
            section = PortfolioSection.objects.filter(id=target_section_id).first()
        else:
            section = PortfolioSection.objects.filter(section_type='hero').first()
        
        if not section:
            return Response({"error": "No active design block found to edit. Please click a canvas element first."}, status=status.HTTP_404_NOT_FOUND)
        
        current_data = section.content_data or {}

        try:
            # Initialize the official Google Gen AI Client SDK configuration
            client = genai.Client()
            
            system_instruction = (
                "You are an expert UI/UX copywriter and layout engine system for dynamic portfolio builders.\n"
                "Your objective is to modify the provided JSON payload parameters based on the user's creative prompt.\n\n"
                "CRITICAL RULES:\n"
                "1. Keep existing key values like 'alignment' or layout choices unless the user explicitly commands you to change them.\n"
                "2. Return ONLY a valid, parseable JSON dictionary matching the key-value schema of the input.\n"
                "3. Do NOT include any markdown block wrappers like ```json or decorative conversation prose."
            )

            prompt_payload = (
                f"Section Type Blueprint: {section.section_type}\n"
                f"Current JSON Content Payload: {json.dumps(current_data)}\n"
                f"User Design Request: {user_prompt}"
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_payload,
                config={'system_instruction': system_instruction}
            )

            # Sanitize and extract the structural object text string cleanly
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.split("```json")[1].split("```")[0].strip()
            elif clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1].split("```")[0].strip()

            updated_content = json.loads(clean_text)
            
            # Commit the refined AI layout parameters straight to the database
            section.content_data = updated_content
            section.save()

            # Record an activity entry to render on the app status feed
            log = AISessionLog.objects.create(
                change_type='Refinement',
                description=f"[{section.section_type.upper()}] {user_prompt[:40]}...",
                status='applied'
            )

            return Response({
                "message": "Canvas block re-engineered successfully!",
                "updated_data": updated_content,
                "log": {
                    "id": log.id,
                    "type": log.change_type,
                    "desc": log.description,
                    "status": log.status
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"AI Generation breakdown: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# 5. AI TEMPLATE GENERATOR ENGINE (Initial Setup Wizard)
# -----------------------------------------------------------------
class AITemplateGeneratorView(APIView):
    """
    Takes a high-level goal description, communicates with Gemini to generate 
    a custom multi-block layout strategy, and populates the local database.
    """
    def post(self, request):
        user_idea = request.data.get('idea', '')
        if not user_idea:
            return Response({"error": "Please provide a design concept prompt."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Wipe out old design blocks on the Home page to start fresh
            home_page, _ = PortfolioPage.objects.get_or_create(name="Home", defaults={"slug": "home", "order": 0})
            PortfolioSection.objects.filter(page=home_page).delete()

            client = genai.Client()
            system_instruction = (
                "You are an elite web architect AI system. Your task is to interpret the user's website idea "
                "and generate a structural array of initial layout block items in clean JSON.\n\n"
                "You must return a JSON object containing a 'sections' key. The value must be a list of dicts. "
                "Each dict must have:\n"
                "- 'section_type': either 'hero' or 'projects_grid'\n"
                "- 'order': an integer starting from 0\n"
                "- 'content_data': a dict matching the block schema.\n\n"
                "For 'hero': {'heading': '...', 'subheading': '...'}\n"
                "For 'projects_grid': {'title': '...', 'projects': [{'title': '...', 'desc': '...'}, ...]}.\n\n"
                "Tailor all text copy elegantly to the user's idea theme. Return ONLY pure JSON without markdown code blocks."
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"User Website Idea: {user_idea}",
                config={'system_instruction': system_instruction}
            )

            # Sanitize response string wrappers if present
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.split("```json")[1].split("```")[0].strip()
            elif clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1].split("```")[0].strip()

            generated_layout = json.loads(clean_text)

            # Loop through the blocks and commit them to SQLite
            for block in generated_layout.get('sections', []):
                PortfolioSection.objects.create(
                    page=home_page,
                    section_type=block.get('section_type', 'hero'),
                    order=block.get('order', 0),
                    content_data=block.get('content_data', {})
                )

            # Log execution run trace
            AISessionLog.objects.create(
                change_type='Generation',
                description=f"Generated template stack for: '{user_idea[:30]}...'",
                status='applied'
            )

            return Response({"message": "Ecosystem workspace initialized successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"AI Wizard breakdown: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
