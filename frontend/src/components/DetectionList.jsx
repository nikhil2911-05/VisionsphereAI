import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

const DetectionList = ({ detections, isProcessing }) => {
  // Sort detections by confidence (highest first)
  const sortedDetections = detections ? [...detections].sort((a, b) => b.confidence - a.confidence) : [];

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-48 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Analyzing image...</p>
      </div>
    );
  }

  if (!detections || detections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Upload an image to see detection results here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-500" />
          Detected Objects
        </h3>
        <span className="text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-1 rounded-full">
          {sortedDetections.length} found
        </span>
      </div>

      <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {sortedDetections.map((det, index) => {
          const confidencePercent = Math.round(det.confidence * 100);
          
          // Determine color based on confidence
          let colorClass = 'bg-brand-500';
          if (det.confidence < 0.6) colorClass = 'bg-red-500';
          else if (det.confidence < 0.8) colorClass = 'bg-amber-500';

          return (
            <div key={index} className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {det.label}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {confidencePercent}%
                </span>
              </div>
              
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                  style={{ width: `${confidencePercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetectionList;
