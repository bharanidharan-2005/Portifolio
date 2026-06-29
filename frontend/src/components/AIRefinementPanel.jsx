import React from 'react';
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
    const [promptText, setPromptText] = React.useState("");
    const fileInputRef = React.useRef(null);
    const [localContent, setLocalContent] = React.useState({});

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

    // ⚡ COMPILE AND DOWNLOAD STATIC STANDALONE PORTFOLIO HTML FILE MATCHING CURRENT UI/UX
    const triggerHtmlWebsiteDownload = () => {
        if (!pages || pages.length === 0) {
            alert("No data structure sections found to build.");
            return;
        }

        const activeThemeKey = userData.theme || 'cyberpunk_neon';
        const currentTheme = PORTFOLIO_THEMES[activeThemeKey] || PORTFOLIO_THEMES.cyberpunk_neon;
        const isMinimal = activeThemeKey === 'minimal_clean';

        // Extract sections from first page (Home)
        const activeSections = pages[0].sections || [];

        // Build HTML component parts cleanly
        let sectionsHtml = '';

        activeSections.forEach(sec => {
            const type = (sec.section_type || '').toLowerCase().trim();
            const data = sec.content_data || {};

            if (type === 'hero') {
                sectionsHtml += `
                <!-- 1. HERO SECTION -->
                <section class="text-center py-16 space-y-6 animate-fade-in">
                    <h1 class="text-4xl md:text-5xl font-black tracking-tight uppercase ${isMinimal ? 'text-slate-900' : 'text-white'}">
                        ${data.heading || 'YOUR NAME'}
                    </h1>
                    <p class="text-base max-w-xl mx-auto leading-relaxed ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">
                        ${data.subheading || 'Professional Track'}
                    </p>
                    <div class="flex justify-center gap-4 pt-2">
                        ${data.liveUrl ? `<a href="${data.liveUrl.startsWith('http') ? data.liveUrl : 'https://' + data.liveUrl}" target="_blank" rel="noopener" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 no-underline">See Live</a>` : ''}
                        ${data.designUrl ? `<a href="${data.designUrl.startsWith('http') ? data.designUrl : 'https://' + data.designUrl}" target="_blank" rel="noopener" class="px-5 py-2.5 border ${isMinimal ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border border-[#232635] text-slate-300 hover:bg-slate-900'} text-xs font-bold rounded-xl transition-all no-underline">Design</a>` : ''}
                    </div>
                </section>\n`;
            }

            else if (type === 'about') {
                sectionsHtml += `
                <!-- 2. ABOUT ME SECTION -->
                <section class="py-6 space-y-2">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">About Me</h2>
                    <p class="text-sm leading-relaxed font-medium ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">
                        ${data.bio || ''}
                    </p>
                </section>\n`;
            }

            else if (type === 'education') {
                let schoolsHtml = '';
                (data.schools || []).forEach(school => {
                    schoolsHtml += `
                    <div class="p-5 rounded-2xl transition-all ${isMinimal ? 'bg-slate-50 border border-slate-200' : 'bg-[#0d0e12] border border-[#1f222c]'}">
                        <div class="flex justify-between items-start gap-4">
                            <div>
                                <h3 class="text-sm font-bold uppercase tracking-wide ${isMinimal ? 'text-slate-900' : 'text-white'}">${school.institution || ''}</h3>
                                <p class="text-xs font-semibold text-purple-400 mt-0.5">${school.degree || ''}</p>
                            </div>
                            <span class="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md whitespace-nowrap">${school.years || ''}</span>
                        </div>
                        ${school.score ? `<div class="mt-3 pt-2 border-t ${isMinimal ? 'border-slate-200' : 'border-slate-900'} text-xs ${isMinimal ? 'text-slate-500' : 'text-slate-400'}">Performance Metric: <span class="font-mono font-bold ${isMinimal ? 'text-slate-900' : 'text-white'}">${school.score}</span></div>` : ''}
                    </div>\n`;
                });
                sectionsHtml += `
                <!-- 3. EDUCATION SECTION -->
                <section class="py-6 space-y-4">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">Educational Background</h2>
                    <div class="space-y-4">${schoolsHtml}</div>
                </section>\n`;
            }

            else if (type === 'skills') {
                let itemsHtml = '';
                (data.items || []).forEach(skill => {
                    itemsHtml += `
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-xs font-bold">
                            <span class="${isMinimal ? 'text-slate-900' : 'text-white'}">${skill.name || ''}</span>
                            <span class="text-purple-400 font-mono">${skill.level || 50}%</span>
                        </div>
                        <div class="w-full h-2 rounded-full overflow-hidden ${isMinimal ? 'bg-slate-200' : 'bg-slate-900'}">
                            <div class="h-full bg-purple-500 rounded-full" style="width: ${skill.level || 50}%"></div>
                        </div>
                    </div>\n`;
                });
                sectionsHtml += `
                <!-- 4. SKILLS SECTION -->
                <section class="py-6 space-y-4">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">Core Expertise Metrics</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">${itemsHtml}</div>
                </section>\n`;
            }

            else if (type === 'projects_grid') {
                let projsHtml = '';
                (data.projects || []).forEach(project => {
                    let tagsHtml = '';
                    (project.tags || []).forEach(tag => {
                        tagsHtml += `<span class="text-[9px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/60 rounded">${tag}</span>`;
                    });

                    projsHtml += `
                    ${project.projectUrl ? `<a href="${project.projectUrl.startsWith('http') ? project.projectUrl : 'https://' + project.projectUrl}" target="_blank" rel="noopener" class="no-underline block group">` : '<div class="block">'}
                    <div class="p-5 rounded-2xl flex flex-col justify-between h-full space-y-4 shadow-md transition-all ${isMinimal ? 'bg-slate-50 border border-slate-200 hover:bg-slate-100' : 'bg-[#0d0e12] border border-[#1f222c] hover:border-purple-500/40'}">
                        <div class="space-y-2">
                            <div class="flex justify-between items-center gap-2">
                                <h3 class="text-sm font-bold uppercase tracking-wide ${isMinimal ? 'text-slate-900' : 'text-white'}">${project.title || ''}</h3>
                                ${project.projectUrl ? '<span class="text-[10px] text-purple-400 font-bold shrink-0">🔗 Live</span>' : ''}
                            </div>
                            <p class="text-xs leading-relaxed ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">${project.desc || ''}</p>
                        </div>
                        <div class="flex flex-wrap gap-1">${tagsHtml}</div>
                    </div>
                    ${project.projectUrl ? '</a>' : '</div>'}\n`;
                });
                sectionsHtml += `
                <!-- 5. PROJECTS SECTION -->
                <section class="py-6 space-y-4">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">${data.title || 'Featured Innovations'}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${projsHtml}</div>
                </section>\n`;
            }

            else if (type === 'contact') {
                sectionsHtml += `
                <!-- 6. CONTACT SECTION -->
                <section class="text-center py-10 border-t ${isMinimal ? 'border-slate-200' : 'border-slate-900'} mt-8 space-y-3">
                    <h2 class="text-xs uppercase font-black tracking-widest text-purple-400">Get In Touch</h2>
                    <p class="text-xs max-w-xs mx-auto leading-relaxed ${isMinimal ? 'text-slate-600' : 'text-slate-400'}">
                        ${data.text || ''}
                    </p>
                </section>\n`;
            }
        });

        const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userData.name || 'Developer'} - Portfolio Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="min-h-screen transition-colors duration-300 ${isMinimal ? 'bg-white text-slate-900' : 'bg-[#090a0f] text-slate-100'} px-6 py-12 flex flex-col items-center">
    <div class="w-full max-w-3xl space-y-8">
        ${sectionsHtml}
    </div>
</body>
</html>`;

        const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const anchorElement = document.createElement('a');
        anchorElement.href = downloadUrl;
        anchorElement.download = `${(userData.name || 'portfolio').toLowerCase().replace(/\s+/g, '_')}_portfolio.html`;
        
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
        URL.revokeObjectURL(downloadUrl);
    };

    const safeToolKey = activeTool ? String(activeTool).toUpperCase().trim() : "";

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
                                    isSelected ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/5' : 'border-[#232635] bg-[#0d0e12] text-slate-400 hover:border-slate-700 hover:text-slate-200'
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
                    <textarea className="w-full bg-[#13151c] border border-[#232635] rounded-lg p-2.5 text-xs text-white outline-none resize-none h-20" placeholder="AI Image Prompt Context..."/>
                    <button type="button" className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg">Generate Asset</button>
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
                    <p className="text-[10px] text-slate-500 mt-1">Compile your structural template configurations directly into a production-ready web file module asset.</p>
                </div>

                <div className="bg-[#0d0e12] border border-[#232635] rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {`<!DOCTYPE html>\n<html>\n  <head>\n    <!-- Compiled Tailwind Production Grid Layer -->\n  </head>\n  <body>\n    <!-- Rendered Portfolio Sections Loop -->\n  </body>\n</html>`}
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

    const currentType = selectedSection ? (selectedSection.section_type || '').toLowerCase().trim() : "";

    return (
        <div className="w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col select-none shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1f222c] space-y-4 shrink-0 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xs uppercase font-black tracking-wider text-purple-400">⚡ Content Generator</h3>
                
                {selectedSection ? (
                    <div className="space-y-4">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Editing Target: [{currentType.toUpperCase()}]</label>
                        
                        {currentType === 'hero' && (
                            <div className="space-y-3">
                                <div className="space-y-1"><input type="text" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none" value={localContent.heading || ''} onChange={(e) => handleFieldChange('heading', e.target.value)} /></div>
                                <div className="space-y-1"><textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.subheading || ''} onChange={(e) => handleFieldChange('subheading', e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div className="space-y-1"><input type="text" placeholder="https://..." className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none" value={localContent.liveUrl || ''} onChange={(e) => handleFieldChange('liveUrl', e.target.value)} /></div>
                                    <div className="space-y-1"><input type="text" placeholder="https://..." className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:border-purple-500 outline-none" value={localContent.designUrl || ''} onChange={(e) => handleFieldChange('designUrl', e.target.value)} /></div>
                                </div>
                            </div>
                        )}

                        {currentType === 'about' && (
                            <div className="space-y-1"><textarea rows="5" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-relaxed" value={localContent.bio || ''} onChange={(e) => handleFieldChange('bio', e.target.value)} /></div>
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
                            <div className="space-y-1"><textarea rows="3" className="w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none resize-none leading-normal" value={localContent.text || ''} onChange={(e) => handleFieldChange('text', e.target.value)} /></div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#0d0e12]/40 border border-[#232635]/60 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500 italic">Click on any section card block in the center canvas to inspect its properties.</p></div>
                )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI Tool Streams Log</h4>
                <div className="space-y-2">
                    {logs && logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="bg-[#0d0e12] border border-[#232635] p-3 rounded-lg text-[11px] font-mono text-slate-400 leading-relaxed">
                            <span>{log && typeof log === 'object' ? log.desc : log}</span>
                        </div>
                    )) : ( <p className="text-[11px] text-slate-600 italic">No execution logs in this session context.</p> )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-[#1f222c] bg-[#0d0e12]/50 shrink-0">
                <div className="relative flex items-center bg-[#0d0e12] border border-[#232635] rounded-xl focus-within:border-purple-500 transition-all">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="pl-3 pr-1 text-slate-500 hover:text-purple-400 transition-colors text-xs font-bold cursor-pointer">📎</button>
                    <input type="text" placeholder="Ask AI to generate content..." className="w-full bg-transparent pl-2 pr-10 py-3 text-xs text-white outline-none font-medium" value={promptText} onChange={(e) => setPromptText(e.target.value)} />
                    <button type="submit" className="absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs cursor-pointer">⚡</button>
                </div>
            </form>
        </div>
    );
}
