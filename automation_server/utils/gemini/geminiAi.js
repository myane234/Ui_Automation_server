// dotenv already loaded by electron/index.js
const apiKey = process.env.GEMINI_API;
const model = 'gemini-2.5-flash-lite';

const prompt = `
Analyze the provided image. Your task is to generate metadata for a new Vectors artwork inspired by the image.
The output MUST be a valid JSON object with: "prompt".

1.  **prompt**: A highly detailed and descriptive prompt for generating the new Vector. This prompt should be inspired by the subject and composition of the provided image, but reimagined in a vector style. The prompt must describe a vector/illustration, not a photo. It should cover the main subject, background elements, composition, color palette, lighting, and overall mood. Aim for a rich, multi-sentence description. Example: "A detailed flat vector illustration of a joyful golden retriever puppy sitting on a lush green lawn. The puppy has a friendly expression, with its tongue slightly out. The background features a clear blue sky with a few fluffy white clouds. The style is clean and modern, with bold outlines and a vibrant color palette."

Example output for a photo of a real dog:
{
  "prompt": "A detailed flat vector illustration of a joyful golden retriever puppy sitting on a lush green lawn. The puppy has a friendly expression, with its tongue slightly out. The background features a clear blue sky with a few fluffy white clouds. The style is clean and modern, with bold outlines and a vibrant color palette.",
}

Do not include any other text, comments, or markdown formatting like \`\`\`json. The output must be ONLY the JSON object.
`


class Gemini {
    static async generateImage(image) {
        try {
        
        console.log("DEBUG: apiKey exists?", !!apiKey);
        console.log("DEBUG: image length:", image.length);
        console.log("DEBUG: model:", model);

        const payload = {
            contents: [
                {
                    "parts": [
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: image
                            }
                        },
                        { "text": prompt}
                    ]
                }
            ]
        };

        console.log("DEBUG: payload keys:", Object.keys(payload.contents[0].parts[0]));
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const errText = await res.text();
            console.log("DEBUG: API error response:", errText);
            throw new Error(`API error: ${res.status} ${res.statusText} - ${errText}`);
        }

        const data = await res.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid response format from Gemini API');
        }
        
        const imageData = data.candidates[0].content.parts[0].text;
        console.log(`API ${process.env.GEMINI_API} responded with:`, imageData);
        return imageData;
    } catch(err) {
        console.error('Error generating image:', err);
        throw err;
    }
    }
}

export default Gemini;