import { createWorker } from 'tesseract.js';

export interface TextRegion {
    id: string;
    text: string;
    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    confidence: number;

    // Style properties
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
}

// Helper to preprocess image (e.g. invert for dark mode)
const preprocessImage = (imageSource: string, invert: boolean): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(imageSource);
                return;
            }
            ctx.drawImage(img, 0, 0);

            if (invert) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];     // r
                    data[i + 1] = 255 - data[i + 1]; // g
                    data[i + 2] = 255 - data[i + 2]; // b
                }
                ctx.putImageData(imageData, 0, 0);
            }
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageSource;
    });
};

export const recognizeText = async (imageFile: string): Promise<TextRegion[]> => {
    const worker = await createWorker('eng', 1, {
        logger: m => console.log(m),
    });

    // 1. Try Normal
    let ret = await worker.recognize(imageFile);
    console.log('Tesseract Normal Raw:', ret);

    // 2. If no words found, try Inverted (Dark Mode support)
    if (!ret.data.words || ret.data.words.length === 0) {
        console.log("No text found. Retrying with inverted colors...");
        const invertedDataUrl = await preprocessImage(imageFile, true);
        ret = await worker.recognize(invertedDataUrl);
        console.log('Tesseract Inverted Raw:', ret);
    }

    // Map results to our TextRegion format
    const regions: TextRegion[] = (ret.data.words || []).map((word) => {
        return {
            id: Math.random().toString(36).substring(2, 15),
            text: word.text,
            box: {
                x: word.bbox.x0,
                y: word.bbox.y0,
                width: word.bbox.x1 - word.bbox.x0,
                height: word.bbox.y1 - word.bbox.y0,
            },
            confidence: word.confidence,
            fontSize: 16, // Default estimation
            color: '#000000', // Default
        };
    });

    await worker.terminate();
    return regions;
};
