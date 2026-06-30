import React, { useState, useEffect, useRef } from 'react';
import API from '../api'; 
import { PORTFOLIO_THEMES } from '../canvas/themes';

export default function AIRefinementPanel({ 
    logs, 
    onSubmitPrompt, 
    selectedSection, 
    onManualUpdate, 
    activeTool, 
    pages,
    userData,
    setUserData,
    onDataExtracted 
}) {
    const [promptText, setPromptText] = useState("");
    const [studioSubTab, setStudioSubTab] = useState("Generate"); 
    const [localContent, setLocalContent] = useState({});
    const [reviewData, setReviewData] = useState(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        if (selectedSection && selectedSection.content_data) {
            setLocalContent(selectedSection.content_data);
        } else {
            setLocalContent({});
        }
    }, [selectedSection]);

    // ⚡ FETCH LIVE BACKEND REVIEW METRICS DYNAMICALLY ON CLICKING THE REVIEW SUB-TAB
    useEffect(() => {
        if (studioSubTab === 'Review') {
            setLoadingReview(true);
            API.get('portfolio-review/')
                .then(res => {
                    setReviewData(res.data);
                    setLoadingReview(false);
                })
                .catch(err => {
                    console.error("Failed to load portfolio analysis metrics:", err);
                    setLoadingReview(false);
                });
        }
    }, [studioSubTab, pages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!promptText.trim()) return;
        onSubmitPrompt(promptText);
        setPromptText("");
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);

        try {
            console.log("Streaming file to Master Sync Engine:", file.name);
            const res = await API.post("upload-resume/", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data && res.data.data) {
                if (onDataExtracted) {
                    onDataExtracted(res.data.data); 
                }
                alert("Whole Resume Matrix Synced Successfully ✅");
            }
        } catch (error) {
            console.error("Master Sync Failure:", error);
            alert("Failed to parse full resume array structures.");
        } finally {
            e.target.value = null; 
        }
    };

    const triggerHtmlWebsiteDownload = () => {
        if (!pages || pages.length === 0) {
            alert("No data structure sections found to build.");
            return;
        }

        const activeThemeKey = userData.theme || 'cyberpunk_neon';
        const isMinimal = activeThemeKey === 'minimal_clean';
        const activeSections = pages[0].sections || [];

        let sectionsHtml = '';

        activeSections.forEach(sec => {
            const type = (sec.section_type || '').toLowerCase().trim();
            const data = sec.content_data || {};

            if (type === 'hero') {
                sectionsHtml += `
                <section class="text-center py-16 space-y-6 animate-fade-in">
                    <h1 class="text-4xl md:text-5xl font-black tracking-tight uppercase ${isMinimal ? 'text-slate-900' : 'text-white'}">
                        ${data.heading || 'YOUR NAME'}
                    </h1>
                    <p class="text-base max-w-xl mx-auto leading-relaxed ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">
                        ${data.subheading || 'Professional Track'}
                    </p>
                </section>\n`;
            }
            else if (type === 'about') {
                sectionsHtml += `
                <section class="py-6 space-y-2">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">About Me</h2>
                    <p class="text-sm leading-relaxed font-medium ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">
                        ${data.bio || ''}
                    </p>
                </section>\n`;
            }
        });

        const fullHtmlDocument = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-12">${sectionsHtml}</body></html>`;
        const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const anchorElement = document.createElement('a');
        anchorElement.href = downloadUrl;
        anchorElement.download = "portfolio_site.html";
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
    };

    const safeToolKey = activeTool ? String(activeTool).toUpperCase().trim() : "";
    const currentType = selectedSection ? (selectedSection.section_type || '').toLowerCase().trim() : "hero";

    const handleFieldChange = (key, value) => {
        const updated = { ...localContent, [key]: value };
        setLocalContent(updated);
        onManualUpdate(selectedSection.id, updated);
    };

    const handleArrayItemChange = (arrayKey, index, fieldKey, value) => {
        const listCopy = [...(localContent[arrayKey] || [])];
        if (!listCopy[index]) { listCopy[index] = {}; }
        listCopy[index] = { ...listCopy[index], [fieldKey]: value };
        const updated = { ...localContent, [arrayKey]: listCopy };
        setLocalContent(updated);

        if (!String(selectedSection.id).includes('education')) {
            onManualUpdate(selectedSection.id, updated);
        }
    };

    // --- TOOL VIEW 1: BRAND THEMES ---
    if (safeToolKey.includes("THEME")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Workspace Themes</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Select an identity framework to style your live portfolio build canvas cards.</p>
                </div>
                <div className="space-y-3">
                    {Object.values(PORTFOLIO_THEMES || {}).map((themeObj) => {
                        const isSelected = userData && userData.theme === themeObj.id;
                        return (
                            <button
                                key={themeObj.id}
                                type="button"
                                onClick={() => setUserData({ ...userData, theme: themeObj.id })}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-200 ${
                                    isSelected ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg' : 'border-[#232635] bg-[#0d0e12] text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <span>{themeObj.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- TOOL VIEW 2: IMAGE CUSTOMIZER ---
    if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Image Customizer</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Generate or assign mock vector graphical placeholders or avatars.</p>
                </div>
                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 space-y-3">
                    <textarea className="w-full bg-[#13151c] border border-[#232635] rounded-lg p-2.5 text-xs text-white outline-none resize-none h-20" placeholder="AI Image Prompt Context..."/>
                    <button type="button" className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg">Generate Asset</button>
                </div>
            </div>
        );
    }

    // --- TOOL VIEW 3: CODE EXPORT ---
    if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Code Export Shell</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Compile your structural template configurations directly into a production-ready web file module asset.</p>
                </div>

                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {`<!DOCTYPE html>\n<html>\n  <head>\n    \n  </head>\n  <body>\n    \n  </body>\n</html>`}
                </div>

                <button 
                    onClick={triggerHtmlWebsiteDownload}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.99]"
                >
                    📥 Download Standalone HTML Site
                </button>
            </div>
        );
    }

    // --- TOOL VIEW 4: ✨ AI STUDIO HUB ---
    if (safeToolKey.includes("GENERATOR")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col shrink-0 overflow-hidden">
                
                {/* Context Anchor Header */}
                <div className="p-4 bg-[#0d0e12]/60 border-b border-[#1f222c] flex items-center justify-between shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Section</span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">
                        {currentType.toUpperCase()}
                    </span>
                </div>

                {/* Sub-Tabs Navigation Header */}
                <div className="grid grid-cols-3 bg-[#0d0e12] border-b border-[#1f222c] p-1 font-bold text-[10px] uppercase text-center shrink-0">
                    {['Generate', 'Improve', 'Review'].map(tab => (
                        <button 
                            key={tab}
                            type="button"
                            onClick={() => setStudioSubTab(tab)}
                            className={`py-1.5 rounded-lg transition-all cursor-pointer ${studioSubTab === tab ? 'bg-purple-600 text-white font-black' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Dynamic Content Stream Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    
                 {/* 📝 SUB-TAB: Generate */}
                 {studioSubTab === 'Generate' && (
           <div className="space-y-3">
           <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Section Blueprints</div>
        
        {/* 1. Hero Section Generators */}
        {currentType === 'hero' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE a high-impact Hero section. Include: heading (Name), subheading (Professional Title/Tagline), and placeholders for live/design URLs.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">✨ Generate Hero Section</span>
                <span className="text-[9px] text-slate-500 font-medium">Assembles profile headers, titles, and CTA links.</span>
            </button>
        )}

        {/* 2. About Section Generators */}
        {currentType === 'about' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE a professional About Me bio. Focus on technical background, engineering goals, and passion for innovation.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">👤 Generate About Me Bio</span>
                <span className="text-[9px] text-slate-500 font-medium">Writes a technical student/professional summary.</span>
            </button>
        )}

        {/* 3. Skills Section Generators */}
        {currentType === 'skills' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE a categorized technical skills list including Frontend, Backend, Database, and Tools.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">📊 Generate Skill Stack</span>
                <span className="text-[9px] text-slate-500 font-medium">Populates categorization lists for technical expertise.</span>
            </button>
        )}

        {/* 4. Projects Section Generators */}
        {currentType === 'projects_grid' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE professional project cards including titles, technical descriptions, tags, and placeholder live/repo links.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">🚀 Generate Project Grid</span>
                <span className="text-[9px] text-slate-500 font-medium">Creates showcase cards with tech stack tags.</span>
            </button>
        )}

        {/* 5. Experience Section Generators */}
        {currentType === 'experience' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE professional work experience entries including role, company, dates, and bulleted impact statements.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">💼 Generate Experience Row</span>
                <span className="text-[9px] text-slate-500 font-medium">Adds professional history and role descriptions.</span>
            </button>
        )}

        {/* 6. Education Section Generators */}
        {currentType === 'education' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE an education entry including institution name, degree program, graduation year, and GPA/score.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">🎓 Generate Education Record</span>
                <span className="text-[9px] text-slate-500 font-medium">Adds academic credential formatting blocks.</span>
            </button>
        )}

        {/* 7. Contact Section Generators */}
        {currentType === 'contact' && (
            <button type="button" onClick={() => onSubmitPrompt("GENERATE a compelling Contact/CTA section for potential recruiters and collaborators.")} className="w-full p-3 text-left bg-[#0d0e12] border border-purple-500/20 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition-all flex flex-col gap-1 cursor-pointer outline-none">
                <span className="font-bold text-purple-400">📧 Generate Contact CTA</span>
                <span className="text-[9px] text-slate-500 font-medium">Writes an inviting call-to-action message.</span>
            </button>
        )}
    </div>
)}

                    {/* ✏️ SUB-TAB: Improve */}
                    {studioSubTab === 'Improve' && (
                        <div className="space-y-4">
                            <div>
                                <div className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-2">Tone Adjustments</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { title: '💼 Professional', prompt: 'Rewrite using an advanced, recruiter-friendly corporate voice layout.' },
                                        { title: '⚡ Startup / Agile', prompt: 'Polish wording metrics using a quick, disruptive startup tone.' },
                                        { title: '🔮 Cyberpunk', prompt: 'Translate styling content text streams into high-fidelity neon syntax paradigms.' },
                                        { title: '🎯 Recruiter Pick', prompt: 'Optimize impact measurements and emphasize system achievements for tracking managers.' }
                                    ].map(item => (
                                        <button 
                                            key={item.title}
                                            type="button"
                                            onClick={() => onSubmitPrompt(`For this active portfolio block type "${currentType}", please preserve JSON data constraints and execute this instruction: ${item.prompt}`)}
                                            className="p-2.5 text-center bg-[#0d0e12] border border-[#232635] hover:border-purple-500 text-slate-300 text-[10px] font-bold rounded-xl transition-all cursor-pointer outline-none font-sans"
                                        >
                                            {item.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Structural Utilities</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => onSubmitPrompt(`Compress and shorten text structures for this segment type "${currentType}" to maximize clean presentation readability indices.`)}
                                        className="py-2 bg-[#0d0e12] border border-slate-800 hover:border-purple-500 text-slate-400 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                        🔍 Shorten Text
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => onSubmitPrompt(`Expand details and add technical metrics depth for this portfolio block item type "${currentType}".`)}
                                        className="py-2 bg-[#0d0e12] border border-slate-800 hover:border-purple-500 text-slate-400 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                        📈 Expand Scope
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 📊 SUB-TAB: Review (⚡ FULLY INTEGRATED LIVE BACKEND ANALYSIS) */}
                    {studioSubTab === 'Review' && (
                        <div className="space-y-4 font-sans leading-normal">
                            <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Real-Time Canvas Review</div>
                            
                            {loadingReview ? (
                                <div className="text-center py-6 text-xs text-slate-500 italic animate-pulse">Running portfolio score calculation...</div>
                            ) : reviewData ? (
                                <div className="space-y-4">
                                    {/* Overall Score Progress Section */}
                                    <div className="p-4 bg-[#0d0e12] border border-[#232635] rounded-xl space-y-2.5">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-400">Holistic Score</span>
                                            <span className="text-emerald-400 font-mono font-black text-sm">{reviewData.overall_score}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${reviewData.overall_score}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Missing Elements Checklist */}
                                    {reviewData.missing_items && reviewData.missing_items.length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Missing Variables</div>
                                            <div className="bg-[#0d0e12]/60 border border-[#232635] p-3 rounded-xl space-y-1">
                                                {reviewData.missing_items.map((item, idx) => (
                                                    <div key={idx} className="text-[11px] text-rose-400 font-medium">⚠️ Missing: {item}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestions Log */}
                                    <div className="space-y-1.5">
                                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider">AI Suggestions Blueprint</div>
                                        <div className="space-y-1.5">
                                            {reviewData.suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="bg-[#0d0e12] p-2.5 border border-[#1f222c] rounded-xl text-[11px] text-slate-400 leading-normal">
                                                    💡 {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-600 italic">No analysis payload returned from endpoint path.</div>
                            )}
                        </div>
                    )}

                </div>

                {/* AI Terminal Streams Log View */}
                <div className="h-24 border-t border-[#1f222c] bg-[#0d0e12]/40 p-3 font-mono text-[10px] text-slate-500 overflow-y-auto shrink-0">
                    <div>// Studio Pipeline Console Log Hook</div>
                    {logs && logs.length > 0 ? (
                        <div className="text-purple-400 mt-1">{typeof logs[0] === 'object' ? logs[0].desc : logs[0]}</div>
                    ) : ( <div className="italic mt-1">Ready for inputs...</div> )}
                </div>

                {/* Prompt Chat Box Bar Layer */}
                <form onSubmit={handleSubmit} className="p-3 border-t border-[#1f222c] bg-[#0d0e12] shrink-0">
                    <div className="relative flex items-center bg-[#13151c] border border-[#232635] rounded-xl focus-within:border-purple-500 transition-all">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="pl-3 pr-1 text-slate-500 hover:text-purple-400 transition-colors text-xs font-bold cursor-pointer">📎</button>
                        <input type="text" placeholder="Ask AI Studio anything..." className="w-full bg-transparent pl-2 pr-10 py-2.5 text-xs text-white outline-none font-medium" value={promptText} onChange={(e) => setPromptText(e.target.value)} />
                        <button type="submit" className="absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs cursor-pointer">⚡</button>
                    </div>
                </form>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // DEFAULT BRANCH VIEW: MANUAL PROPERTY TEXT FIELD FORM EDITOR
    // -----------------------------------------------------------------
    return (
        <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col select-none shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1f222c] space-y-4 shrink-0 flex-1 overflow-y-auto">
                <div className="mb-2">
                    <h3 className="text-xs uppercase font-black tracking-wider text-slate-200">📝 Manual Property Editor</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Direct manual editor mode. Select any element card inside the canvas to edit text by hand.</p>
                </div>
                
                {selectedSection ? (
                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-purple-400">Editing Target: [{currentType.toUpperCase()}]</label>
                        
                        {currentType === 'hero' && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Heading Name</span>
                                    <input type="text" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" value={localContent.heading || ''} onChange={(e) => handleFieldChange('heading', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Subheading headline</span>
                                    <textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.subheading || ''} onChange={(e) => handleFieldChange('subheading', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">See Live Link</span>
                                        <input type="text" placeholder="https://..." className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none" value={localContent.liveUrl || ''} onChange={(e) => handleFieldChange('liveUrl', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Design link repo</span>
                                        <input type="text" placeholder="https://..." className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none" value={localContent.designUrl || ''} onChange={(e) => handleFieldChange('designUrl', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentType === 'about' && (
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Biography Summary text</span>
                                <textarea rows="5" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed" value={localContent.bio || ''} onChange={(e) => handleFieldChange('bio', e.target.value)} />
                            </div>
                        )}

                        {currentType === 'education' && (
                            <div className="space-y-3">
                                {(localContent.schools || []).map((school, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-white outline-none" value={school.institution || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'institution', e.target.value)} />
                                        <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 outline-none" value={school.degree || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'degree', e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none" value={school.years || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'years', e.target.value)} />
                                            <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none" value={school.score || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'score', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'skills' && (
                            <div className="space-y-3">
                                {(localContent.items || []).map((skill, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-1.5">
                                        <input type="text" className="w-full bg-transparent border-b border-slate-800 focus:border-purple-500 pb-0.5 text-[11px] font-bold text-white outline-none" value={skill.name || ''} onChange={(e) => handleArrayItemChange('items', idx, 'name', e.target.value)} />
                                        <div className="flex items-center gap-2 pt-1">
                                            <input type="range" min="1" max="100" className="flex-1 accent-purple-500 h-1" value={skill.level || 50} onChange={(e) => handleArrayItemChange('items', idx, 'level', parseInt(e.target.value))} />
                                            <span className="text-[10px] font-bold text-purple-400 w-8 text-right">{skill.level}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'projects_grid' && (
                            <div className="space-y-3">
                                <input type="text" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" value={localContent.title || ''} onChange={(e) => handleFieldChange('title', e.target.value)} />
                                {(localContent.projects || []).map((project, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] font-bold text-white outline-none" value={project.title || ''} onChange={(e) => handleArrayItemChange('projects', idx, 'title', e.target.value)} />
                                        <textarea rows="2" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none resize-none" value={project.desc || ''} onChange={(e) => handleArrayItemChange('projects', idx, 'desc', e.target.value)} />
                                        <input type="text" placeholder="Project Link Target..." className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-white outline-none" value={project.projectUrl || ''} onChange={(e) => handleArrayItemChange('projects', idx, 'projectUrl', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentType === 'contact' && (
                            <div className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Call to action line text</span>
                                <textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.text || ''} onChange={(e) => handleFieldChange('text', e.target.value)} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0d0e12]/40 border border-[#232635]/60 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500 italic">Click on any section card block in the center canvas to inspect its properties.</p></div>
                )}
            </div>
        </div>
    );
}
