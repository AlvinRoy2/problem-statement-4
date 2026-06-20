import React, { useState, useRef } from 'react';
import { Leaf, Activity, Trophy, AlertCircle, Bot, TrendingUp, Upload, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fetchHealth = async () => {
  const res = await fetch('/health');
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

const fetchInsights = async () => {
  const res = await fetch('/api/ai/insights');
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
};

const mockChartData = [
  { name: 'Mon', emissions: 12 },
  { name: 'Tue', emissions: 15 },
  { name: 'Wed', emissions: 8 },
  { name: 'Thu', emissions: 20 },
  { name: 'Fri', emissions: 14 },
  { name: 'Sat', emissions: 5 },
  { name: 'Sun', emissions: 7 },
];

export default function App() {
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'receipt'>('manual');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: health, isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: 1,
  });

  const { data: aiInsights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    retry: false,
    enabled: !!health,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging amount:', amount);
    setAmount('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
        const res = await fetch('/api/ocr/upload', {
            method: 'POST',
            body: formData,
            // Assuming auth middleware requires a token, skipping for local dev ease or mocking
        });
        const data = await res.json();
        console.log('OCR Result:', data);
        if (data.estimatedEmissionsKg) {
            setAmount(data.estimatedEmissionsKg.toString());
            setActiveTab('manual'); // switch back to show the extracted amount
        }
    } catch (error) {
        console.error('Upload failed', error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } }
  };

  // Impact Calculations (Mocking 1250 total points saved)
  const totalPoints = 1250;
  const treesPlanted = Math.floor(totalPoints / 20);
  const milesSaved = Math.floor(totalPoints * 2.5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex flex-col p-4 md:p-8 font-sans overflow-x-hidden">
      <motion.header 
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="max-w-6xl w-full mx-auto flex items-center justify-between mb-10"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl text-white shadow-xl shadow-green-500/20">
            <Leaf className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">EcoTrack AI</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white/50">
          <Activity className={`w-4 h-4 ${isHealthError ? 'text-red-500' : 'text-emerald-500'}`} />
          <span className="text-sm font-bold text-gray-700">{isHealthError ? 'System Offline' : 'System Online'}</span>
        </div>
      </motion.header>

      <motion.main variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Input Card */}
          <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg"><AlertCircle className="w-6 h-6 text-emerald-600" /></div>
                Log Carbon Activity
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Manual</button>
                    <button onClick={() => setActiveTab('receipt')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'receipt' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Smart Receipt</button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'manual' ? (
                    <motion.form key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2">CO2 Emission (kg)</label>
                            <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 group focus-within:border-emerald-500 transition-colors">
                                <motion.div initial={false} animate={{ width: amount ? '100%' : '0%' }} className="absolute bottom-0 left-0 h-1 bg-emerald-500 z-10" />
                                <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-6 pr-12 py-4 outline-none bg-gray-50/50 text-gray-800 text-lg font-medium placeholder:text-gray-400" placeholder="e.g. 15.5" required aria-label="Enter CO2 Emission in kg" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-3">
                            Log Footprint <Leaf className="w-5 h-5" />
                        </motion.button>
                    </motion.form>
                ) : (
                    <motion.div key="receipt" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                        <div 
                            className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/jpeg, image/png" aria-label="Upload receipt image" />
                            {isUploading ? (
                                <div className="space-y-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-sm font-bold text-emerald-700">Extracting data with AI...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600"><Upload className="w-8 h-8" /></div>
                                    <div>
                                        <p className="font-bold text-gray-800">Upload a Receipt</p>
                                        <p className="text-xs text-gray-500 mt-1">AI will extract items and calculate emissions.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.section>

          {/* Chart Section */}
          <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-teal-600" /></div>
              Emission Trends
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <CartesianGrid vertical={false} stroke="#f3f4f6" />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col gap-8">
          
          {/* Gamification & Impact Visualizer Card */}
          <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden group hover:shadow-amber-500/10 transition-all">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-50" />
              
              <div className="flex items-center gap-4 relative z-10 mb-6">
                <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="bg-gradient-to-br from-amber-300 to-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/30">
                  <Trophy className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-800">Eco Warrior</h3>
                  <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Local Rank #4</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative z-10 flex items-end justify-between mb-4">
                <div>
                  <motion.p initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", delay: 0.5 }} className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                    {totalPoints.toLocaleString()}
                  </motion.p>
                  <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-1">Total Points</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 z-10">LVL</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white z-20">4</div>
                </div>
              </div>

              {/* Impact Visualizer */}
              <div className="relative z-10 border-t border-gray-100 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Real-World Impact</h4>
                  <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg"><Leaf className="w-4 h-4 text-green-600"/></div>
                      <p className="text-sm font-bold text-gray-700">Equivalent to <span className="text-green-600">{treesPlanted} Trees</span> planted</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg"><Activity className="w-4 h-4 text-blue-600"/></div>
                      <p className="text-sm font-bold text-gray-700">Equivalent to <span className="text-blue-600">{milesSaved.toLocaleString()} Miles</span> not driven</p>
                  </div>
              </div>
          </motion.section>

          {/* AI Insights Card */}
          <motion.section variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl shadow-xl shadow-blue-900/20 p-8 flex flex-col text-white relative overflow-hidden">
            <motion.div animate={{ x: [0, 10, 0], y: [0, 15, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-blue-400/20 blur-xl"></div>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><Bot className="w-6 h-6 text-white" /></div>
              Personalized AI Insights
            </h2>
            
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 relative z-10 shadow-inner min-h-[120px] flex flex-col justify-center gap-4">
              {isLoadingInsights ? (
                <div className="animate-pulse flex flex-col space-y-4 w-full">
                  <div className="h-2 bg-white/30 rounded w-3/4"></div>
                  <div className="h-2 bg-white/30 rounded w-full"></div>
                </div>
              ) : aiInsights?.insight ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="leading-relaxed font-medium text-blue-50 text-sm text-balance">
                  {aiInsights.insight}
                </motion.p>
              ) : (
                <p className="text-blue-200/80 italic text-sm">Waiting for data to generate insights...</p>
              )}
            </div>
          </motion.section>

          {/* Eco-Friendly Locations Map (Google Maps Embed API) */}
          <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 overflow-hidden relative">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg"><MapPin className="w-6 h-6 text-emerald-600" /></div>
              Local Eco Spots
            </h2>
            <div className="w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center relative z-10 shadow-inner">
              <iframe 
                title="Eco-friendly places map"
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{ border: 0 }} 
                src={`https://www.google.com/maps/embed/v1/search?q=recycling+centers+OR+eco-friendly+stores&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`} 
                allowFullScreen>
              </iframe>
              <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 rounded-2xl"></div>
            </div>
          </motion.section>

        </div>
      </motion.main>
    </div>
  );
}
