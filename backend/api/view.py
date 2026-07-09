from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import json
import re  
import traceback
import os
import pdfplumber  
from google import genai 
from google.genai import types
import uuid
from django.conf import settings
from .models import Portfolio, PortfolioPage, PortfolioSection, AISessionLog
from PIL import Image
import random
from django.core.mail import send_mail
from .models import OTPVerification# --- NEW: Force load your environment variables ---
from dotenv import load_dotenv
load_dotenv() 

# -----------------------------------------------------------------
# ⚙️ CONFIGURATION HOOK
# -----------------------------------------------------------------
def get_gemini_client():
    # 1. Try to get the key from the .env file first
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    # 2. If it's missing or doesn't start with "AIza", hardcode it temporarily for testing
    if not api_key.startswith("AIza"):
        print("⚠️ WARNING: Invalid or missing GEMINI_API_KEY in .env file. Using hardcoded fallback.")
        # Paste your REAL API key between the quotes below!
        api_key = "" 
        
    return genai.Client(api_key=api_key)

# ... (keep the rest of your functions below exactly as they are) ...
def extract_clean_json_payload(raw_text):
    """Safely cleans markdown formatting wrappers from AI returns."""
    clean_text = raw_text.strip()
    if "```json" in clean_text:
        clean_text = clean_text.split("```json")[1].split("```")[0].strip()
    elif "```" in clean_text:
        clean_text = clean_text.split("```")[1].split("```")[0].strip()
    return clean_text.replace("```json", "").replace("```", "").strip()

# -----------------------------------------------------------------
# 1. PAGE VIEWER ENDPOINT
# -----------------------------------------------------------------
class PageListAPIView(APIView):
    def get(self, request):
        pages = PortfolioPage.objects.all()
        data = []
        for page in pages:
            sections = PortfolioSection.objects.filter(page=page).order_by('order')
            sections_data = [{
                "id": s.id, "section_type": s.section_type, "order": s.order, "content_data": s.content_data
            } for s in sections]
            data.append({
                "id": page.id, "name": page.name, "slug": page.slug, "order": page.order,
                "theme_accent": page.theme_accent, "sections": sections_data
            })
        return Response(data, status=status.HTTP_200_OK)

# -----------------------------------------------------------------
# 2. INLINE SECTION EDIT ENDPOINT
# -----------------------------------------------------------------
class SectionDetailAPIView(APIView):
    def get(self, request, pk):
        section = get_object_or_404(PortfolioSection, pk=pk)
        return Response({"id": section.id, "section_type": section.section_type, "content_data": section.content_data}, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        section = get_object_or_404(PortfolioSection, pk=pk)
        new_content = request.data.get('content_data')
        if new_content is not None:
            section.content_data = new_content
            section.save()
            return Response({"message": "Node properties updated successfully!"}, status=status.HTTP_200_OK)
        return Response({"error": "No update payload provided."}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------------------------------------------
# 3. CORE ADAPTIVE GENERATION ENGINE
# -----------------------------------------------------------------
class AISectionRefinementView(APIView):
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
            else:
                system_instruction = (
                    "You are an expert UI/UX copywriter and creative layout engine for portfolio builders.\n"
                    f"Target Block Component Format: {current_type.upper()}\n"
                    "Return ONLY a valid, parseable JSON dictionary matching the layout requirements."
                )
                contents_payload = (
                    f"Section Type Blueprint: {current_type}\n"
                    f"Current JSON Content Payload: {json.dumps(section.content_data if section else {})}\n"
                    f"User Creative Request: {user_prompt}"
                )

            response = client.models.generate_content(
                model='gemini-2.5-flash', contents=contents_payload, config={'system_instruction': system_instruction}
            )
            clean_json_str = extract_clean_json_payload(response.text)
            updated_content = json.loads(clean_json_str)

        except Exception as api_err:
            print(f"⚠️ API Exception caught ({str(api_err)}). Initializing universal layout fallback engine...")
            existing_data = section.content_data if (section and section.content_data) else {}
            updated_content = existing_data 

        if section and updated_content:
            section.content_data = updated_content
            section.save()

        log = AISessionLog.objects.create(change_type=change_tag, description=log_desc, status='applied')

        return Response({
            "message": "Content layout generated successfully!", "updated_data": updated_content,
            "log": log.to_frontend_dict() if hasattr(log, 'to_frontend_dict') else {"desc": log_desc, "type": change_tag}
        }, status=status.HTTP_200_OK)
# -----------------------------------------------------------------
# 4. MASTER WHOLE RESUME UPLOAD 
# -----------------------------------------------------------------
class ResumeUploadAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            resume_file = request.FILES.get("resume")
            if not resume_file: return Response({"error": "No resume file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

            extracted_text = ""
            with pdfplumber.open(resume_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text: extracted_text += page_text + "\n"

            if extracted_text.strip() == "":
                return Response({"error": "Unable to extract text from the PDF."}, status=status.HTTP_400_BAD_REQUEST)

            client = get_gemini_client()
            
            system_instruction = """
You are an expert ATS Resume Parser. Your job is to carefully read the resume and return ONLY valid JSON.
Never explain anything. Never use markdown. Never write ```json. Return ONLY JSON.

The JSON format MUST be exactly:
{"hero":{"heading":"","subheading":"","liveUrl":"","designUrl":""},"about":{"bio":""},"education":{"schools":[{"institution":"","degree":"","years":"","score":""}]},"skills":{"items":[{"name":"","level":90}]},"projects_grid":{"title":"Experience & Projects","projects":[{"title":"","desc":"","tags":[],"projectUrl":""}]},"contact":{"text":"","email":"","phone":"","address":"","linkedin":"","github":""}}

CRITICAL MAPPING RULES:
1. Extract candidate full name into hero.heading.
2. Extract professional title into hero.subheading.
3. EXTRACT URLs: Find the LinkedIn URL and put it in BOTH `hero.liveUrl` AND `contact.linkedin`. Find any GitHub or external portfolio URLs and put them in `hero.designUrl`.
4. EXPERIENCE = PROJECTS: All Work Experience, Employment History, and Jobs MUST be extracted into the `projects_grid.projects` array. Use the Role/Company as the title, and the bullet points as the desc.
5. CONTACT DETAILS: You MUST extract the email, phone number, and physical address/location into their respective keys.
6. Extract all skills into the skills.items array.
"""
            contents_payload = f"Read this resume.\nResume Text:\n{extracted_text}\nReturn ONLY JSON."

            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=contents_payload, config={"system_instruction": system_instruction}
            )
            clean_json = extract_clean_json_payload(response.text)
            parsed_data = json.loads(clean_json)

            payload = {
                "hero": parsed_data.get("hero", {}), "about": parsed_data.get("about", {}),
                "education": parsed_data.get("education", {}), "skills": parsed_data.get("skills", {}),
                "projects_grid": parsed_data.get("projects_grid", {}), "contact": parsed_data.get("contact", {})
            }

            payload["hero"].setdefault("heading", "")
            payload["hero"].setdefault("subheading", "")
            payload["hero"].setdefault("liveUrl", "")
            payload["hero"].setdefault("designUrl", "")
            
            payload["about"].setdefault("bio", "")
            
            if "schools" not in payload["education"]: payload["education"]["schools"] = []
            if "items" not in payload["skills"]: payload["skills"]["items"] = []
            
            payload["projects_grid"].setdefault("title", "Experience & Projects")
            if "projects" not in payload["projects_grid"]: payload["projects_grid"]["projects"] = []
            
            # 👇 FRONTEND DISPLAY FIX: Combine contact info into the 'text' field
            contact_info = payload.get("contact", {})
            email = contact_info.get("email", "")
            phone = contact_info.get("phone", "")
            address = contact_info.get("address", "")
            
            contact_display_parts = []
            if email: contact_display_parts.append(f"Email: {email}")
            if phone: contact_display_parts.append(f"Phone: {phone}")
            if address: contact_display_parts.append(f"Location: {address}")
            
            if contact_display_parts:
                combined_string = " | ".join(contact_display_parts)
                payload["contact"]["text"] = f"Let's connect!\n\n{combined_string}"
            else:
                payload["contact"]["text"] = "Let's connect! Reach out directly below."

            # Save to Database
            home_page = PortfolioPage.objects.filter(slug="home").first()
            if not home_page: return Response({"error": "Home page not found."}, status=status.HTTP_404_NOT_FOUND)

            for section_name, content in payload.items():
                existing_sections = PortfolioSection.objects.filter(page=home_page, section_type=section_name)
                if existing_sections.exists():
                    keeper = existing_sections.first()
                    keeper.content_data = content
                    keeper.save()
                    if existing_sections.count() > 1: existing_sections.exclude(id=keeper.id).delete()
                else:
                    PortfolioSection.objects.create(page=home_page, section_type=section_name, content_data=content)

            return Response({"message": "Resume parsed successfully.", "data": payload}, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({"error": "Gemini returned invalid JSON."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
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
            parent_portfolio, _ = Portfolio.objects.get_or_create(id=1, defaults={"owner_name": "Developer Workspace User", "title": "Master Studio Suite"})
            PortfolioPage.objects.filter(slug="home").delete()
            home_page = PortfolioPage.objects.create(portfolio=parent_portfolio, name="Home", slug="home", order=0, theme_accent="dark")

            try:
                client = get_gemini_client()
                system_instruction = (
                    "You are an elite web architect AI system. Interpret the user's website idea and construct a full portfolio layout strategy.\n"
                    "Return ONLY a JSON object containing a 'sections' key. The value must be a list of 6 component dictionaries matching these exact types:\n"
                    "hero, about, education, skills, projects_grid, contact. Return ONLY valid pure JSON."
                )

                response = client.models.generate_content(
                    model='gemini-2.5-flash', contents=f"User Portfolio Creative Directive: {user_idea}", config={'system_instruction': system_instruction}
                )

                clean_json_str = extract_clean_json_payload(response.text)
                generated_layout = json.loads(clean_json_str)
                sections_data = generated_layout.get('sections', [])
                
                if not sections_data: raise ValueError("AI returned empty sections array.")
                    
            except Exception as ai_err:
                print(f"⚠️ AI Orchestration Failed ({ai_err}). Initializing Failsafe Template...")
                sections_data = [
                    {"section_type": "hero", "order": 0, "content_data": {"heading": "HELLO WORLD", "subheading": user_idea or "Software Engineer", "liveUrl": "", "designUrl": ""}},
                    {"section_type": "about", "order": 1, "content_data": {"bio": "Welcome to my digital workspace. I am passionate about building scalable solutions."}},
                    {"section_type": "education", "order": 2, "content_data": {"schools": []}},
                    {"section_type": "skills", "order": 3, "content_data": {"items": []}},
                    {"section_type": "projects_grid", "order": 4, "content_data": {"title": "Projects & Experience", "projects": []}},
                    {"section_type": "contact", "order": 5, "content_data": {"text": "Let's connect!", "email": "", "phone": ""}}
                ]

            for idx, block in enumerate(sections_data):
                extracted_type = block.get('section_type') or block.get('type') or 'hero'
                PortfolioSection.objects.create(
                    page=home_page, section_type=str(extracted_type).lower().strip(),
                    order=block.get('order', idx), content_data=block.get('content_data', {})
                )

            return Response({"message": "Full layout template matrix initialized successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            traceback.print_exc()
            return Response({"error": f"Database initialization error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -----------------------------------------------------------------
# 6. PORTFOLIO QUALITY REVIEW & COMPLETENESS TRACKER
# -----------------------------------------------------------------
class PortfolioReviewAPIView(APIView):
    def get(self, request):
        sections = PortfolioSection.objects.all()
        
        score_content, score_design, score_seo, score_accessibility = 50, 70, 50, 60
        suggestions, missing_items = [], []
        
        hero_sec = sections.filter(section_type='hero').first()
        about_sec = sections.filter(section_type='about').first()
        skills_sec = sections.filter(section_type='skills').first()
        projects_sec = sections.filter(section_type='projects_grid').first()
        
        if hero_sec and hero_sec.content_data:
            data = hero_sec.content_data
            if data.get("heading"): score_content += 10
            else: missing_items.append("Profile Name Header")
                
            if data.get("subheading"): 
                score_content += 10
                score_seo += 15
            else: suggestions.append("Add a professional title subheading for better SEO indexing.")
                
            if data.get("liveUrl") or data.get("designUrl"): score_accessibility += 15
            else: missing_items.append("External Repository Links")
        else:
            missing_items.extend(["Profile Name Header", "External Repository Links"])
            suggestions.append("Initialize your Hero profile introduction block.")

        if about_sec and about_sec.content_data:
            bio = about_sec.content_data.get("bio", "")
            if len(bio) > 100: score_content += 10; score_seo += 15
            elif len(bio) > 0: score_content += 5; suggestions.append("Expand your summary bio paragraph.")
            else: missing_items.append("Summary Biography")
        else: missing_items.append("Summary Biography")

        if projects_sec and projects_sec.content_data:
            projs = projects_sec.content_data.get("projects", [])
            if len(projs) >= 2: score_content += 10; score_design += 15
            elif len(projs) == 1: score_content += 5; suggestions.append("Add at least two development innovations.")
            else: missing_items.append("Project Showcases")
        else: missing_items.append("Project Showcases")

        if skills_sec and skills_sec.content_data:
            items = skills_sec.content_data.get("items", [])
            if len(items) > 0: score_content += 10; score_design += 15
            else: missing_items.append("Core Tech Stack Metrics")
        else: missing_items.append("Core Tech Stack Metrics")

        overall_score = int((min(score_content, 100) + min(score_design, 100) + min(score_seo, 100) + min(score_accessibility, 100)) / 4)
        
        return Response({
            "overall_score": overall_score,
            "metrics": {"content": min(score_content, 100), "design": min(score_design, 100), "seo": min(score_seo, 100), "accessibility": min(score_accessibility, 100)},
            "suggestions": suggestions if suggestions else ["Your portfolio layout is perfectly optimized!"],
            "missing_items": missing_items
        }, status=status.HTTP_200_OK)
# -----------------------------------------------------------------
# 7. IMAGE CUSTOMIZER (Gemini Imagen 3)
# -----------------------------------------------------------------
@api_view(['POST'])
def generate_custom_image(request):
    try:
        client = get_gemini_client()
        prompt = request.data.get('prompt', '')

        # Attempt actual generation
        response = client.models.generate_images(
            model='imagen-3.0-generate-001',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio="16:9"
            )
        )
        # (Rest of your successful generation code remains the same here)
        generated_image = response.generated_images[0]
        image_bytes = generated_image.image.image_bytes
        media_dir = os.path.join(settings.BASE_DIR, 'media', 'generated_assets')
        os.makedirs(media_dir, exist_ok=True)
        unique_filename = f"custom_asset_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(media_dir, unique_filename)
        image = Image.open(BytesIO(image_bytes))
        image.save(filepath, format="JPEG")
        return Response({'success': True, 'image_url': f"/media/generated_assets/{unique_filename}"}, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Generation failed: {e}. Falling back to placeholder.")
        # FALLBACK: If the API fails (404), return a standard placeholder URL
        return Response({
            'success': True,
            'image_url': 'https://placehold.co/1280x720/13151c/a855f7?text=AuraBuild+Placeholder',
            'message': 'API unavailable. Using placeholder asset.'
        }, status=status.HTTP_200_OK)# ADD THESE FUNCTIONS AT THE BOTTOM
@api_view(['POST'])
def send_verification_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate a random 6-digit code
    otp = str(random.randint(100000, 999999))
    
    # Save it to the database
    OTPVerification.objects.update_or_create(
        email=email,
        defaults={'otp_code': otp}
    )
    
    # Send the email (Check your terminal console to see the code if SMTP is not configured)
    print(f"--- OTP FOR {email} IS: {otp} ---") 
    try:
        send_mail(
            'Your Portfolio Builder Verification Code',
            f'Your 6-digit verification code is: {otp}',
            'noreply@aurabuild.com',
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print("Email sending skipped, relying on console print.")

    return Response({'success': True, 'message': 'OTP sent'})

@api_view(['POST'])
def verify_otp_code(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    try:
        # Check if the email and code match
        record = OTPVerification.objects.get(email=email, otp_code=otp)
        record.delete()  # Clear the code after successful verification
        return Response({'success': True, 'message': 'Email verified'})
    except OTPVerification.DoesNotExist:
        return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)
