from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import json
import re  
import traceback
import os
import pdfplumber  
from google import genai
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog

# -----------------------------------------------------------------
# ⚙️ CONFIGURATION HOOK
# -----------------------------------------------------------------
def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY", "")
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
    def get(self, request):
        pages = PortfolioPage.objects.all()
        data = []
        for page in pages:
            sections = PortfolioSection.objects.filter(page=page).order_by('order')
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
# 3. CORE ADAPTIVE GENERATION ENGINE (Conversational Smart Prompts)
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
    """
    Intelligently generates, updates, or expands website components 
    using Gemini-2.5-flash based on creative conversational prompts.
    """
    def post(self, request):
        target_section_id = request.data.get('section_id')
        user_prompt = request.data.get('prompt', '')
        resume_file = request.FILES.get('resume')

        if target_section_id:
            section = PortfolioSection.objects.filter(id=target_section_id).first()
        else:
            section = PortfolioSection.objects.filter(section_type='hero').first()

        if not section and not resume_file:
            return Response({"error": "Select a block element structure row choice first."}, status=status.HTTP_404_NOT_FOUND)

        try:
            client = get_gemini_client()
            current_type = section.section_type if section else 'hero'
            
            # --- CASE A: FILE PARSING STREAM ---
            if resume_file:
                extracted_text = ""
                with pdfplumber.open(resume_file) as pdf:
                    extracted_text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

                if not extracted_text:
                    return Response({"error": "Unable to read characters from document file format structure."}, status=status.HTTP_400_BAD_REQUEST)

                system_instruction = (
                    "You are an expert resume parsing pipeline. Read raw structural text and extract "
                    "content variables tailored strictly to update the requested component block type.\n\n"
                    f"Target Block Type to Update: {current_type}\n"
                    "EXPECTED SCHEMAS:\n"
                    "- For 'hero': {'heading': 'Full Name', 'subheading': 'Professional Tagline Headline', 'liveUrl': 'Link URL', 'designUrl': 'Link URL'}\n"
                    "- For 'about': {'bio': 'Comprehensive professional summary text paragraph'}\n"
                    "- For 'education': {'schools': [{'institution': 'College Name', 'degree': 'Degree Title', 'years': '2023 - 2027', 'score': 'GPA or Pursuing'}]}\n"
                    "- For 'skills': {'items': [{'name': 'Skill Name', 'level': 85}]}\n"
                    "- For 'projects_grid': {'title': 'Section Title', 'projects': [{'title': 'Project Name', 'desc': 'Summary text', 'tags': ['Tag1', 'Tag2'], 'projectUrl': 'Project URL'}]}\n"
                    "- For 'contact': {'text': 'Call to action text description'}\n\n"
                    "Return ONLY a clean, parseable JSON dictionary matching the requested object block template framework."
                )
                contents_payload = f"Raw Document Text:\n{extracted_text}"
                log_desc = f"Parsed data structure variables out of file: {resume_file.name}"
                change_tag = 'Parse'

            # --- CASE B: REFINED CHAT CONTENT GENERATION ---
            else:
                system_instruction = (
                    "You are an expert UI/UX copywriter and creative layout engine for portfolio builders.\n"
                    "Your job is to either update or COMPLETELY GENERATE professional text based on the user's creative prompt.\n"
                    "If they ask to generate something new (like a summary for an engineer, mock projects, or tech stacks), "
                    "use your internal knowledge to write high-quality, professional, highly relevant content from scratch.\n\n"
                    f"Target Block Component Format: {current_type.upper()}\n"
                    "STRICT SCHEMAS PER SECTION:\n"
                    "- For 'hero': {\"heading\": \"Name\", \"subheading\": \"Tagline Headline\", \"liveUrl\": \"\", \"designUrl\": \"\"}\n"
                    "- For 'about': {\"bio\": \"Detailed, professional engineering bio summary text paragraph\"}\n"
                    "- For 'education': {\"schools\": [{\"institution\": \"College\", \"degree\": \"Major\", \"years\": \"2023-2027\", \"score\": \"\"}]}\n"
                    "- For 'skills': {\"items\": [{\"name\": \"Skill Title\", \"level\": 90}]}\n"
                    "- For 'projects_grid': {\"title\": \"Section Heading\", \"projects\": [{\"title\": \"Name\", \"desc\": \"Detailed operational summary\", \"tags\": [\"Tag1\"], \"projectUrl\": \"\"}]}\n"
                    "- For 'contact': {\"text\": \"Call to action narrative text\"}\n\n"
                    "CRITICAL RULES:\n"
                    "1. Match the exact dictionary structure shown above for the active section type.\n"
                    "2. Retain existing values like URLs if they already exist, UNLESS the prompt explicitly asks to change them.\n"
                    "3. Return ONLY a valid, parseable JSON dictionary. Do not include markdown block formatting wrappers or conversation prose."
                )
                contents_payload = (
                    f"Section Type Blueprint: {current_type}\n"
                    f"Current JSON Content Payload: {json.dumps(section.content_data if section else {})}\n"
                    f"User Creative Request: {user_prompt}"
                )
                log_desc = f"Content Generator [{current_type.upper()}]: {user_prompt[:40]}..."
                change_tag = 'Generation'

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents_payload,
                config={'system_instruction': system_instruction}
            )

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
                "message": "Content layout generated successfully!",
                "updated_data": updated_content,
                "log": log.to_frontend_dict() if hasattr(log, 'to_frontend_dict') else {"desc": log_desc, "type": change_tag}
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("!!! CONTENT GENERATOR ENGINE CRASH:")
            traceback.print_exc()
            return Response({"error": f"AI Engine Exception Trace: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# 4. MASTER WHOLE RESUME UPLOAD & ALL-SECTION SYNC ENGINE
# -----------------------------------------------------------------
class ResumeUploadAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            resume_file = request.FILES.get('resume')
            if not resume_file:
                return Response({"error": "No resume document detected in payload stream."}, status=status.HTTP_400_BAD_REQUEST)

            extracted_text = ""
            try:
                with pdfplumber.open(resume_file) as pdf:
                    for page in pdf.pages:
                        text = page.extract_text()
                        if text:
                            extracted_text += text + "\n"
            except Exception as pdf_err:
                return Response({"error": "Failed to extract string stream from binary PDF matrix."}, status=status.HTTP_400_BAD_REQUEST)

            master_parsed_payload = None

            # 🛡️ STRATEGY A: DYNAMIC AI GENERATION VIA GEMINI
            try:
                client = get_gemini_client()
                system_instruction = (
                    "You are an expert resume parsing engine. Analyze the provided raw text and extract "
                    "every single section layout into a combined master valid JSON object structure.\n\n"
                    "CRITICAL JSON OUTPUT FORMAT SCHEMA RULES:\n"
                    "Return exactly this JSON format down to the key definitions. Do not alter any key names:\n"
                    "{\n"
                    "  \"hero\": {\"heading\": \"Full Name\", \"subheading\": \"Professional Title & Core Track Summary\", \"liveUrl\": \"\", \"designUrl\": \"\"},\n"
                    "  \"about\": {\"bio\": \"Professional summary biography narrative paragraph\"},\n"
                    "  \"education\": {\"schools\": [{\"institution\": \"University/College Name\", \"degree\": \"Degree & Major\", \"years\": \"2023 - 2027\", \"score\": \"Current status or GPA\"}]},\n"
                    "  \"skills\": {\"items\": [{\"name\": \"Skill name metric key\", \"level\": 90}]},\n"
                    "  \"projects_grid\": {\"title\": \"Showcase of Innovations & System Achievements\", \"projects\": [{\"title\": \"Project Name\", \"desc\": \"Brief development summary\", \"tags\": [\"Tag1\", \"Tag2\"], \"projectUrl\": \"Link URL\"}]},\n"
                    "  \"contact\": {\"text\": \"Let's collaborate on real-world solutions. Reach out directly below.\"}\n"
                    "}\n\n"
                    "CRITICAL RULE FOR PROJECT URLS: Scan the entire document text stream. Every project or experience card might contain unique hyperlinks "
                    "(e.g., github.com, netlify.app, onrender.com). Extract them and map them precisely to 'projectUrl'. Do not change schema keys. Return ONLY pure valid JSON."
                )

                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Raw Resume Context:\n{extracted_text}",
                    config={'system_instruction': system_instruction}
                )

                clean_json_str = extract_clean_json_payload(response.text)
                master_parsed_payload = json.loads(clean_json_str)

            except Exception as api_err:
                # 🛡️ STRATEGY B: DYNAMIC BACKUP TEXT PARSER PIPELINE (ZERO STATIC DEFAULTS)
                print("⚠️ Gemini Client bypassed or limited. Activating absolute dynamic text parser pipeline...")
                
                lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
                parsed_name = lines[0] if lines else ""
                
                # 1. Isolate bio narrative block dynamically
                bio_text = ""
                bio_started = False
                for line in lines:
                    if any(k in line.lower() for k in ["summary", "about me", "objective", "profile"]):
                        bio_started = True
                        continue
                    if bio_started and any(k in line.lower() for k in ["education", "experience", "skills", "projects"]):
                        break
                    if bio_started:
                        bio_text += " " + line
                
                # 2. Extract schools dynamically
                schools_list = []
                edu_started = False
                for line in lines:
                    if any(k in line.lower() for k in ["education", "academic qualification", "educational background"]):
                        edu_started = True
                        continue
                    if edu_started and any(k in line.lower() for k in ["experience", "skills", "projects", "contact"]):
                        break
                    if edu_started and len(line) > 5:
                        schools_list.append(line)
                        
                # 3. Extract skills items dynamically
                skills_items = []
                skills_started = False
                for line in lines:
                    if any(k in line.lower() for k in ["skills", "expertise", "technologies", "core expertise metrics"]):
                        skills_started = True
                        continue
                    if skills_started and any(k in line.lower() for k in ["education", "experience", "projects", "contact"]):
                        break
                    if skills_started:
                        items = re.split(r'[,|•\t]', line.replace("Using", "").replace("using", ""))
                        for item in items:
                            if item.strip() and len(item.strip()) < 35:
                                skills_items.append({"name": item.strip(), "level": 90})

                # 4. Parse dynamic project entries under "Experience" or "Projects"
                found_projects = []
                project_lines = []
                is_in_projects_section = False

                for line in lines:
                    line_lower = line.lower()
                    if any(k in line_lower for k in ["projects", "innovations", "academic projects", "experience", "showcase of innovations"]):
                        is_in_projects_section = True
                        continue
                    if is_in_projects_section and any(k in line_lower for k in ["skills", "education", "contact", "languages"]):
                        is_in_projects_section = False

                    if is_in_projects_section:
                        project_lines.append(line)

                current_project = None
                for line in project_lines:
                    urls = re.findall(r'(https?://[^\s]+|github\.com/[^\s]+|netlify\.app/[^\s]+|onrender\.com/[^\s]+)', line)
                    
                    if len(line) < 50 and not line.endswith('.') and not urls and not line.lower().startswith('using ') and not any(k in line.lower() for k in ["personal project", "college management"]):
                        if current_project:
                            found_projects.append(current_project)
                        current_project = {"title": line, "desc": "", "tags": [], "projectUrl": ""}
                    elif current_project:
                        if urls:
                            current_project["projectUrl"] = urls[0].strip("()[], ")
                        elif line.lower().startswith('using '):
                            raw_tags = line.replace('Using', '').replace('using', '').split(',')
                            current_project["tags"] = [t.replace('and', '').strip() for t in raw_tags if t.strip()]
                        else:
                            current_project["desc"] = (current_project["desc"] + " " + line).strip()

                if current_project:
                    found_projects.append(current_project)

                # Find any header level URL inside the upper section context (e.g., LinkedIn / GitHub header match)
                header_urls = re.findall(r'(https?://[^\s]+)', extracted_text[:500])
                hero_live = header_urls[0].strip("()[], ") if header_urls else ""

                master_parsed_payload = {
                    "hero": {
                        "heading": parsed_name.upper(),
                        "subheading": lines[1] if len(lines) > 1 else "",
                        "liveUrl": hero_live,
                        "designUrl": ""
                    },
                    "about": {
                        "bio": bio_text.strip()
                    },
                    "education": {
                        "schools": [{"institution": schools_list[0] if schools_list else "", "degree": schools_list[1] if len(schools_list) > 1 else "", "years": "", "score": ""}]
                    },
                    "skills": {
                        "items": skills_items
                    },
                    "projects_grid": {
                        "title": "",
                        "projects": found_projects
                    },
                    "contact": {
                        "text": ""
                    }
                }

            # 💾 DATABASE PERSISTENCE SYNCHRONIZER LAYER
            home_page = PortfolioPage.objects.filter(slug="home").first()
            if home_page:
                for sec_type, content in master_parsed_payload.items():
                    PortfolioSection.objects.update_or_create(
                        page=home_page,
                        section_type=sec_type,
                        defaults={"content_data": content}
                    )

            log = AISessionLog.objects.create(
                change_type='Parse',
                description=f"Whole Resume Matrix Upload Synced: {resume_file.name}",
                status='applied'
            )

            return Response({
                "message": "Full master structure processed seamlessly!",
                "data": master_parsed_payload,
                "log": log.to_frontend_dict() if hasattr(log, 'to_frontend_dict') else {"desc": "Resume sync applied."}
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("!!! MASTER RESUME ENGINE CRASH EXECUTION FAILURE:")
            traceback.print_exc()
            return Response({"error": f"Internal parser breakdown context: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------------------------------------------
# 5. SITE BUILD INITIAL ARCHITECT BLUEPRINT WIZARD
# -----------------------------------------------------------------
class AITemplateGeneratorView(APIView):
    def post(self, request):
        user_idea = request.data.get('idea', '')
        if not user_idea:
            return Response({"error": "Please provide a website goal idea summary description concept."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parent_portfolio, _ = Portfolio.objects.get_or_create(
                id=1,
                defaults={"owner_name": "Developer Workspace User", "title": "Master Studio Suite"}
            )

            PortfolioPage.objects.filter(slug="home").delete()
            
            home_page = PortfolioPage.objects.create(
                portfolio=parent_portfolio,
                name="Home", 
                slug="home", 
                order=0, 
                theme_accent="dark"
            )

            client = get_gemini_client()
            system_instruction = (
                "You are an elite web architect AI system. Interpret the user's website idea and construct a full portfolio layout strategy.\n"
                "You must return a JSON object containing a 'sections' key whose value is a list of exactly 6 component dictionaries matching the canonical order keys:\n"
                "hero, about, education, skills, projects_grid, contact. Tailor text content to user prompt rules. Return ONLY valid pure JSON."
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"User Portfolio Creative Directive: {user_idea}",
                config={'system_instruction': system_instruction}
            )

            clean_json_str = extract_clean_json_payload(response.text)
            generated_layout = json.loads(clean_json_str)

            for block in generated_layout.get('sections', []):
                extracted_type = block.get('section_type') or block.get('type') or 'hero'
                PortfolioSection.objects.create(
                    page=home_page,
                    section_type=str(extracted_type).lower().strip(),
                    order=block.get('order', 0),
                    content_data=block.get('content_data', {})
                )

            return Response({"message": "Full layout template matrix initialized successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"AI Template Wizard breakdown error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
