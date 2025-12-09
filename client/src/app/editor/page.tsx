'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useFileContext } from '@/context/FileContext';
import { detectText, TextRegion } from '@/lib/api';
// Dynamic import for Konva to avoid SSR issues
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas').then(mod => mod.EditorCanvas), { ssr: false });
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';

export default function EditorPage() {
    const router = useRouter();
    const { file } = useFileContext();

    const [regions, setRegions] = useState<TextRegion[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!file) {
            router.push('/');
            return;
        }

        const runDetection = async () => {
            setIsScanning(true);
            try {
                const detected = await detectText(file);
                setRegions(detected);
            } catch (err) {
                console.error("Detection Failed", err);
                alert("Failed to detect text. Ensure backend is running.");
            } finally {
                setIsScanning(false);
            }
        };

        if (regions.length === 0) {
            runDetection();
        }
    }, [file, router]);

    const handleDownload = () => {
        // Implementation for download needs to change to grab canvas dataURL
        // For MVP, we can ask the user to right click -> save image or stick a button method in EditorCanvas
        alert("For MVP, please right click the image to save.");
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

                <div className="flex-1 p-6 space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <p className="font-semibold mb-1">PhoText Mode</p>
                        <p>1. Hover to see text regions.</p>
                        <p>2. Click a region to edit.</p>
                        <p>3. Type new text and press Enter.</p>
                        <p className="mt-2 text-xs opacity-75">The AI will magically erase the old text and paint yours!</p>
                    </div>

                    {isScanning && (
                        <div className="text-center text-slate-500 py-4 animate-pulse">
                            Scanning image...
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-200">
                {file && (
                    <EditorCanvas
                        file={file}
                        initialRegions={regions}
                        onRegionsChange={setRegions}
                    />
                )}
            </main>
        </div>
    );
}
