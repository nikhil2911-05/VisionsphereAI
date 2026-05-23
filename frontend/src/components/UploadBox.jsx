import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

const UploadBox = ({ onImageUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out
        ${isDragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        <div className="p-4 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/40 transition-colors">
          {isDragActive ? (
            <UploadCloud className="w-10 h-10 text-brand-500 animate-bounce" />
          ) : (
            <ImageIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors" />
          )}
        </div>
        
        {isDragReject ? (
          <p className="text-sm text-red-500 font-medium">Please upload an image file (JPEG, PNG, WEBP).</p>
        ) : (
          <>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG or WEBP (Max. 5MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadBox;
