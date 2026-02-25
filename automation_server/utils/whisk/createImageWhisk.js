import axios from 'axios';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootProject = path.resolve(__dirname, '../../')
const hasilFolder = path.join(rootProject, 'Hasil')

dotenv.config({ path: path.join(rootProject, '.env') });

const endpoint = 'https://aisandbox-pa.googleapis.com/v1/whisk:generateImage';

// Parse tokens dari env (bisa multiple tokens dipisah koma)
const tokens = (process.env.BEARER_TOKEN || '').split(',').map(t => t.trim()).filter(Boolean);

if (tokens.length === 0) {
  console.log(`Gak ada Token Whisk di env`)
}


console.log(`✅ Loaded ${tokens.length} bearer token(s)`);

function getRandomSeed() {
  return Math.floor(Math.random() * 1000000);
}

async function createFolder() {
  try {
    if(!existsSync(hasilFolder)) {
      await fs.mkdir(hasilFolder, { recursive: true})
      console.log(`Folder dibuat:  ${hasilFolder}`)
    } else {
      console.log(`Sudah ada folder: ${hasilFolder}`)
    }
  } catch (err) {
    console.error('Gagal membuat Folder: ', err)
  }
}

function getSessionId() {
  return `;${Date.now()}`;
}

function getRandomToken() {
  return tokens[Math.floor(Math.random() * tokens.length)];
}

async function createImageWhisk(promptText) {
    const payload = {
    clientContext: {
      workflowId: uuidv4(),
      tool: "BACKBONE",
      sessionId: getSessionId()
    },
    imageModelSettings: {
      imageModel: "IMAGEN_3_5",
      aspectRatio: "IMAGE_ASPECT_RATIO_LANDSCAPE"
    },
    seed: getRandomSeed(),
    prompt: promptText,
    mediaCategory: "MEDIA_CATEGORY_BOARD"
  };

  const token = getRandomToken();

  try {
    const response = await axios.post(endpoint, 
        JSON.stringify(payload),
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain;charset=UTF-8',
                'Origin': 'https://labs.google',
                'Referer': 'https://labs.google/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000 //15 detik timeout
        }
    );

    console.log('Response:', response.data);

    const encodedImage = response.data?.imagePanels?.[0]?.generatedImages?.[0]?.encodedImage;

    if(encodedImage) {
        const cleanBase64 = encodedImage.replace(/^data:image\/\w+;base64,/, '');
        const timestamp = Date.now();
        const safePrompt = promptText.slice(0, 30).replace(/[^a-z0-9]/gi, '_');
        await createFolder();
        const fileName = `Hasil/Testing${timestamp}_${safePrompt}.jpg`;

        await fs.writeFile(fileName, cleanBase64, 'base64');

        console.log(`Gambar disimpan di ${fileName}`);
        console.log(` Lokasi: ${path.resolve(fileName)}`);
        console.log(` Seed: ${response.data?.imagePanels?.[0]?.generatedImages?.[0]?.seed}`);
        
        return {
          success: true,
          fileName,
          prompt: promptText
        };
    }

  } catch(err) {
    console.error('Gagal: ', err.response?.status);
    console.error('Gagal: ', err.response?.data);
    throw err;
  }
}

async function createImageWhiskWithRetry(promptText, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await createImageWhisk(promptText);
    } catch (err) {
      if ((err.response?.status === 503 || err.code === 'ECONNABORTED') && attempt < retries) {
        console.log(`[Retry ${attempt}] Server unavailable, retrying...`);
        await new Promise(r => setTimeout(r, 2000)); // delay 2 detik sebelum retry
      } else {
        throw err;
      }
    }
  }
}
// Batch processing worker
export async function createImageWhiskBatch(prompts, numWorkers = 1) {
  const limit = pLimit(numWorkers);
  
  console.log(`\n🚀 Starting batch processing with ${numWorkers} workers for ${prompts.length} prompts\n`);

  const workerIds = Array.from({ length: numWorkers }, (_, i) => i + 1);
  let currentWorker = 0;

  const tasks = prompts.map((prompt, index) => 
  limit(async () => {
    const workerId = workerIds[currentWorker % numWorkers];
    currentWorker++;

    try {
      console.log(`[Worker ${workerId}] Processing ${index + 1}/${prompts.length}...`);
      const result = await createImageWhiskWithRetry(prompt);
      return {
        ...result,
        index,
        workerId,
        status: 'success'
      };
    } catch(err) {
      console.error(`[Worker ${workerId}] Failed ${index + 1}: ${err.message}`);
      return {
        index,
        workerId,
        prompt,
        status: 'failed',
        error: err.message
      };
    }
  })
);
  
  const results = await Promise.all(tasks);
  
  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH PROCESSING REPORT');
  console.log('='.repeat(60));
  console.log(`Total prompts: ${prompts.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Workers used: ${numWorkers}`);
  console.log('='.repeat(60) + '\n');
  
  return results;
}

export default createImageWhisk;