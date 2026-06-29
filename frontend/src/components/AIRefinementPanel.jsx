import React from 'react';
import { PORTFOLIO_THEMES } from '../canvas/themes';

export default function AIRefinementPanel({ 
    logs, 
    onSubmitPrompt, 
    selectedSection, 
    onManualUpdate, 
    activeTool, 
    pages,
    userData,
    setUserData 
}) {
    const [promptText, setPromptText] = React.useState("");
    const fileInputRef = React.useRef(null);
    const [localContent, setLocalContent] = React.useState({});

    // Synchronize local form inputs when a new canvas section block node is clicked
    React.useEffect(() => {
        if (selectedSection && selectedSection.content_data) {
            setLocalContent(selectedSection.content_data);
        } else {
            setLocalContent({});
        }
    }, [selectedSection]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!promptText.trim()) return;
        onSubmitPrompt(promptText);
        setPromptText("");
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);
        if (selectedSection) {
            formData.append('section_id', selectedSection.id);
        }

        // 📎 Pass explicit indicator specifying that this load stream object contains file binaries
        onSubmitPrompt(formData, true); 
        e.target.value = null;
    };

    // Standardize key for clean matching
    const safeToolKey = activeTool ? String(activeTool).toUpperCase().trim() : "";

    // Dispatches state updates back down to your Django backend storage
    const handleFieldChange = (key, value) => {
        const updated = { ...localContent, [key]: value };
        setLocalContent(updated);
        onManualUpdate(selectedSection.id, updated);
    };

    // Special nested change observer for layout lists (like skills array metrics or project cards)
    const handleArrayItemChange = (arrayKey, index, fieldKey, value) => {
        const listCopy = [...(localContent[arrayKey] || [])];
        if (!listCopy[index]) {
            listCopy[index] = {};
        }
        listCopy[index] = { ...listCopy[index], [fieldKey]: value };
        const updated = { ...localContent, [arrayKey]: listCopy };
        setLocalContent(updated);

        // Prevent pushing patch operations downstream if it's the permanent frontend runtime placeholder
        if (selectedSection.id !== 'permanent-injected-education-block-node') {
            onManualUpdate(selectedSection.id, updated);
        }
    };

    // -----------------------------------------------------------------
    // 🎨 TOOL 1: BRAND THEMES VIEW
    // -----------------------------------------------------------------
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
                                    isSelected
                                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/5'
                                        : 'border-[#232635] bg-[#0d0e12] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                            >
                                <span>{themeObj.name}</span>
                                <div className="flex gap-1 items-center">
                                    <span className={`w-2 h-2 rounded-full ${themeObj.id === 'minimal_clean' ? 'bg-slate-400' : 'bg-purple-500'}`}></span>
                                    <span className={`w-2 h-2 rounded-full ${themeObj.id === 'cyberpunk_neon' ? 'bg-[#00f0ff]' : 'bg-indigo-500'}`}></span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 🖼️ TOOL 2: IMAGE CUSTOMIZER VIEW
    // -----------------------------------------------------------------
    if (safeToolKey.includes("IMAGE") || safeToolKey.includes("CUSTOMIZER")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Image Customizer</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Generate or assign mock vector graphical placeholders or avatars.</p>
                </div>

                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 space-y-3">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">AI Image Prompt Context</label>
                    <textarea 
                        className="w-full bg-[#13151c] border border-[#232635] rounded-lg p-2.5 text-xs text-white outline-none resize-none h-20"
                        placeholder="e.g., Ultra-modern high-tech neon circuit background grid..."
                    />
                    <button type="button" className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors">
                        Generate Placeholder Asset
                    </button>
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 💻 TOOL 3: CODE EXPORT VIEW
    // -----------------------------------------------------------------
    if (safeToolKey.includes("CODE") || safeToolKey.includes("EXPORT")) {
        return (
            <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Code Export Shell</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Review compiled frontend production code arrays.</p>
                </div>

                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {`// Production Target Components\nexport default function ExportedPortfolio() {\n  return (\n    <div className="min-h-screen bg-slate-950 text-white">\n      {/* Parsed System Layout Loop */}\n    </div>\n  );\n}`}
                </div>

                <button 
                    onClick={() => alert("Code downloaded successfully!")}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
                >
                    📥 Download ZIP Architecture
                </button>
            </div>
        );
    }

    // ⚡ FIX: Fallback to detect signature handles if the node has an active injected identifier signature
    const currentType = selectedSection 
        ? (selectedSection.section_type || '').toLowerCase().trim() 
        : "";

    // -----------------------------------------------------------------
    // 🤖 DEFAULT VIEW: CONTENT GENERATOR & CHAT STREAM
    // -----------------------------------------------------------------
    return (
        <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col select-none shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1f222c] space-y-4 shrink-0 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">
                    ⚡ {activeTool || "Content Generator"}
                </h3>
                
                {selectedSection ? (
                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Editing Target: [{currentType.toUpperCase()}]
                        </label>
                        
                        {/* HERO COMPONENT PARAMETER FIELDS */}
                        {currentType === 'hero' && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500">Heading Name</label>
                                    <input type="text" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" value={localContent.heading || ''} onChange={(e) => handleFieldChange('heading', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500">Subheading Headline</label>
                                    <textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.subheading || ''} onChange={(e) => handleFieldChange('subheading', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* ABOUT TEXT BLOCK FIELD */}
                        {currentType === 'about' && (
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-500">Biography Core Narrative</label>
                                <textarea rows="5" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed" value={localContent.bio || ''} onChange={(e) => handleFieldChange('bio', e.target.value)} />
                            </div>
                        )}

                        {/* EDUCATION AREA FIELDS (DYNAMIC FALLBACK RENDER ACCESSIBILITY) */}
                        {currentType === 'education' && (
                            <div className="space-y-3">
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Academic Milestones</label>
                                {(localContent.schools || [
                                    { institution: "Mount Zion College of Engineering", degree: "B.E. Computer Science and Engineering", years: "2023 - 2027", score: "Current 3rd Year" }
                                ]).map((school, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <div className="space-y-1">
                                            <label className="text-[8px] uppercase font-bold text-slate-600">Institution</label>
                                            <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-white outline-none" value={school.institution || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'institution', e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] uppercase font-bold text-slate-600">Degree / Course</label>
                                            <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 outline-none" value={school.degree || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'degree', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-slate-600">Timeline Years</label>
                                                <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none" value={school.years || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'years', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-bold text-slate-600">GPA / Marks Score</label>
                                                <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-400 outline-none" value={school.score || ''} onChange={(e) => handleArrayItemChange('schools', idx, 'score', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SKILLS CHRONOLOGICAL ARRAY KNOBS */}
                        {currentType === 'skills' && (
                            <div className="space-y-3">
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Expertise Metrics List</label>
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

                        {/* PROJECTS SUB-CARD PROPERTY WRAPPERS */}
                        {currentType === 'projects_grid' && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500">Section Header Label</label>
                                    <input type="text" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" value={localContent.title || ''} onChange={(e) => handleFieldChange('title', e.target.value)} />
                                </div>
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Project Nodes</label>
                                {(localContent.projects || []).map((project, idx) => (
                                    <div key={idx} className="bg-[#0d0e12] border border-[#232635] p-2.5 rounded-xl space-y-2">
                                        <input type="text" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[11px] font-bold text-white outline-none" value={project.title || ''} onChange={(e) => handleArrayItemChange('projects', idx, 'title', e.target.value)} />
                                        <textarea rows="2" className="w-full bg-[#13151c] border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-300 outline-none resize-none" value={project.desc || ''} onChange={(e) => handleArrayItemChange('projects', idx, 'desc', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CONTACT CTA FIELD */}
                        {currentType === 'contact' && (
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-500">Call to Action Messaging</label>
                                <textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.text || ''} onChange={(e) => handleFieldChange('text', e.target.value)} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0d0e12]/40 border border-[#232635]/60 rounded-xl p-3 text-center">
                        <p className="text-[11px] text-slate-500 italic">Click on any section card block in the center canvas to inspect its custom AI properties.</p>
                    </div>
                )}
            </div>

            {/* AI Process Execution Logs Section */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI Tool Streams Log</h4>
                <div className="space-y-2">
                    {logs && logs.length > 0 ? logs.map((log, i) => {
                        const logMessage = log && typeof log === 'object' ? log.desc : log;
                        return (
                            <div key={i} className="bg-[#0d0e12] border border-[#232635] p-3 rounded-lg text-[11px] font-mono text-slate-400 leading-relaxed flex flex-col gap-1">
                                <span>{logMessage || "Mutation processed successfully."}</span>
                                {log && log.type && (
                                    <span className="text-[9px] uppercase tracking-wider text-purple-500 opacity-60 font-bold">
                                        [{log.type}] Status: {log.status || "Complete"}
                                    </span>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="text-[11px] text-slate-600 italic">No execution logs in this session context.</p>
                    )}
                </div>
            </div>

            {/* Prompt Form Input Shell Layer */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-[#1f222c] bg-[#0d0e12]/50 shrink-0">
                <div className="relative flex items-center bg-[#0d0e12] border border-[#232635] rounded-xl focus-within:border-purple-500 transition-all">
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                    />

                    <button 
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="pl-3 pr-1 text-slate-500 hover:text-purple-400 transition-colors text-xs font-bold"
                        title="Upload Resume to Parse"
                    >
                        📎
                    </button>

                    <input 
                        type="text"
                        placeholder="Ask AI to generate content or drop your resume..."
                        className="w-full bg-transparent pl-2 pr-10 py-3 text-xs text-white outline-none font-medium"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                    />
                    <button type="submit" className="absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs">⚡</button>
                </div>
            </form>
        </div>
    );
}
