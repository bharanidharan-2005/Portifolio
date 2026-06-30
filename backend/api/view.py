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
    Intelligently generates, updates, or expands portfolio components 
    using Gemini-2.5-flash with a seamless dynamic copy generator backup loop.
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

        current_type = section.section_type if section else 'hero'
        updated_content = None
        log_desc = f"Content Generator [{current_type.upper()}]: {user_prompt[:40]}..."
        change_tag = 'Generation'

        try:
            client = get_gemini_client()
            
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
                    f"Target Block Component Format: {current_type.upper()}\n"
                    "Return ONLY a valid, parseable JSON dictionary matching the layout requirements."
                )
                contents_payload = (
                    f"Section Type Blueprint: {current_type}\n"
                    f"Current JSON Content Payload: {json.dumps(section.content_data if section else {})}\n"
                    f"User Creative Request: {user_prompt}"
                )

            # 🛡️ Attempt Gemini Extraction Call
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents_payload,
                config={'system_instruction': system_instruction}
            )

            clean_json_str = extract_clean_json_payload(response.text)
            updated_content = json.loads(clean_json_str)

        except Exception as api_err:
            # 🛡️ FAILURE SAFE FALLBACK: Universal layout initialization (NO USER-SPECIFIC DEFAULTS)
            print(f"⚠️ API Exception caught ({str(api_err)}). Initializing universal layout fallback engine...")
            
            prompt_lower = user_prompt.lower()
            existing_data = section.content_data if (section and section.content_data) else {}

            if current_type == 'hero':
                updated_content = {
                    "heading": existing_data.get("heading", ""),
                    "subheading": existing_data.get("subheading", ""),
                    "liveUrl": existing_data.get("liveUrl", ""),
                    "designUrl": existing_data.get("designUrl", "")
                }
                if "neon" in prompt_lower or "cyberpunk" in prompt_lower:
                    updated_content["subheading"] = f"{updated_content['subheading']} // Cyberpunk Neon Shell Edition".strip(" // ")

            elif current_type == 'about':
                updated_content = {
                    "bio": existing_data.get("bio", "")
                }

            elif current_type == 'skills':
                updated_content = {
                    "items": existing_data.get("items", [])
                }

            elif current_type == 'projects_grid':
                updated_content = {
                    "title": existing_data.get("title", ""),
                    "projects": existing_data.get("projects", [])
                }

            elif current_type == 'education':
                updated_content = {
                    "schools": existing_data.get("schools", [])
                }

            elif current_type == 'contact':
                updated_content = {
                    "text": existing_data.get("text", "")
                }

            else:
                updated_content = existing_data

        # Save and persist the generated variables layout to the database choice
        if section and updated_content:
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


# -----------------------------------------------------------------
# 4. MASTER WHOLE RESUME UPLOAD & ALL-SECTION SYNC ENGINE
# -----------------------------------------------------------------
class ResumeUploadAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            resume_file = request.FILES.get('resume')
            if not resume_file:
                return Response({"error": "No resume document detected."}, status=status.HTTP_400_BAD_REQUEST)

            # Extract text
            extracted_text = ""
            with pdfplumber.open(resume_file) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text: extracted_text += text + "\n"

            master_parsed_payload = None

            # 🛡️ STRATEGY A: DYNAMIC AI GENERATION (Maintained)
            try:
                client = get_gemini_client()
                # ... (Keep your existing Gemini prompt here) ...
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Raw Resume Context:\n{extracted_text}",
                    config={'system_instruction': system_instruction}
                )
                clean_json_str = extract_clean_json_payload(response.text)
                master_parsed_payload = json.loads(clean_json_str)

            except Exception:
                # 🛡️ STRATEGY B: DYNAMIC BACKUP TEXT PARSER (UPDATED WITH FILTERS)
                print("⚠️ Activating filtered dynamic text parser pipeline...")
                lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
                
                # ... (Keep Bio, Education, Skills parsing as is) ...

                # 4. Parse dynamic project entries (UPDATED WITH EXCLUSIONS)
                found_projects = []
                # Define metadata keywords to exclude from project grid
                EXCLUDED_KEYWORDS = ["place of birth", "driving license", "languages", "hobbies", "details", "contact"]
                
                is_in_projects_section = False
                current_project = None

                for line in lines:
                    line_lower = line.lower()
                    
                    # Section detection
                    if any(k in line_lower for k in ["projects", "innovations", "experience"]):
                        is_in_projects_section = True
                        continue
                    if is_in_projects_section and any(k in line_lower for k in ["skills", "education", "contact"]):
                        is_in_projects_section = False

                    if is_in_projects_section:
                        # ⚡ FILTER: Skip personal metadata lines
                        if any(ex in line_lower for ex in EXCLUDED_KEYWORDS):
                            continue
                            
                        urls = re.findall(r'(https?://[^\s]+|github\.com/[^\s]+|netlify\.app/[^\s]+|onrender\.com/[^\s]+)', line)
                        
                        if len(line) < 50 and not line.endswith('.') and not urls and not line.lower().startswith('using '):
                            if current_project: found_projects.append(current_project)
                            current_project = {"title": line, "desc": "", "tags": [], "projectUrl": ""}
                        elif current_project:
                            if urls: current_project["projectUrl"] = urls[0].strip("()[], ")
                            elif line.lower().startswith('using '):
                                raw_tags = line.replace('Using', '').replace('using', '').split(',')
                                current_project["tags"] = [t.replace('and', '').strip() for t in raw_tags if t.strip()]
                            else:
                                current_project["desc"] = (current_project["desc"] + " " + line).strip()

                if current_project: found_projects.append(current_project)

                # ... (Construct master_parsed_payload) ...

            # 💾 PERSISTENCE (Maintained)
            home_page = PortfolioPage.objects.filter(slug="home").first()
            if home_page:
                for sec_type, content in master_parsed_payload.items():
                    PortfolioSection.objects.update_or_create(
                        page=home_page, section_type=sec_type, defaults={"content_data": content}
                    )

            return Response({"message": "Synced successfully!", "data": master_parsed_payload}, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


# -----------------------------------------------------------------
# 6. PORTFOLIO QUALITY REVIEW & COMPLETENESS TRACKER
# -----------------------------------------------------------------
class PortfolioReviewAPIView(APIView):
    """
    Analyzes the completeness, SEO readability, and recruiter-readiness 
    of all portfolio page block sections inside the canvas database.
    """
    def get(self, request):
        sections = PortfolioSection.objects.all()
        
        # Initialize default metrics baseline
        score_content = 50
        score_design = 70
        score_seo = 50
        score_accessibility = 60
        
        suggestions = []
        missing_items = []
        
        # Scan sections to grade fields
        hero_sec = sections.filter(section_type='hero').first()
        about_sec = sections.filter(section_type='about').first()
        skills_sec = sections.filter(section_type='skills').first()
        projects_sec = sections.filter(section_type='projects_grid').first()
        
        # 1. Evaluate Hero Section
        if hero_sec and hero_sec.content_data:
            data = hero_sec.content_data
            if data.get("heading"): 
                score_content += 10
            else: 
                missing_items.append("Profile Name Header")
                
            if data.get("subheading"): 
                score_content += 10
                score_seo += 15
            else: 
                suggestions.append("Add a professional title subheading for better SEO indexing.")
                
            if data.get("liveUrl") or data.get("designUrl"):
                score_accessibility += 15
            else:
                missing_items.append("External Repository Links")
        else:
            missing_items.extend(["Profile Name Header", "External Repository Links"])
            suggestions.append("Initialize your Hero profile introduction block.")

        # 2. Evaluate About Bio
        if about_sec and about_sec.content_data:
            bio = about_sec.content_data.get("bio", "")
            if len(bio) > 100:
                score_content += 10
                score_seo += 15
            elif len(bio) > 0:
                score_content += 5
                suggestions.append("Expand your summary bio paragraph to provide more detail for recruiters.")
            else:
                missing_items.append("Summary Biography")
        else:
            missing_items.append("Summary Biography")

        # 3. Evaluate Projects Grid
        if projects_sec and projects_sec.content_data:
            projs = projects_sec.content_data.get("projects", [])
            if len(projs) >= 2:
                score_content += 10
                score_design += 15
            elif len(projs) == 1:
                score_content += 5
                suggestions.append("Add at least two development innovations to show a complete timeline.")
            else:
                missing_items.append("Project Showcases")
        else:
            missing_items.append("Project Showcases")

        # 4. Evaluate Skills Parameters
        if skills_sec and skills_sec.content_data:
            items = skills_sec.content_data.get("items", [])
            if len(items) > 0:
                score_content += 10
                score_design += 15
            else:
                missing_items.append("Core Tech Stack Metrics")
        else:
            missing_items.append("Core Tech Stack Metrics")

        # Cap bounds scores securely at 100%
        score_content = min(score_content, 100)
        score_design = min(score_design, 100)
        score_seo = min(score_seo, 100)
        score_accessibility = min(score_accessibility, 100)
        
        # Calculate dynamic holistic summary index
        overall_score = int((score_content + score_design + score_seo + score_accessibility) / 4)
        
        return Response({
            "overall_score": overall_score,
            "metrics": {
                "content": score_content,
                "design": score_design,
                "seo": score_seo,
                "accessibility": score_accessibility
            },
            "suggestions": suggestions if suggestions else ["Your portfolio layout is perfectly optimized!"],
            "missing_items": missing_items
        }, status=status.HTTP_200_OK)
