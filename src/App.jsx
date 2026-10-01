import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles, Download, Image as ImageIcon, AlertCircle, Wand2, Zap, Settings, X, Save } from 'lucide-react';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer effect for tracking loading duration
  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const generateImage = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    const startTime = Date.now();

    try {
      // Use user provided API key or fallback to platform injection placeholder
      const keyToUse = apiKey.trim() || "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${keyToUse}`;

      const payload = {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          // Default to a 1:1 aspect ratio for a standard square image
          imageConfig: { aspectRatio: "1:1" }
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("403 Forbidden: Invalid API Key. Please click the Settings (gear) icon in the top right to add your own valid Gemini API key.");
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      // Extract the image data from the response structure
      const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!part || !part.inlineData) {
        throw new Error("No image data found in the response.");
      }

      const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      setGeneratedImage(imageUrl);
      setGenerationTime(((Date.now() - startTime) / 1000).toFixed(1));

    } catch (err) {
      console.error("Error generating image:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-violet-500/30">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#09090b]/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1.5 rounded-lg group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300">
              <Wand2 size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
              GenArt Studio
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-zinc-900/80 text-zinc-300 px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
              <Zap size={14} className="text-amber-400" />
              Powered by Gemini
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 bg-zinc-900/80 text-zinc-300 hover:text-white rounded-full border border-white/10 shadow-sm hover:bg-zinc-800 transition-colors"
              title="Settings / API Key"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
              <Settings size={20} className="text-violet-400"/> Settings
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Enter your Gemini API key to generate images. Your key is stored locally in your browser.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('gemini_api_key', e.target.value);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-white text-zinc-900 font-semibold py-2.5 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6 w-full max-w-6xl mx-auto gap-10 z-10 relative">
        
        {/* Intro Section */}
        <div className="text-center space-y-4 max-w-3xl mt-4 sm:mt-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Imagine. Create. 
            </span>
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              {" "}Inspire.
            </span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
            Transform your thoughts into stunning visual reality. Enter a detailed prompt and watch the AI bring your imagination to life.
          </p>
        </div>

        {/* Input Form with Premium Glow */}
        <form onSubmit={generateImage} className="w-full max-w-3xl relative group z-20">
          {/* Animated Glow Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 focus-within:bg-zinc-900 transition-colors">
            <div className="flex-grow flex items-center w-full px-4 py-2">
              <Sparkles className="text-violet-400 mr-3 hidden sm:block" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your masterpiece... (e.g. A cyberpunk samurai in neon rain)"
                className="w-full bg-transparent border-none text-zinc-100 py-2 sm:py-3 outline-none placeholder:text-zinc-500 text-base sm:text-lg focus:ring-0"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-3.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-zinc-900" />
                  <span>Generating</span>
                </>
              ) : (
                <>
                  <span>Create</span>
                  <Wand2 size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example Prompts - Styled as Glass Pills */}
        {!generatedImage && !loading && !error && (
           <div className="w-full max-w-4xl flex flex-col items-center gap-4 mt-2">
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-2">
               <span className="w-8 h-px bg-zinc-700"></span>
               Inspirations
               <span className="w-8 h-px bg-zinc-700"></span>
             </p>
             <div className="flex flex-wrap justify-center gap-2.5">
               {['Astronaut meditating on Mars', 'Bioluminescent forest at night', 'Retro-futuristic coffee shop', 'A majestic crystal dragon'].map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPrompt(ex);
                      if(inputRef.current) inputRef.current.focus();
                    }}
                    className="text-sm bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-full border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    {ex}
                  </button>
               ))}
             </div>
           </div>
        )}

        {/* Error State */}
        {error && (
          <div className="w-full max-w-3xl bg-red-950/30 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4 text-red-200 backdrop-blur-md shadow-lg">
            <div className="bg-red-500/20 p-2 rounded-full">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div className="mt-0.5">
              <h4 className="font-semibold text-base text-red-300">Generation Failed</h4>
              <p className="text-sm opacity-90 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Image Display Area - Cinematic Presentation */}
        <div className={`w-full max-w-4xl aspect-square sm:aspect-[16/10] relative rounded-3xl overflow-hidden transition-all duration-700 ${
          generatedImage ? 'bg-zinc-950 ring-1 ring-white/10 shadow-2xl shadow-violet-900/20' : 'bg-zinc-900/30 border-2 border-dashed border-white/10'
        } flex flex-col items-center justify-center group`}>
          
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
              {/* Scanning laser effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(139,92,246,1)] animate-[scan_2s_ease-in-out_infinite]" 
                   style={{ animation: 'scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
                <style>{`
                  @keyframes scan {
                    0% { transform: translateY(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(10000%); opacity: 0; }
                  }
                `}</style>
              </div>
              
              <div className="relative z-10 flex flex-col items-center space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="w-20 h-20 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin"></div>
                  <Wand2 size={28} className="text-violet-400 absolute animate-pulse" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200">
                    Weaving pixels...
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-mono bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner text-violet-300">
                      {elapsedSeconds}s elapsed
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 max-w-[250px] mx-auto mt-4">
                    Masterpieces take time. Usually ready in 5-15 seconds.
                  </p>
                </div>
              </div>
            </div>
          ) : generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt={prompt} 
                className="w-full h-full object-contain bg-zinc-950 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
              
              {/* Image Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 pointer-events-none">
                 
                 {/* Top tags */}
                 <div className="flex justify-end transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                   {generationTime && (
                     <span className="bg-black/50 backdrop-blur-md text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                       <Zap size={12} className="text-amber-400" />
                       {generationTime}s
                     </span>
                   )}
                 </div>

                 {/* Bottom details */}
                 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <div className="max-w-[75%] pointer-events-auto">
                      <p className="text-white font-medium line-clamp-3 text-sm sm:text-base leading-relaxed text-shadow-sm">
                        "{prompt}"
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="pointer-events-auto shrink-0 bg-white hover:bg-zinc-200 text-zinc-900 p-3.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group/btn"
                      title="Download High-Res Image"
                    >
                      <Download size={20} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 space-y-4 p-8 text-center">
              <div className="bg-zinc-900/50 p-6 rounded-full border border-white/5 shadow-inner mb-2">
                <ImageIcon size={48} strokeWidth={1} className="text-zinc-500" />
              </div>
              <h3 className="text-xl font-medium text-zinc-400">Canvas is empty</h3>
              <p className="text-sm max-w-sm">Enter a prompt above to generate your first AI artwork. The more descriptive, the better!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
