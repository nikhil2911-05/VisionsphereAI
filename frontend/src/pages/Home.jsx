import React, { useState } from 'react';
import { Sun, Moon, RotateCcw, AlertTriangle, Camera, Video, Cpu, LogOut } from 'lucide-react';
import UploadBox from '../components/UploadBox';
import CameraCapture from '../components/CameraCapture';
import ImageCanvas from '../components/ImageCanvas';
import DetectionList from '../components/DetectionList';
import History from '../components/History';
import LiveCameraCapture from '../components/LiveCameraCapture';
import TrainingCenter from '../components/TrainingCenter';
import { detectObjects } from '../services/api';

const Home = ({ toggleTheme, darkMode, user, onLogout }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [detections, setDetections] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showTrainingCenter, setShowTrainingCenter] = useState(false);

  const handleImageUpload = async (file, url) => {
    setImageFile(file);
    setImageUrl(url);
    setDetections(null);
    setError(null);
    setIsProcessing(true);

    try {
      const response = await detectObjects(file, user?.email);
      if (response.data.error) {
        setError(response.data.error);
        setDetections([]);
      } else {
        setDetections(response.data.objects);
      }
    } catch (err) {
      setError('Failed to process image. Please try again or check backend connection.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setDetections(null);
    setError(null);
    setIsCameraMode(false);
    setIsLiveMode(false);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-b-slate-200 dark:border-b-slate-800 bg-white/70 dark:bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              VisionDetect AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/30">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.username[0]}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {user.username}
                </span>
              </div>
            )}
            <button 
              onClick={() => setShowTrainingCenter(!showTrainingCenter)}
              className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold ${showTrainingCenter ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300'}`}
              aria-label="Toggle MLOps Training"
            >
              <Cpu className={`w-4 h-4 ${showTrainingCenter ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">MLOps Training</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button 
              onClick={onLogout}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {showTrainingCenter && (
          <div className="transition-all duration-300">
            <TrainingCenter />
          </div>
        )}
        {/* Main Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Upload / Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Image Analysis
                </h2>
                <div className="flex gap-3">
                  {!imageUrl && !isCameraMode && !isLiveMode && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsCameraMode(true)}
                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50 transition-colors shadow-sm"
                      >
                        <Camera className="w-4 h-4" />
                        Photo
                      </button>
                      <button 
                        onClick={() => setIsLiveMode(true)}
                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/30"
                      >
                        <Video className="w-4 h-4" />
                        Live Detect
                      </button>
                    </div>
                  )}
                  {imageUrl && (
                    <button 
                      onClick={handleReset}
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {!imageUrl && !isLiveMode ? (
                isCameraMode ? (
                  <CameraCapture 
                    onCapture={handleImageUpload} 
                    onCancel={() => setIsCameraMode(false)} 
                  />
                ) : (
                  <UploadBox onImageUpload={handleImageUpload} />
                )
              ) : isLiveMode ? (
                <LiveCameraCapture 
                  onCancel={() => setIsLiveMode(false)}
                  onDetectionsUpdate={(newDetections) => setDetections(newDetections)}
                />
              ) : (
                <ImageCanvas imageUrl={imageUrl} detections={detections} />
              )}
            </div>
          </div>

          {/* Right Column: Results Panel */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-2xl p-6 h-full">
              <DetectionList detections={detections} isProcessing={isProcessing} />
            </div>
          </div>

        </div>

        {/* History Section */}
        <div className="glass-panel rounded-2xl p-6">
          <History user={user} />
        </div>
      </main>
    </div>
  );
};

export default Home;
