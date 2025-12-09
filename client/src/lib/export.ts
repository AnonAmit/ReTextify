import { TextRegion } from './ocr';

export const exportToImage = async (
    imageSrc: string,
    regions: TextRegion[],
    originalWidth: number,
    originalHeight: number
): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            resolve(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // 1. Draw original image
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight);

            // 2. Draw text regions on top
            regions.forEach((region) => {
                // Simple "remove text" simulation by drawing a background box if needed
                // For now, we assume we just draw the NEW text on top.
                // If we wanted to "remove" the old text, we'd need inpainting.
                // Here we just draw the content.

                // Setup font
                const fontSize = region.fontSize || 16;
                const fontFamily = region.fontFamily || 'Arial';
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillStyle = region.color || 'black';
                ctx.textBaseline = 'top';

                // Helper to fill background if we want to "overwrite"
                // ctx.clearRect(region.box.x, region.box.y, region.box.width, region.box.height);

                // Draw text
                // Note: Tesseract bbox might be tight, so we draw at x,y
                ctx.fillText(region.text, region.box.x, region.box.y);
            });

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        };
        img.src = imageSrc;
    });
};
