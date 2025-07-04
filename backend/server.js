const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.post('/generate-plan', async (req, res) => {
    const { goal } = req.body;

    const prompt = `
        You are a highly efficient task planner. A user has a goal and needs a step-by-step plan to achieve it.
        The user's goal is: "${goal}"
        Generate a clear, actionable, and concise step-by-step plan.
        For each step, provide a title and a short, simple description of what to do.
        Present the output as a JSON object with a single key "plan" which is an array of objects.
    `;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    plan: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING" },
                                description: { type: "STRING" }
                            },
                            required: ["title", "description"]
                        }
                    }
                },
                required: ["plan"]
            }
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("API error");

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        const json = JSON.parse(content);
        res.json(json);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate plan." });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
