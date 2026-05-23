import React, { useRef, useEffect, useState } from 'react';

const ImageCanvas = ({ imageUrl, detections }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });

  // Handle image load
  const handleImageLoad = (e) => {
    setImgDims({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
  };

  useEffect(() => {
    const drawBoxes = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const imgElement = imageRef.current;

      if (!canvas || !ctx || !imgElement || imgDims.width === 0) return;

      // Make canvas size match the rendered image size
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) return;

      // Calculate scale factors
      const scaleX = canvas.width / imgDims.width;
      const scaleY = canvas.height / imgDims.height;

      detections.forEach((det, i) => {
        const [x, y, w, h] = det.box;
        
        // Scale coordinates to rendered image size
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;

        // Distinct colors for different boxes (hsl strategy)
        const hue = (i * 137.5) % 360; 
        const color = `hsl(${hue}, 80%, 50%)`;

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(scaledX, scaledY, scaledW, scaledH, 4);
        ctx.stroke();

        // Draw label background
        ctx.fillStyle = color;
        ctx.font = '600 14px Inter, sans-serif';
        const label = `${det.label} (${(det.confidence * 100).toFixed(1)}%)`;
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 14;

        // Ensure label doesn't go off top screen
        let labelY = scaledY > 25 ? scaledY - 20 : scaledY + 5;
        
        ctx.beginPath();
        ctx.roundRect(scaledX, labelY, textWidth + 12, textHeight + 10, 4);
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, scaledX + 6, labelY + textHeight + 2);
      });
    };

    // Draw initially and on resize
    drawBoxes();
    
    // Add resize listener to redraw boxes when window resizes
    window.addEventListener('resize', drawBoxes);
    return () => window.removeEventListener('resize', drawBoxes);
  }, [detections, imgDims, imageUrl]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center min-h-[400px]">
      {imageUrl ? (
        <div ref={containerRef} className="relative max-w-full max-h-full inline-block">
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Uploaded for detection" 
            className="block max-w-full h-auto max-h-[70vh] object-contain rounded-lg"
            onLoad={handleImageLoad}
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>
      ) : (
        <div className="text-slate-400 dark:text-slate-500">
          No image uploaded
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;
