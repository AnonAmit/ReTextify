'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFileContext } from '@/context/FileContext';
import { recognizeText, TextRegion } from '@/lib/ocr';
import { TextOverlay } from '@/components/TextOverlay';
import { exportToImage } from '@/lib/export';
import { ArrowLeft, Download, RotateCcw, Type, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function EditorPage() {
    const router = useRouter();
    const { file, fileDataUrl } = useFileContext();

    const [regions, setRegions] = useState<TextRegion[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scale, setScale] = useState(1);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!file || !fileDataUrl) {
            router.push('/');
            return;
        }

        // Run OCR
        const runOCR = async () => {
            setIsProcessing(true);
            try {
                const detected = await recognizeText(fileDataUrl); // Tesseract supports data URL
                setRegions(detected);
            } catch (err) {
                console.error("OCR Failed", err);
                alert("Failed to recognize text.");
            } finally {
                setIsProcessing(false);
            }
        };

        // Only run if regions are empty (first load)
        if (regions.length === 0) {
            runOCR();
        }
    }, [file, fileDataUrl, router, regions.length]);

    // Handle Resize / Scale
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && imageSize.width > 0) {
                const containerWidth = containerRef.current.clientWidth;
                // Fit image to container
                const newScale = Math.min(1, containerWidth / imageSize.width);
                setScale(newScale);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [imageSize]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImageSize({ width: naturalWidth, height: naturalHeight });
        // Trigger resize calc
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            setScale(Math.min(1, containerWidth / naturalWidth));
        }
    };

    const updateRegion = (id: string, updates: Partial<TextRegion>) => {
        setRegions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const selectedRegion = regions.find(r => r.id === selectedId);

    const handleDownload = async () => {
        if (!fileDataUrl) return;
        const blob = await exportToImage(fileDataUrl, regions, imageSize.width, imageSize.height);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retextified-${file?.name || 'image.png'}`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleAddText = () => {
        // Add to center of view or image
        const newRegion: TextRegion = {
            id: crypto.randomUUID(),
            text: "New Text",
            box: {
                x: imageSize.width / 2 - 100,
                y: imageSize.height / 2 - 20,
                width: 200,
                height: 40
            },
            confidence: 100,
            fontSize: 24,
            color: '#000000'
        };
        setRegions([...regions, newRegion]);
        setSelectedId(newRegion.id);
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg z-20">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-bold text-slate-800">Editor</h2>
                    <div className="w-8"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Selected Region Editor */}
                    {selectedRegion ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Edit Text</h3>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Content</label>
                                <textarea
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    value={selectedRegion.text}
                                    onChange={(e) => updateRegion(selectedRegion.id, { text: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">Font Size (px)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-300 rounded-md"
                                        value={Math.round(selectedRegion.fontSize || 16)}
                                        onChange={(e) => updateRegion(selectedRegion.id, { fontSize: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-10 w-full border border-slate-300 rounded-md cursor-pointer"
                                            value={selectedRegion.color || '#000000'}
                                            onChange={(e) => updateRegion(selectedRegion.id, { color: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Position Manual Adjust */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-xs font-semibold text-slate-600">Position (X, Y)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        className="p-2 border border-slate-300 rounded-md text-sm"
                                        value={Math.round(selectedRegion.box.x)}
                                        onChange={(e) => updateRegion(selectedRegion.id, { box: { ...selectedRegion.box, x: Number(e.target.value) } })}
                                    />
                                    <input
                                        type="number"
                                        className="p-2 border border-slate-300 rounded-md text-sm"
                                        value={Math.round(selectedRegion.box.y)}
                                        onChange={(e) => updateRegion(selectedRegion.id, { box: { ...selectedRegion.box, y: Number(e.target.value) } })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setRegions(regions.filter(r => r.id !== selectedId));
                                    setSelectedId(null);
                                }}
                                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                            >
                                Delete Region
                            </button>

                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-10">
                            <p>Select a text region to edit</p>
                        </div>
                    )}

                    <hr className="border-slate-100" />

                    {/* Translate Section (Mock) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">AI Tools</h3>
                        <button
                            className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 flex items-center justify-center gap-2 font-medium"
                            // Mock Translate
                            onClick={() => {
                                if (selectedRegion) {
                                    // Call API mock
                                    updateRegion(selectedRegion.id, { text: `[TR] ${selectedRegion.text}` });
                                } else {
                                    alert("Select a region to translate");
                                }
                            }}
                        >
                            Translate Selected
                        </button>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={handleDownload}
                        className="w-full py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-slate-900/20"
                    >
                        <Download size={18} /> Download Result
                    </button>
                </div>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Toolbar */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 justify-between z-10">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddText}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-md text-slate-700 font-medium transition-colors"
                        >
                            <Type size={18} /> Add Text
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-2"></div>
                        <button
                            onClick={() => setRegions([])} // Rough 'reset'
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-md text-slate-700 font-medium transition-colors"
                        >
                            <RotateCcw size={18} /> Reset
                        </button>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                        {imageSize.width} x {imageSize.height} px ({Math.round(scale * 100)}%)
                    </div>
                </div>

                {/* Scrollable Canvas Container */}
                <div
                    className="flex-1 overflow-auto bg-slate-100 p-8 flex items-start justify-center"
                    onClick={() => setSelectedId(null)}
                >
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl bg-white"
                        style={{
                            width: imageSize.width * scale,
                            height: imageSize.height * scale,
                            transition: 'width 0.2s, height 0.2s'
                        }}
                    >
                        {/* Base Image */}
                        {fileDataUrl && (
                            <img
                                ref={imageRef}
                                src={fileDataUrl}
                                alt="Upload"
                                onLoad={handleImageLoad}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                            />
                        )}

                        {/* Overlays */}
                        {regions.map((region) => (
                            <TextOverlay
                                key={region.id}
                                region={region}
                                scale={scale}
                                isSelected={selectedId === region.id}
                                onSelect={setSelectedId}
                            />
                        ))}

                        {/* Loading Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center text-slate-800 z-50">
                                <Loader2 className="animate-spin mb-4" size={48} />
                                <p className="font-semibold text-lg">Scanning text...</p>
                                <p className="text-sm opacity-75">This includes OCR processing</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
