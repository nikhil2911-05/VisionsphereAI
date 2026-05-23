import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, X, RefreshCw, StopCircle } from 'lucide-react';
import { detectObjects } from '../services/api';

const LiveCameraCapture = ({ onCancel, onDetectionsUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectingRef = useRef(false);
  const timeoutRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsDetecting(false);
    detectingRef.current = false;
  }, [stream]);

  const drawBoundingBoxes = (objects) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Make canvas match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach(obj => {
      const [x, y, width, height] = obj.box;
      
      // Draw Box
      ctx.strokeStyle = '#0ea5e9'; // brand-500
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Draw Label Background
      ctx.fillStyle = '#0ea5e9';
      const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
      ctx.font = '16px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 24, textWidth + 10, 24);
      
      // Draw Label Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 5, y - 6);
    });
  };

  const processFrame = async () => {
    if (!detectingRef.current || !videoRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0) {
      timeoutRef.current = setTimeout(processFrame, 500);
      return;
    }

    // Capture frame to an offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = video.videoWidth;
    offscreenCanvas.height = video.videoHeight;
    const ctx = offscreenCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    offscreenCanvas.toBlob(async (blob) => {
      if (!blob || !detectingRef.current) return;
      
      const file = new File([blob], `live-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      try {
        const response = await detectObjects(file);
        if (detectingRef.current) {
          const objects = response.data.objects;
          onDetectionsUpdate(objects);
          drawBoundingBoxes(objects);
        }
      } catch (err) {
        console.error("Live detection error", err);
      }
      
      // Poll again after ~1000ms delay to prevent backend overload
      if (detectingRef.current) {
        timeoutRef.current = setTimeout(processFrame, 1000);
      }
    }, 'image/jpeg', 0.8);
  };

  const toggleDetection = () => {
    const newState = !isDetecting;
    setIsDetecting(newState);
    detectingRef.current = newState;
    
    if (newState) {
      processFrame();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Clear canvas
      if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
      }
      onDetectionsUpdate(null);
    }
  };

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
      
      {/* Overlay Canvas for Bounding Boxes */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
          onClick={toggleDetection}
          className={`p-4 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-medium
            ${isDetecting ? 'bg-red-500 hover:bg-red-400 shadow-red-500/50 animate-pulse' : 'bg-brand-500 hover:bg-brand-400 shadow-brand-500/50'}
          `}
        >
          {isDetecting ? <StopCircle className="w-7 h-7" /> : <Video className="w-7 h-7" />}
          <span className="pr-2">{isDetecting ? 'Stop Live' : 'Start Live'}</span>
        </button>
      </div>
    </div>
  );
};

export default LiveCameraCapture;
