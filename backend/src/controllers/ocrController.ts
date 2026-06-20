import { Request, Response } from 'express';
import Tesseract from 'tesseract.js';
import fs from 'fs';

// Mapping extracted text to emission values (mock database of factors)
const emissionFactors: Record<string, number> = {
    'beef': 13.0,
    'chicken': 3.5,
    'milk': 1.2,
    'cheese': 5.4,
    'rice': 1.5,
    'fuel': 2.3, // per liter approx
    'gas': 2.3
};

export const parseReceipt = async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imagePath = req.file.path;

        // Perform OCR
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng',
            { logger: m => console.log(m) }
        );

        // Clean up the uploaded file after processing
        fs.unlinkSync(imagePath);

        const lowerText = text.toLowerCase();
        let totalEmissions = 0;
        let detectedItems: string[] = [];

        // Basic keyword matching
        for (const [item, factor] of Object.entries(emissionFactors)) {
            if (lowerText.includes(item)) {
                totalEmissions += factor;
                detectedItems.push(item);
            }
        }

        res.json({
            success: true,
            extractedText: text,
            detectedItems,
            estimatedEmissionsKg: totalEmissions > 0 ? totalEmissions : 0.5 // default tiny footprint if nothing matches
        });
    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'Failed to process receipt' });
    }
};
