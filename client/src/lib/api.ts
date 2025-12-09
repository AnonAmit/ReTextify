export const API_BASE_URL = 'http://localhost:5000';

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
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontWeight?: string;
    maskBackground?: boolean;
    letterSpacing?: number;
}

export const detectText = async (file: File): Promise<TextRegion[]> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error('Detection failed');
    }

    const data = await res.json();
    return data.regions;
};

export const inpaintRegion = async (file: File, region: TextRegion): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('x', Math.round(region.box.x).toString());
    formData.append('y', Math.round(region.box.y).toString());
    formData.append('w', Math.round(region.box.width).toString());
    formData.append('h', Math.round(region.box.height).toString());

    const res = await fetch(`${API_BASE_URL}/inpaint`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error('Inpainting failed');
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
};
