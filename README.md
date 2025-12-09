# Textify (formerly ReTextify)

**Textify** is an advanced web application that allows you to **edit text within static images** as effortlessly as editing a Word document. 

It uses AI to detect text regions, matches the original font styles (color, size, spacing), and provides a seamless "in-place" editing experience.

![Demo](https://via.placeholder.com/800x400?text=Textify+Demo+Screenshot)

## ✨ Key Features

*   **📄 Drag & Drop Upload**: Simply drop any screenshot or image to start.
*   **👁️ smart OCR**: Powered by **EasyOCR** and **Python**, it automatically detects text blocks with high precision.
*   **🎨 Intelligent Style Matching**: Uses **K-Means Clustering** to analyze pixel colors and automatically set the text color and background mask.
*   **📏 Pixel-Perfect Alignment**:
    *   **Auto-Sizing**: Calculates exact font height based on pixel analysis.
    *   **Letter Spacing**: Fine-tune character spacing to match the original text width exactly.
*   **🎭 Smart Masking**:
    *   **Auto-Mask**: Automatically hides the original text behind your edits using the detected background color.
    *   **Mask All**: One-click global button to hide all original text for a clean slate.
*   **🛠️ Floating Toolbar**:
    *   Change Font Family (Arial, Verdana, Roboto, etc.)
    *   Toggle Bold
    *   Pick Custom Colors
    *   Adjust Font Size & Spacing
*   **🔒 Local Processing**: Powered by a local Python server for privacy and speed.

## 🏗️ Tech Stack

### Frontend (Client)
*   **Next.js 14** (App Router)
*   **React** & **TypeScript**
*   **Tailwind CSS** (Styling)
*   **Konva.js / React-Konva** (Canvas Rendering)
*   **Lucide React** (Icons)

### Backend (Server)
*   **Python 3.x**
*   **FastAPI** (High-performance API)
*   **EasyOCR** (Text Detection)
*   **OpenCV** (Image Processing & K-Means)
*   **NumPy** (Pixel Analysis)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)

### 1. Backend Setup (Python)
The backend handles OCR and intelligent image analysis.

```bash
# Navigate to the python server directory
cd server_python

# Install dependencies
pip install -r requirements.txt

# Start the server (Runs on port 5000)
python app.py
```

### 2. Frontend Setup (Next.js)
The frontend provides the interactive editor interface.

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 How to Use

1.  **Upload**: Drag an image onto the homepage.
2.  **Edit**: Click on any highlighted text box.
3.  **Refine**:
    *   Use the **Floating Toolbar** to change text.
    *   Click **Mask (⬛)** to hide the original text background.
    *   Use **Spacing (↔)** to stretch/shrink text to fit perfectly.
4.  **Global Actions**: Use the top bar to "Mask All" if you want to clear the board.

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.
