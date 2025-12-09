import React from 'react';
import { TextRegion } from '@/lib/ocr';

interface Props {
    region: TextRegion;
    scale: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export const TextOverlay: React.FC<Props> = ({ region, scale, isSelected, onSelect }) => {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect(region.id);
            }}
            style={{
                position: 'absolute',
                left: `${region.box.x * scale}px`,
                top: `${region.box.y * scale}px`,
                width: `${region.box.width * scale}px`,
                height: `${region.box.height * scale}px`,
                // Style
                fontSize: `${(region.fontSize || 16) * scale}px`,
                fontFamily: region.fontFamily || 'Arial',
                color: region.color || 'black',

                // Interaction
                border: isSelected ? '2px solid #3b82f6' : '1px dashed rgba(0,0,0,0.1)', // Subtle hint
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                cursor: 'pointer',

                // Layout
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'start', // Align text to top usually
                lineHeight: 1.2,
            }}
            className="hover:border-blue-400 transition-colors z-10"
            title="Click to edit"
        >
            {/* 
         In a real complex app, we might want to hide the original text by drawing a background.
         For this MVP, we just overlay the recognized text nicely.
      */}
            {region.text}
        </div>
    );
};
