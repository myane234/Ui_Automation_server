import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


//utils
import { askAwal } from './utils/CliAsk/tanya.js';
import { scrollAll, delay } from './utils/scrool.js';
import Gemini from './utils/gemini/geminiAi.js';
import { createImageWhiskBatch} from './utils/whisk/createImageWhisk.js';
import { stopTesting, testingMode } from './utils/CliAsk/TestingMode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderImage = path.join(__dirname, 'downloads');

//testing
const modeScrape = false; //Testing mode true
let testingPilihan = null;
let limitGemini = 5; // batasi proses Gemini

if(modeScrape) {
    testingPilihan = await testingMode();
}




async function Base64(imagePath) {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        return imageBuffer.toString('base64');
    } catch(err) {
        console.error('error converting file to base64:', err);
        throw err;
    }
}


async function getImage() {
    try {
        const files = await fs.promises.readdir(folderImage);

        if(files.length === 0) {
            throw new Error('Gak ada gambar di folderImage');
        }

        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        return imageFiles;
    } catch(err) {
        console.error('error getting image:', err);
        throw err;
    }
}


async function processImagesWithGemini() {
    try {
        const images = await getImage();
        if(images.length === 0) {
            throw new Error('Gak ada gambar di folder downloads');
        }

        console.log(`\n Memproses ${images.length} gambar dengan Gemini AI...\n`);

        const hasil = [];

        const imagesToProcess = modeScrape ? images.slice(0, limitGemini) : images;
        const totalImages = imagesToProcess.length;

        
        for (let i = 0; i < imagesToProcess.length; i++) { //generate Prompt
            try {
                const filename = imagesToProcess[i];
                const imagePath = path.join(folderImage, filename);
                
                console.log(`[${i + 1}/${totalImages}] Mengkonversi ${filename} ke base64...`);
                const base64Image = await Base64(imagePath);
                
                console.log(`[${i + 1}/${totalImages}] Mengirim ke Gemini AI...`);
                const geminiResult = await Gemini.generateImage(base64Image);
                
                hasil.push({
                    filename: filename,
                    geminiResult: geminiResult
                });
                
                console.log(` Berhasil proses: ${filename}\n`);
                
                await delay(1000); // Jeda antar request 
            } catch(err) {
                console.error(` Gagal proses ${imagesToProcess[i]}: ${err.message}\n`);
                hasil.push({
                    filename: imagesToProcess[i],
                    error: err.message
                });
            }
        }

        
        await fs.promises.writeFile(
            path.join(__dirname, 'hasil.json'), 
            JSON.stringify(hasil, null, 2)
        );
        
        console.log(' Semua hasil disimpan di hasil.json');
        return hasil;
    } catch(err) {
        console.error('error in processImagesWithGemini function:', err);
        throw err;
    }
}

// Fungsi untuk generate gambar dengan Whisk dari hasil Gemini
async function generateImagesFromGeminiResults(numWorkers) {
    try {
        console.log('\n Mulai generate gambar dengan Whisk berdasarkan hasil Gemini...\n');
        
        // Baca hasil.json
        const hasilData = await fs.promises.readFile(
            path.join(__dirname, 'hasil.json'),
            'utf-8'
        );
        const hasil = JSON.parse(hasilData);

        // Filter hasil yang gak ada error
        const validResults = hasil.filter(item => !item.error);
        
        if (validResults.length === 0) {
            console.log(' Tidak ada hasil valid untuk di-generate');
            return;
        }

        console.log(`Ditemukan ${validResults.length} hasil valid dari Gemini AI\n`);

        // Extract prompts
        const prompts = validResults.map(item => {
            let promptText = item.geminiResult;
            if (typeof promptText === 'string') {
                try {
                    const parsed = JSON.parse(promptText);
                    promptText = parsed.prompt;
                } catch(e) {
                    // gunakan langsung
                }
            }
            return promptText;
        });

        // Run batch processing
        await createImageWhiskBatch(prompts, numWorkers);

    } catch(err) {
        console.error('Error in generateImagesFromGeminiResults:', err);
        throw err;
    }
}



async function main(config) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
    let URL = config.URL
    let WhiskWorkers = config.WhiskWorkers
    let pageCustom = config.pageCustom

  try {
    await page.goto(URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    //Testing
    console.time('total waktu proses: ');

    
    console.log('Menunggu gambar dimuat...');
    for(let i=0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 4)
      })
    } 

    
    await delay(3000);

    console.log('Mulai scroll pelan-pelan...');

    const scrollResult = await scrollAll(page, pageCustom); //1 kali scroll fullPage
    
    console.log('Mencari gambar dengan berbagai cara...');
    

    
  

    

   

    // Testing hook: hentikan jika user memilih stop saat testing
        await stopTesting('1', testingPilihan)

        if (scrollResult.successCount > 0) {
            console.log(`\n Gambar berhasil disimpan di folder: downloads`);

            // Proses gambar dengan Gemini AI
            await processImagesWithGemini();

            // Generate gambar dengan Whisk
            await generateImagesFromGeminiResults(WhiskWorkers); // jumlah worker bisa disesuaikan, misal 3 untuk proses paralel
            await stopTesting('2', testingPilihan) // Testing hook: hentikan jika user memilih stop saat testing
        }

        
        

    console.timeEnd('total waktu proses: ');

    await delay(2000);

  } catch (error) {
    console.error('\n ERROR:', error.message);
    if (error.message.includes('timeout')) {
      console.log('Timeout terjadi. Coba:');
      console.log('1. Periksa koneksi internet');
      console.log('2. Naikkan timeout di waitForSelector');
      console.log('3. Coba keyword lain');
    }
  } finally {
    console.log('\n Menutup browser dalam 5 detik...');
    await delay(5000);
    await browser.close();
    console.log(' Browser ditutup.');
  }
};


export { main };