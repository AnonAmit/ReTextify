import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'ReTextify Server is running' });
});

// Mock Translation Endpoint
app.post('/api/translate', (req: Request, res: Response) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing text or targetLanguage' });
    }

    // TODO: Integrate Gemini API here
    console.log(`Translating "${text}" to ${targetLanguage}`);

    // Mock response for now
    const translatedText = `[${targetLanguage}] ${text}`;

    res.json({ translatedText });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
