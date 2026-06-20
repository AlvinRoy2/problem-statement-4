import Groq from "groq-sdk";
import NodeCache from "node-cache";
import { db } from "../db/database";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

export async function getInsights(req: any, res: any) {
    try {
        const userId = 1; // Fallback or extract from auth token if required later

        // Check cache first
        const cachedInsight = cache.get(`insight_${userId}`);
        if (cachedInsight) return res.json({ insight: cachedInsight });

        // Fetch recent activities
        db.all('SELECT category, SUM(amount) as total FROM activities WHERE user_id = ? GROUP BY category ORDER BY total DESC LIMIT 3', [userId], async (err, rows: any) => {
            let contextMsg = "The user has no logged activities yet.";
            if (rows && rows.length > 0) {
                const highest = rows[0];
                contextMsg = `The user's highest emission category is ${highest.category}. Provide 3 highly specific, localized tips to reduce emissions in this category.`;
            }

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an eco-friendly AI assistant. ${contextMsg} Keep it under 3 sentences and very encouraging.`,
                    },
                ],
                model: "llama-3.1-8b-instant", // Fixed model
                temperature: 0.5,
                max_completion_tokens: 150,
            });

            const insight = chatCompletion.choices[0]?.message?.content || "Keep up the good work!";
            cache.set(`insight_${userId}`, insight);
            res.json({ insight });
        });
    } catch (error) {
        console.error("Groq AI Error:", error);
        res.status(500).json({ error: "Failed to generate AI insights" });
    }
}
