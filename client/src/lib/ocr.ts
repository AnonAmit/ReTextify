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

export const recognizeText = async (imageFile: File | string): Promise<TextRegion[]> => {
    const worker = await createWorker('eng');

    // Recognize text
    const ret = await worker.recognize(imageFile);

    // Map results to our TextRegion format
    const regions: TextRegion[] = ret.data.words.map((word) => {
        return {
            id: crypto.randomUUID(),
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
