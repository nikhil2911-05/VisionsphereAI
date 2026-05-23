import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Aperture } from 'lucide-react';

const CameraCapture = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera if available
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture image');
        return;
      }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);
      stopCamera();
      onCapture(file, imageUrl);
    }, 'image/jpeg', 0.9);
  }, [onCapture, stopCamera]);

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-2xl">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button 
            onClick={handleCancel}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[400px] bg-black rounded-2xl overflow-hidden group">
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover max-h-[70vh]"
      />
      
      {/* Overlay UI */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center items-center gap-6">
        <button
          onClick={handleCancel}
          className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all"
          title="Cancel"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleCapture}
          className="p-4 bg-brand-500 hover:bg-brand-400 rounded-full text-white shadow-xl shadow-brand-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-medium"
        >
          <Aperture className="w-7 h-7" />
          <span className="sr-only md:not-sr-only md:pr-2">Capture</span>
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
