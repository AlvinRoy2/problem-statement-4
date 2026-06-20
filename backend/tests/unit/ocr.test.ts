import { parseReceipt } from '../../src/controllers/ocrController';
import Tesseract from 'tesseract.js';
import fs from 'fs';

jest.mock('tesseract.js', () => ({
    recognize: jest.fn()
}));

jest.mock('fs', () => ({
    unlinkSync: jest.fn()
}));

describe('OCR Controller', () => {
    let req: any, res: any;

    beforeEach(() => {
        req = { file: { path: 'uploads/test.jpg' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('should extract text and calculate emissions based on keywords', async () => {
        (Tesseract.recognize as jest.Mock).mockResolvedValue({
            data: { text: 'I bought some beef and milk today.' }
        });

        await parseReceipt(req, res);

        expect(Tesseract.recognize).toHaveBeenCalledWith('uploads/test.jpg', 'eng', expect.any(Object));
        expect(fs.unlinkSync).toHaveBeenCalledWith('uploads/test.jpg');
        
        // 'beef' = 13.0, 'milk' = 1.2 -> Total = 14.2
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            extractedText: 'I bought some beef and milk today.',
            detectedItems: ['beef', 'milk'],
            estimatedEmissionsKg: 14.2
        });
    });

    test('should apply default emission if no keywords match', async () => {
        (Tesseract.recognize as jest.Mock).mockResolvedValue({
            data: { text: 'I bought a pen.' }
        });

        await parseReceipt(req, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            extractedText: 'I bought a pen.',
            detectedItems: [],
            estimatedEmissionsKg: 0.5 // Default fallback
        });
    });

    test('should return 400 if no file is provided', async () => {
        req.file = undefined;
        await parseReceipt(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No image file uploaded' });
    });
});
