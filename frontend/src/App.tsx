import React, { useState, useRef } from 'react';
import { Leaf, Activity, Trophy, AlertCircle, Bot, TrendingUp, Upload, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

declare global {
  interface Window {
    __ENV__?: {
      VITE_GOOGLE_ANALYTICS_ID: string;
    };
  }
}

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
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    setUploadError(null);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/ocr/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.estimatedEmissionsKg) {
        setAmount(data.estimatedEmissionsKg.toString());
        setActiveTab('manual');
      }
    } catch {
      setUploadError('Upload failed. Please try again with a valid image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDropZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 15 } },
  };

  // Impact Calculations
  const totalPoints = 1250;
  const treesPlanted = Math.floor(totalPoints / 20);
  const milesSaved = Math.floor(totalPoints * 2.5);

  const systemStatus = isHealthError ? 'System Offline' : 'System Online';


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex flex-col p-4 md:p-8 font-sans overflow-x-hidden">

      {/* Skip Navigation — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
      >
        Skip to main content
      </a>

      {/* ── Header ── */}
      <motion.header
        role="banner"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="max-w-6xl w-full mx-auto flex items-center justify-between mb-10"
      >
        <div className="flex items-center gap-3">
          <div
            className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl text-white shadow-xl shadow-green-500/20"
            aria-hidden="true"
          >
            <Leaf className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">EcoTrack AI</h1>
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-label={`Connection status: ${systemStatus}`}
          className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white/50"
        >
          <Activity
            className={`w-4 h-4 ${isHealthError ? 'text-red-500' : 'text-emerald-500'}`}
            aria-hidden="true"
          />
          <span className="text-sm font-bold text-gray-700">{systemStatus}</span>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <motion.main
        id="main-content"
        role="main"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8"
        aria-label="EcoTrack AI Dashboard"
      >

        {/* Left Column */}
        <div className="col-span-1 lg:col-span-2 space-y-8">

          {/* ── Carbon Log Card ── */}
          <motion.section
            variants={itemVariants}
            aria-label="Log Carbon Activity"
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg" aria-hidden="true">
                  <AlertCircle className="w-6 h-6 text-emerald-600" />
                </div>
                Log Carbon Activity
              </h2>

              {/* Tab list — WCAG 4.1.3 */}
              <div role="tablist" aria-label="Input method" className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  role="tab"
                  id="tab-manual"
                  aria-selected={activeTab === 'manual'}
                  aria-controls="tabpanel-manual"
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${activeTab === 'manual' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual
                </button>
                <button
                  role="tab"
                  id="tab-receipt"
                  aria-selected={activeTab === 'receipt'}
                  aria-controls="tabpanel-receipt"
                  onClick={() => setActiveTab('receipt')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${activeTab === 'receipt' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Smart Receipt
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.form
                  key="manual"
                  role="tabpanel"
                  id="tabpanel-manual"
                  aria-labelledby="tab-manual"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="co2-amount" className="block text-sm font-bold text-gray-700 mb-2">
                      CO₂ Emission (kg)
                    </label>
                    <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 group focus-within:border-emerald-500 transition-colors">
                      <motion.div
                        initial={false}
                        animate={{ width: amount ? '100%' : '0%' }}
                        className="absolute bottom-0 left-0 h-1 bg-emerald-500 z-10"
                        aria-hidden="true"
                      />
                      <input
                        id="co2-amount"
                        type="number"
                        min="0"
                        step="0.1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 outline-none bg-gray-50/50 text-gray-800 text-lg font-medium placeholder:text-gray-400 focus:ring-0"
                        placeholder="e.g. 15.5"
                        required
                        aria-describedby="co2-hint"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold" aria-hidden="true">kg</span>
                    </div>
                    <p id="co2-hint" className="text-xs text-gray-500 mt-1">Enter the estimated CO₂ equivalent in kilograms.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    aria-label="Log carbon footprint"
                  >
                    Log Footprint <Leaf className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="receipt"
                  role="tabpanel"
                  id="tabpanel-receipt"
                  aria-labelledby="tab-receipt"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  {/* Keyboard-accessible drop zone */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload a receipt image. Press Enter or Space to browse files."
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={handleDropZoneKeyDown}
                    className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/jpeg, image/png"
                      aria-label="Receipt image file input"
                      tabIndex={-1}
                    />
                    {isUploading ? (
                      <div className="space-y-4" role="status" aria-label="Processing receipt with AI">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
                        <p className="text-sm font-bold text-emerald-700">Extracting data with AI...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-emerald-600" aria-hidden="true">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Upload a Receipt</p>
                          <p className="text-xs text-gray-500 mt-1">AI will extract items and calculate emissions. Accepts JPG, PNG.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadError && (
                    <p role="alert" className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                      {uploadError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* ── Emission Trends Chart ── */}
          <motion.section
            variants={itemVariants}
            aria-label="Weekly emission trends chart"
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg" aria-hidden="true">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              Emission Trends
            </h2>
            <div className="h-64 w-full" role="img" aria-label="Area chart showing daily CO2 emissions over the past week, ranging from 5 to 20 kilograms">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} aria-hidden="true" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} unit=" kg" aria-hidden="true" />
                  <CartesianGrid vertical={false} stroke="#f3f4f6" aria-hidden="true" />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value ?? 0} kg`, 'CO₂ Emissions']}
                  />
                  <Area type="monotone" dataKey="emissions" name="CO₂ (kg)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="col-span-1 flex flex-col gap-8">

          {/* ── Gamification Card ── */}
          <motion.section
            variants={itemVariants}
            aria-label="Eco Warrior gamification and impact statistics"
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden group hover:shadow-amber-500/10 transition-all"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-8 -mt-8 opacity-50"
              aria-hidden="true"
            />
            <div className="flex items-center gap-4 relative z-10 mb-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="bg-gradient-to-br from-amber-300 to-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/30"
                aria-hidden="true"
              >
                <Trophy className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-800">Eco Warrior</h3>
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Local Rank #4</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative z-10 flex items-end justify-between mb-4">
              <div>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"
                  aria-label={`${totalPoints.toLocaleString()} total points`}
                >
                  {totalPoints.toLocaleString()}
                </motion.p>
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-1" aria-hidden="true">Total Points</p>
              </div>
              <div className="flex -space-x-2" aria-label="Level 4">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 z-10" aria-hidden="true">LVL</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white z-20" aria-hidden="true">4</div>
              </div>
            </div>

            <div className="relative z-10 border-t border-gray-100 pt-5 space-y-3" aria-label="Real-world impact summary">
              <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Real-World Impact</h4>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg" aria-hidden="true"><Leaf className="w-4 h-4 text-green-600" /></div>
                <p className="text-sm font-bold text-gray-700">
                  Equivalent to <span className="text-green-600">{treesPlanted} Trees</span> planted
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg" aria-hidden="true"><Activity className="w-4 h-4 text-blue-600" /></div>
                <p className="text-sm font-bold text-gray-700">
                  Equivalent to <span className="text-blue-600">{milesSaved.toLocaleString()} Miles</span> not driven
                </p>
              </div>
            </div>
          </motion.section>

          {/* ── AI Insights Card ── */}
          <motion.section
            variants={itemVariants}
            aria-label="Personalized AI carbon reduction insights"
            className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl shadow-xl shadow-blue-900/20 p-8 flex flex-col text-white relative overflow-hidden"
          >
            <motion.div
              animate={{ x: [0, 10, 0], y: [0, 15, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm" aria-hidden="true">
                <Bot className="w-6 h-6 text-white" />
              </div>
              Personalized AI Insights
            </h2>
            <div
              className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 relative z-10 shadow-inner min-h-[120px] flex flex-col justify-center gap-4"
              aria-live="polite"
              aria-busy={isLoadingInsights}
            >
              {isLoadingInsights ? (
                <div className="animate-pulse flex flex-col space-y-4 w-full" role="status" aria-label="Loading AI insights">
                  <div className="h-2 bg-white/30 rounded w-3/4" aria-hidden="true" />
                  <div className="h-2 bg-white/30 rounded w-full" aria-hidden="true" />
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

          {/* ── Daily Eco Challenges ── */}
          <motion.section
            variants={itemVariants}
            aria-label="Daily Eco Challenges for carbon reduction"
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 overflow-hidden relative"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg" aria-hidden="true">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              Daily Eco Challenges
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer" role="button" tabIndex={0} aria-label="Complete challenge: Meatless Monday. Earn 50 points.">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 transition-colors" aria-hidden="true">
                  <CheckCircle2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">Meatless Monday</h3>
                  <p className="text-xs text-gray-500 mt-1">Skip meat for one day to drastically reduce methane emissions.</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold" aria-hidden="true">
                  +50 pts
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer" role="button" tabIndex={0} aria-label="Complete challenge: Zero Waste Commute. Earn 100 points.">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-emerald-500 transition-colors" aria-hidden="true">
                  <CheckCircle2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">Zero Waste Commute</h3>
                  <p className="text-xs text-gray-500 mt-1">Bike or take public transit to work instead of driving.</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold" aria-hidden="true">
                  +100 pts
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  );
}
