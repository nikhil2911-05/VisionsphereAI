import React, { useState } from 'react';
import { Shield, Play, Loader, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { triggerTraining } from '../services/api';

const TrainingCenter = () => {
  const [token, setToken] = useState('dev_secret_9832742938');
  const [yamlUrl, setYamlUrl] = useState('https://raw.githubusercontent.com/ultralytics/ultralytics/main/ultralytics/cfg/datasets/coco8.yaml');
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.01);
  
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const payload = {
      dataset_yaml_url: yamlUrl,
      epochs: parseInt(epochs),
      batch_size: parseInt(batchSize),
      learning_rate: parseFloat(learningRate),
    };

    try {
      const response = await triggerTraining(payload, token);
      setStatus('success');
      console.log('Training started successfully:', response);
    } catch (err) {
      console.error(err);
      setStatus('error');
      
      if (err.response) {
        if (err.response.status === 403) {
          setErrorMsg('403 Forbidden: Invalid Developer Token.');
        } else if (err.response.status === 409) {
          setErrorMsg('409 Conflict: System is already actively training a model.');
        } else {
          setErrorMsg(err.response.data?.detail || 'Failed to start training pipeline.');
        }
      } else {
        setErrorMsg('Network error. Make sure your Python FastAPI server is running on port 8001.');
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300">
      
      {/* Absolute Decorative Glows */}
      <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4 mb-6">
        <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
          <Settings className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Developer MLOps training center
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure custom datasets and spin up the backend YOLOv26 training engine.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-500" />
              Developer access token (X-Developer-Token)
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                placeholder="Enter dev_secret..."
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400 hover:text-brand-500 transition-colors"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Dataset configuration URL (.yaml)
            </label>
            <input
              type="url"
              value={yamlUrl}
              onChange={(e) => setYamlUrl(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="https://example.com/dataset.yaml"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports Roboflow universe links or remote YAML setups containing image paths.
            </p>
          </div>
        </div>

        {/* Right Side Hyperparameters */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Training epochs: <span className="font-bold text-brand-500">{epochs}</span>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                className="w-full accent-brand-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer transition-all"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>1 (Fast)</span>
                <span>100 (Max Accuracy)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Batch size (YOLO)
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value={4}>4 (Low Memory)</option>
                <option value={8}>8</option>
                <option value={16}>16 (Standard)</option>
                <option value={32}>32 (High Accuracy)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Learning rate override
            </label>
            <select
              value={learningRate}
              onChange={(e) => setLearningRate(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value={0.1}>0.1 (Aggressive)</option>
              <option value={0.01}>0.01 (Default)</option>
              <option value={0.001}>0.001 (Slow / Refined)</option>
              <option value={0.0001}>0.0001 (Min Adjustments)</option>
            </select>
          </div>
        </div>

        {/* Form Submission Action & Alerts */}
        <div className="md:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500 dark:text-amber-400 animate-pulse">
                <Loader className="w-4 h-4 animate-spin" />
                Validating security credentials & spinning up background thread...
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                Training successfully initialized! Watch the Python console logs for dynamic charts output.
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/30">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 shadow-md shadow-brand-500/25 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            {status === 'loading' ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Trigger YOLO26 high-accuracy training
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TrainingCenter;
