import React, { useState, useEffect } from 'react';
import API from './api';
import PipelineBar from './components/PipelineBar';
import LeftNavSidebar from './components/LeftNavSidebar';
import AIRefinementPanel from './components/AIRefinementPanel';
import CanvasContainer from './canvas/CanvasContainer';

export default function App() {
  // 🧭 STATE MACHINE: Flows from NAME -> CREDENTIALS -> PREFERENCES -> CONCEPT -> WORKSPACE
  const [onboardingStep, setOnboardingStep] = useState('NAME');
  const [userData, setUserData] = useState({ name: 'Bharanidharan', email: '', password: '', theme: 'dark', department: 'Software Engineering' });
  const [errorMessage, setErrorMessage] = useState('');

  // Core Application Layout States
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [viewMode, setViewMode] = useState("Desktop");
  const [aiLogs, setAiLogs] = useState([]);
  
  // 🔮 Lovable-Style Sub-Panel State Integration
  const [activeTool, setActiveTool] = useState(null);

  // ✨ AI Generation Wizard Local States
  const [siteIdea, setSiteIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch state array rows layout loop from Python
  const fetchWorkspaceData = () => {
    API.get('pages/')
      .then(res => {
        setPages(res.data);
        if (res.data.length > 0 && !activePage) {
          setActivePage(res.data[0].name);
          // Set initial block active selection if nodes exist
          if (res.data[0].sections && res.data[0].sections.length > 0) {
            setActiveSectionId(res.data[0].sections[0].id);
          }
        }
      })
      .catch(err => console.error("Database connection dropped:", err));
  };

  useEffect(() => {
    if (onboardingStep === 'WORKSPACE') {
      fetchWorkspaceData();
    }
  }, [onboardingStep]);

  // Handle live generative modifications from the prompt box
  const handleNewPrompt = (textPrompt) => {
    API.post('ai-refinement/', { 
      prompt: textPrompt,
      section_id: activeSectionId
    })
    .then(res => {
      setAiLogs(prev => [res.data.log, ...prev]);
      fetchWorkspaceData(); // Refresh canvas seamlessly with updated copy
    })
    .catch(err => console.error("AI mutation pipeline error:", err));
  };

  // Inline Direct Save Handler for Manual Properties Bar input updates
  const handleManualSectionSave = (sectionId, updatedContentData) => {
    API.patch(`sections/${sectionId}/`, { content_data: updatedContentData })
      .then(() => {
        fetchWorkspaceData(); // Instant non-destructive reload
      })
      .catch(err => console.error("Manual adjustment update error:", err));
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userData.name.trim().length > 0) { 
      setErrorMessage(''); 
      setOnboardingStep('CREDENTIALS'); 
    } else { 
      setErrorMessage('Please introduce your name first.'); 
    }
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) { setErrorMessage('Please enter a valid email format.'); return; }
    if (userData.password.length < 8) { setErrorMessage('Password must be 8+ characters.'); return; }
    setErrorMessage('');
    setOnboardingStep('PREFERENCES');
  };

  const handlePreferenceSelect = (field, value) => {
    const updatedData = { ...userData, [field]: value };
    setUserData(updatedData);
    if (field === 'department' && updatedData.theme) {
      // Divert pipeline step to prompt-based design collection layer instead of straight workspace entry
      setOnboardingStep('CONCEPT');
    }
  };

  // Triggers master template matrix configuration on the Python framework side
  const handleConceptGeneration = (e) => {
    e.preventDefault();
    if (!siteIdea.trim()) return;

    setIsGenerating(true);
    setErrorMessage("");

    API.post('ai-generate-template/', { idea: siteIdea })
      .then(() => {
        setIsGenerating(false);
        setOnboardingStep('WORKSPACE'); // Unlocks studio workspace view context
      })
      .catch(err => {
        setIsGenerating(false);
        console.error(err);
        setErrorMessage("AI orchestration failed. Double-check backend server status & Gemini api credentials.");
      });
  };

  // -----------------------------------------------------------------
  // RENDER LEVEL A: ONBOARDING ENGINE LAYER (with Skip Controller Link)
  // -----------------------------------------------------------------
  if (onboardingStep !== 'WORKSPACE') {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#0d0e12] items-center justify-center font-sans p-4 relative">
        
        {/* Quick Skip Dev Toggle Shortcut at the Top */}
        <button 
          onClick={() => setOnboardingStep('WORKSPACE')}
          className="absolute top-6 right-6 text-[10px] bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold px-3 py-1.5 border border-purple-500/20 rounded-lg transition-all"
        >
          ⏩ Skip Setup wizard
        </button>

        <div className="w-full max-w-md bg-[#13151c] border border-[#1f222c] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-6 justify-center">
            <span className="w-8 h-8 bg-[#a855f7] rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg">A</span>
            <span className="font-bold text-white tracking-wide text-md">AuraBuild Workspace</span>
          </div>
          
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center">
              {errorMessage}
            </div>
          )}
          
          {onboardingStep === 'NAME' && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">What is your user name?</label>
              <input 
                type="text" 
                autoFocus 
                placeholder="Introduce yourself..." 
                className="w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]" 
                value={userData.name} 
                onChange={(e) => setUserData({...userData, name: e.target.value})} 
              />
              <button type="submit" className="w-full bg-[#a855f7] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest">Continue Setup</button>
            </form>
          )}

          {onboardingStep === 'CREDENTIALS' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <p className="text-xs text-[#a855f7] font-semibold">Pleasure meeting you, {userData.name}!</p>
              <input 
                type="email" 
                placeholder="name@domain.com" 
                className="w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]" 
                value={userData.email} 
                onChange={(e) => setUserData({...userData, email: e.target.value})} 
              />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-[#a855f7]" 
                value={userData.password} 
                onChange={(e) => setUserData({...userData, password: e.target.value})} 
              />
              <button type="submit" className="w-full bg-[#a855f7] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest">Verify Credentials</button>
            </form>
          )}

          {onboardingStep === 'PREFERENCES' && (
            <div className="space-y-5">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Select Options</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handlePreferenceSelect('theme', 'dark')} className="py-2.5 rounded-xl border border-[#a855f7] bg-[#a855f7]/10 text-white text-xs font-bold">🌙 Dark Theme</button>
                <button onClick={() => handlePreferenceSelect('theme', 'light')} className="py-2.5 rounded-xl border border-[#232635] bg-[#181a24] text-slate-400 text-xs font-bold">☀️ Light Theme</button>
              </div>
              <div className="space-y-2">
                {['💻 Software Engineering', '🧬 Art & Science Division', '📊 Core Data Analyst'].map(dept => (
                  <button 
                    key={dept} 
                    onClick={() => handlePreferenceSelect('department', dept.split(' ')[1] + ' ' + dept.split(' ')[2])} 
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#181a24] border border-[#232635] text-xs text-slate-300 hover:border-[#a855f7] hover:text-white transition-all"
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onboardingStep === 'CONCEPT' && (
            <form onSubmit={handleConceptGeneration} className="space-y-4">
              <p className="text-xs text-purple-400 font-semibold">✨ Let's forge your layout matrix framework</p>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Describe your portfolio design theme goal</label>
                <textarea 
                  rows="3"
                  autoFocus
                  placeholder="e.g., An IoT developer site showcasing smart sensor stations with dark purple modern cards and clean tracking project specs..." 
                  className="w-full bg-[#181a24] border border-[#232635] rounded-xl px-4 py-3 text-xs outline-none text-white focus:border-purple-500 resize-none"
                  value={siteIdea}
                  onChange={(e) => setSiteIdea(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <button 
                type="submit" 
                disabled={isGenerating || !siteIdea.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Assembling Architecture Layouts...
                  </>
                ) : "Generate AI Template Blueprint"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER LEVEL B: CORE WORKSPACE STUDIO LAYER
  // -----------------------------------------------------------------
  const activePageObj = pages.find(p => p.name === activePage);
  const visibleSections = activePageObj ? activePageObj.sections : [];
  const currentSelectedSection = visibleSections.find(s => s.id === activeSectionId);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0e12] text-slate-200 font-sans overflow-hidden select-none">
      <header className="h-14 border-b border-[#1f222c] bg-[#13151c] px-6 flex justify-between items-center text-sm shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#a855f7] rounded-lg flex items-center justify-center font-black text-white text-xs">A</span>
            <span className="font-bold text-white tracking-wide">AuraBuild Workspace Studio</span>
          </div>
          <span className="text-[10px] bg-[#1e2330] text-[#a855f7] px-2.5 py-0.5 border border-[#a855f7]/20 rounded font-bold uppercase tracking-wider">
            Operator Shell: {userData.name} // {userData.department.toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-slate-400 flex gap-4 font-medium items-center">
          <span>Theme: {userData.theme.toUpperCase()}</span>
          {/* Quick Return Option to re-test the login flow anytime */}
          <button 
            onClick={() => {
              setSiteIdea("");
              setOnboardingStep('NAME');
            }}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
          >
            Reset Flow
          </button>
        </div>
      </header>

      <PipelineBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Navigation Columns */}
        <LeftNavSidebar 
          pages={pages.map(p => p.name)} 
          activePage={activePage} 
          setActivePage={(pageName) => {
            setActivePage(pageName);
            setActiveTool(null); // Return focus to default section view when swapping routing nodes
            const targetPage = pages.find(p => p.name === pageName);
            if (targetPage && targetPage.sections.length > 0) {
              setActiveSectionId(targetPage.sections[0].id);
            }
          }} 
          onSelectTool={(toolKey) => {
            // Toggles panel content structure
            setActiveTool(activeTool === toolKey ? null : toolKey);
          }}
          activeTool={activeTool}
        />
        
        {/* Central Live Editing Canvas Device Box */}
        <main className="flex-1 bg-[#090a0f] p-6 overflow-y-auto flex flex-col items-center justify-start">
          <CanvasContainer 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            activePage={activePage}
            sections={visibleSections}
            activeSectionId={activeSectionId}
            setActiveSectionId={setActiveSectionId}
          />
        </main>

        {/* Right Side Adaptive AI Prompt & Element Inspector Column */}
        <AIRefinementPanel 
          logs={aiLogs} 
          onSubmitPrompt={handleNewPrompt}
          selectedSection={currentSelectedSection}
          onManualUpdate={handleManualSectionSave}
          activeTool={activeTool}
          pages={pages}
        />
      </div>
    </div>
  );
}
