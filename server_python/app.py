from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import uvicorn
import easyocr
import cv2
import numpy as np
import base64
import io
from PIL import Image

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR Reader (loads model into memory)
print("Loading EasyOCR Model...")
# verbose=False prevents the progress bar from crashing Windows terminals with UnicodeEncodeError
reader = easyocr.Reader(['en'], verbose=False)
print("EasyOCR Model Loaded.")

def read_image_file(file_bytes):
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.get("/")
def health_check():
    return {"status": "ok", "message": "PhoText Backend is running"}

# Helper to analyze text region for color and size
def analyze_text_region(img_crop):
    # Default values
    default_color = '#000000'
    h_crop, w_crop = img_crop.shape[:2]
    default_size = int(h_crop * 0.8)

    try:
        # 1. Reshape to lists of pixels
        pixels = img_crop.reshape(-1, 3)
        pixels = np.float32(pixels)

        # 2. K-Means to separate Text vs Background
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        k = 2
        flags = cv2.KMEANS_RANDOM_CENTERS
        compactness, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, flags)

        # 3. Identify Text Cluster
        count0 = np.sum(labels == 0)
        count1 = np.sum(labels == 1)
        
        # Heuristic: Text is usually thinner/smaller area than background in a bbox
        if count0 > count1:
            text_label = 1
            bg_label = 0
        else:
            text_label = 0
            bg_label = 1

        # 4. Get Colors
        # Text Color
        text_color_bgr = centers[text_label]
        b, g, r = int(text_color_bgr[0]), int(text_color_bgr[1]), int(text_color_bgr[2])
        text_hex = '#{:02x}{:02x}{:02x}'.format(r, g, b)

        # Background Color (for masking)
        bg_color_bgr = centers[bg_label]
        b_bg, g_bg, r_bg = int(bg_color_bgr[0]), int(bg_color_bgr[1]), int(bg_color_bgr[2])
        bg_hex = '#{:02x}{:02x}{:02x}'.format(r_bg, g_bg, b_bg)

        # 5. Get Precise Font Size (Height of text pixels)
        # Reshape labels back to image 2D
        labels_2d = labels.reshape(h_crop, w_crop)
        
        # Find indices where label is text_label
        rows, cols = np.where(labels_2d == text_label)
        
        if len(rows) > 0:
            min_y, max_y = np.min(rows), np.max(rows)
            pixel_height = max_y - min_y
            calculated_size = int(pixel_height * 1.1)
            
            if calculated_size > 4 and calculated_size <= h_crop * 1.2:
                default_size = calculated_size

        return text_hex, bg_hex, default_size

    except Exception as e:
        print(f"Analysis failed: {e}")
        return default_color, '#ffffff', default_size


@app.post("/detect")
async def detect_text(file: UploadFile = File(...)):
    contents = await file.read()
    img = read_image_file(contents)

    # EasyOCR detection
    results = reader.readtext(img)

    detected_regions = []
    for (bbox, text, prob) in results:
        (tl, tr, br, bl) = bbox
        x = int(min(tl[0], bl[0]))
        y = int(min(tl[1], tr[1]))
        w = int(max(tr[0], br[0]) - x)
        h = int(max(bl[1], br[1]) - y)
        
        # Clamp bounds
        h_img, w_img = img.shape[:2]
        x = max(0, x)
        y = max(0, y)
        w = min(w, w_img - x)
        h = min(h, h_img - y)

        color = '#000000'
        bg_color = '#ffffff'
        font_size = int(h * 0.8)

        if w > 0 and h > 0:
            roi = img[y:y+h, x:x+w]
            color, bg_color, font_size = analyze_text_region(roi)

        detected_regions.append({
            "id": str(len(detected_regions)), 
            "text": text,
            "box": {
                "x": x,
                "y": y,
                "width": w,
                "height": h
            },
            "confidence": float(prob),
            "fontSize": font_size,
            "color": color,
            "backgroundColor": bg_color
        })

    return {"regions": detected_regions}

@app.post("/inpaint")
async def inpaint_region(
    file: UploadFile = File(...), 
    x: int = Form(...),
    y: int = Form(...),
    w: int = Form(...),
    h: int = Form(...)
):
    contents = await file.read()
    img = read_image_file(contents)

    # Create mask for the region
    mask = np.zeros(img.shape[:2], np.uint8)
    # Grow the box slightly to ensure full coverage
    pad = 2
    cv2.rectangle(mask, (x - pad, y - pad), (x + w + pad, y + h + pad), 255, -1)

    # Inpaint
    # CV2_INPAINT_TELEA or CV2_INPAINT_NS
    dst = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)

    # Encode back to image
    _, buffer = cv2.imencode(".png", dst)
    return Response(content=buffer.tobytes(), media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
