import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { TextRegion, inpaintRegion } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface Props {
    file: File;
    initialRegions: TextRegion[];
    onRegionsChange?: (regions: TextRegion[]) => void;
}

export const EditorCanvas: React.FC<Props> = ({ file, initialRegions, onRegionsChange }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [image] = useImage(imageSrc);
    const [regions, setRegions] = useState<TextRegion[]>(initialRegions);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // New Text Input State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Create object URL for the file
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        setRegions(initialRegions);
    }, [initialRegions]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && image) {
                const containerWidth = containerRef.current.clientWidth;
                // Leave some padding
                const availableWidth = containerWidth - 40;
                const newScale = Math.min(1, availableWidth / image.width);
                setScale(newScale);
                setStageSize({
                    width: image.width * newScale,
                    height: image.height * newScale
                });
            }
        };

        if (image) {
            handleResize();
            window.addEventListener('resize', handleResize);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [image]);

    // Handle Text Change (Inpainting + Update)
    const handleTextCommit = async () => {
        if (!editingId || !file) return;

        const regionIndex = regions.findIndex(r => r.id === editingId);
        if (regionIndex === -1) return;
        const region = regions[regionIndex];

        // If text hasn't changed, just close
        if (region.text === inputText) {
            setEditingId(null);
            return;
        }

        // 3. Update the text locally FIRST for instant feedback
        // We do this optimistically
        const newRegions = [...regions];
        newRegions[regionIndex] = { ...region, text: inputText };
        setRegions(newRegions);
        onRegionsChange?.(newRegions);

        // If we are masking the background, WE DO NOT NEED TO INPAINT!
        // The solid color rect will cover the old text. Inpainting just adds blur.
        if (region.maskBackground) {
            setEditingId(null);
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Inpaint the background only if NOT masking
            const newImageUrl = await inpaintRegion(file, region);
            setImageSrc(newImageUrl);

        } catch (error) {
            console.error("Inpainting failed:", error);
            // Don't alert, just keep the text change
        } finally {
            setIsProcessing(false);
            setEditingId(null);
        }
    };

    return (
        <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center gap-4 overflow-auto" ref={containerRef}>
            {/* Global Actions Toolbar */}
            <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                <button
                    onClick={() => {
                        const newRegions = regions.map(r => ({ ...r, maskBackground: true }));
                        setRegions(newRegions);
                        onRegionsChange?.(newRegions);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded hover:bg-slate-700 transition-colors"
                >
                    <span className="text-xs">⬛</span>
                    Mask All (Hide Originals)
                </button>
                <button
                    onClick={() => {
                        const newRegions = regions.map(r => ({ ...r, maskBackground: false }));
                        setRegions(newRegions);
                        onRegionsChange?.(newRegions);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm rounded hover:bg-slate-50 transition-colors"
                >
                    <span>⬜</span>
                    Unmask All
                </button>
            </div>

            <div className="relative shadow-2xl bg-white">
                {image && (
                    <Stage width={stageSize.width} height={stageSize.height} scaleX={scale} scaleY={scale}>
                        <Layer>
                            {/* Base Image */}
                            <KonvaImage image={image} />

                            {/* Regions */}
                            {regions.map((region) => {
                                const isSelected = selectedId === region.id;
                                const isEditing = editingId === region.id;

                                // If we are editing, we render a masking rect to hide the original text, then return null so Konva Text isn't drawn
                                if (isEditing) {
                                    return (
                                        <Rect
                                            key={region.id}
                                            x={region.box.x}
                                            y={region.box.y}
                                            width={region.box.width}
                                            height={region.box.height}
                                            fill={region.backgroundColor || 'white'}
                                        />
                                    );
                                }

                                return (
                                    <Group
                                        key={region.id}
                                        onClick={(e) => {
                                            e.cancelBubble = true;
                                            setSelectedId(region.id);
                                            setEditingId(region.id);
                                            setInputText(region.text);
                                        }}
                                        onMouseEnter={(e) => {
                                            const container = e.target.getStage()?.container();
                                            if (container) container.style.cursor = 'pointer';
                                        }}
                                        onMouseLeave={(e) => {
                                            const container = e.target.getStage()?.container();
                                            if (container) container.style.cursor = 'default';
                                        }}
                                    >
                                        {/* Highlight Box (Hover/Selection) */}
                                        <Rect
                                            x={region.box.x}
                                            y={region.box.y}
                                            width={region.box.width}
                                            height={region.box.height}
                                            fill={isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
                                            stroke={isSelected ? '#3b82f6' : 'rgba(0,0,0,0)'}
                                            strokeWidth={2}
                                        />

                                        {/* Optional Background Mask (Permanently hides original text behind) */}
                                        {region.maskBackground && (
                                            <Rect
                                                x={region.box.x}
                                                y={region.box.y}
                                                width={region.box.width}
                                                height={region.box.height}
                                                fill={region.backgroundColor || 'white'}
                                            />
                                        )}

                                        {/* Render Text (Simulating "Real" text) */}
                                        <Text
                                            x={region.box.x}
                                            y={region.box.y}
                                            width={region.box.width}
                                            height={region.box.height}
                                            text={region.text}
                                            fontSize={region.fontSize || 16}
                                            fontFamily={region.fontFamily || "Arial"}
                                            fontStyle={region.fontWeight || "normal"}
                                            letterSpacing={region.letterSpacing || 0}
                                            fill={region.color || 'black'}
                                        />
                                    </Group>
                                );
                            })}
                        </Layer>
                    </Stage>
                )}

                {/* Floating Format Toolbar for Active Edit */}
                {editingId && (() => {
                    const region = regions.find(r => r.id === editingId);
                    if (!region) return null;

                    // Position toolbar above the text box
                    const topPos = (region.box.y * scale) - 50;
                    const leftPos = (region.box.x * scale);

                    const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Roboto', 'Inter'];

                    return (
                        <>
                            {/* Toolbar */}
                            <div
                                className="absolute flex items-center gap-2 bg-slate-800 text-white p-2 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                                style={{
                                    top: Math.max(10, topPos),
                                    left: Math.max(10, leftPos)
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <select
                                    className="bg-slate-700 border-none text-xs rounded px-2 py-1 outline-none cursor-pointer hover:bg-slate-600 transition-colors"
                                    value={region.fontFamily || 'Arial'}
                                    onChange={(e) => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].fontFamily = e.target.value;
                                        setRegions(newRegions);
                                    }}
                                >
                                    {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>

                                <button
                                    className={`p-1 rounded hover:bg-slate-600 transition-colors ${region.fontWeight === 'bold' ? 'bg-slate-600' : ''}`}
                                    onClick={() => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].fontWeight = region.fontWeight === 'bold' ? 'normal' : 'bold';
                                        setRegions(newRegions);
                                    }}
                                    title="Bold"
                                >
                                    <span className="font-bold text-xs">B</span>
                                </button>

                                <button
                                    className={`p-1 rounded hover:bg-slate-600 transition-colors ${region.maskBackground ? 'bg-blue-600' : ''}`}
                                    onClick={() => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].maskBackground = !region.maskBackground;
                                        setRegions(newRegions);
                                    }}
                                    title="Mask Original Text"
                                >
                                    <span className="text-xs">⬛</span>
                                </button>

                                <input
                                    type="color"
                                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                    value={region.color || '#000000'}
                                    onChange={(e) => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].color = e.target.value;
                                        setRegions(newRegions);
                                    }}
                                />

                                <div className="w-px h-4 bg-slate-600 mx-1"></div>

                                {/* Font Size */}
                                <input
                                    type="number"
                                    className="w-12 bg-slate-700 border-none text-xs rounded px-2 py-1 outline-none text-center"
                                    value={region.fontSize || 16}
                                    onChange={(e) => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].fontSize = Number(e.target.value);
                                        setRegions(newRegions);
                                    }}
                                />
                                <span className="text-xs text-slate-400">px</span>

                                <div className="w-px h-4 bg-slate-600 mx-1"></div>

                                {/* Letter Spacing */}
                                <span className="text-xs text-slate-400">↔</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    className="w-12 bg-slate-700 border-none text-xs rounded px-2 py-1 outline-none text-center"
                                    value={region.letterSpacing || 0}
                                    onChange={(e) => {
                                        const newRegions = [...regions];
                                        const idx = newRegions.findIndex(r => r.id === editingId);
                                        if (idx !== -1) newRegions[idx].letterSpacing = Number(e.target.value);
                                        setRegions(newRegions);
                                    }}
                                />
                            </div>

                            {/* The Text Input */}
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onBlur={handleTextCommit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleTextCommit();
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    left: region.box.x * scale,
                                    top: region.box.y * scale,
                                    width: region.box.width * scale,
                                    height: region.box.height * scale,
                                    fontSize: `${(region.fontSize || 16) * scale}px`,
                                    lineHeight: `${region.box.height * scale}px`,
                                    color: region.color || 'black',
                                    background: 'transparent',
                                    border: 'none',
                                    resize: 'none',
                                    padding: 0,
                                    margin: 0,
                                    fontFamily: region.fontFamily || 'Arial, sans-serif',
                                    fontWeight: region.fontWeight || 'normal',
                                    letterSpacing: `${(region.letterSpacing || 0) * scale}px`,
                                    outline: 'none',
                                    overflow: 'hidden',
                                    whiteSpace: 'pre'
                                }}
                                autoFocus
                            />
                        </>
                    );
                })()}

                {/* Loading State */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <span className="ml-3 font-semibold text-slate-700">AI Magic working...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
