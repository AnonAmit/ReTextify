'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFileContext } from '@/context/FileContext';

export default function Home() {
  const router = useRouter();
  const { setFile, setFileDataUrl } = useFileContext();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    // Validate type
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Please upload an image (JPG, PNG, WEBP) or PDF.');
      return;
    }

    setUploading(true);

    // Set in context
    setFile(file);

    // Read to URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileDataUrl(e.target.result as string);
        router.push('/editor');
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-50 to-white text-slate-800">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          ReTextify
        </h1>
        <p className="text-lg text-slate-600 text-center max-w-2xl">
          Upload an image or PDF to detect, edit, and translate text instantly using AI.
        </p>

        <div
          className={`
            w-full max-w-2xl h-64 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all
            ${isDragOver ? 'border-blue-500 bg-blue-50 opacity-90' : 'border-slate-300 bg-white/50 hover:border-blue-400'}
          `}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-blue-600 font-semibold">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Click or Drag & Drop to Upload</p>
              <p className="text-sm opacity-70">JPG, PNG, WEBP, PDF supported</p>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 mt-8">
          Powered by ReTextify AI
        </div>
      </div>
    </main>
  );
}
