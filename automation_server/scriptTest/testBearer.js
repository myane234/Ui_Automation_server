import { createImageWhiskBatch } from '../utils/whisk/createImageWhisk.js';

async function test(numWorkers = 1) {
  try {
    console.log(`Testing bearer`)

    const hasilData = 
      [
        {
          "filename": "gambar_1.jpg",
          "geminiResult": "{\n  \"prompt\": \"A collection of diverse vector speech bubbles and thought bubbles rendered in a clean, minimalist style. The collection showcases a variety of shapes, including rounded rectangles, circles, ovals, cloud-like forms, and one with a serrated edge, all outlined with thick, consistent black lines on a stark white background. A few cloud-shaped bubbles feature small circles emanating from them, indicating thought processes. The composition is a grid-like arrangement, presenting a comprehensive set of visual communication elements. The lighting is even and flat, emphasizing the graphic nature of the icons. The overall mood is neutral, functional, and modern, suitable for UI design, comics, or informational graphics.\"\n}"
        },
        {
          "filename": "gambar_10.jpg",
          "geminiResult": "{\n  \"prompt\": \"A collection of stylized vector speech bubbles, each containing a single word like \\\"HI,\\\" \\\"HELLO,\\\" \\\"WELCOME,\\\" \\\"BYE!,\\\" \\\"YES,\\\" and \\\"NO.\\\" The speech bubbles are primarily a bright, energetic yellow with thick black outlines and subtle, hatched shading on their sides to create a sense of depth. The text within each bubble is bold, black, and has a slightly distressed or textured appearance, mimicking a stamped effect. The composition features the bubbles arranged dynamically across a clean white background, with various shapes including rounded rectangles and a circle. The overall style is graphic, modern, and communicative, conveying simple, direct messages with a playful yet clear aesthetic. The lighting is even and bright, casting minimal shadows due to the flat vector nature of the artwork.\"\n}"
        }
    ]
    const hasil = hasilData

    const validResults = hasil.filter(item => !item.error);
    if (validResults.length === 0) {
      console.log(' Tidak ada hasil valid untuk di-generate');
      return;
    }

    console.log(`Di temukan ${validResults.length}`)

    const prompts = validResults.map(item => {
            let promptText = item.geminiResult;
            if (typeof promptText === 'string') {
                try {
                    const parsed = JSON.parse(promptText);
                    promptText = parsed.prompt;
                } catch(e) {
                }
            }
            return promptText;
        });

    await createImageWhiskBatch(prompts, numWorkers)
  } catch(err) {
    console.error(`Bermasalah ${err}`)
  }
}

test(2);