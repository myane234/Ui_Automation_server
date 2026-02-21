import fs from "fs";
import path from "path";

import { imageSearch } from "./carigambar.js";
import { download } from "./downloader.js";

 // Buat folder berdasarkan keyword dan timestamp
const folderName = `downloads/`;

if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
}



// async function scrollUntilNextVisible(page) {
//     for (let i = 0; i < 30; i++) {
//         const exists = await page.$(nextBtnSelector);

//         if (exists) {
//             console.log("Next button found");
//             return true;
//         }

//         await page.evaluate(() => {
//             window.scrollBy(0, window.innerHeight / 2);
//         });

//         await delay(500);
//     }

//     return false;
// }

// Scroll untuk load semua lazy load images
// async function autoScrollToBottom(page) {
//     let previousHeight;
//     let scrollCount = 0;

//     while (true) {
//         console.log(`Scroll ke bawah... (${scrollCount})`);
//         previousHeight = await page.evaluate(() => document.body.scrollHeight);

//         await page.evaluate(() => {
//             window.scrollBy(0, window.innerHeight / 2);
//         });

//         await delay(300); // Jeda pendek

//         const newHeight = await page.evaluate(() => document.body.scrollHeight);
//         scrollCount++;

//         if (newHeight === previousHeight) {
//             console.log(` Selesai scroll setelah ${scrollCount} kali`);
//             break;
//         }
//     }
// }

async function checkValidUrls(page) {
    const imageUrls = await imageSearch(page);

    console.log(`Ditemukan ${imageUrls.length} gambar dengan cara 1`);

     // Filter URL VALID
        const validUrls = imageUrls.filter(url => {
          // Pastikan URL gambar
          const isImage = url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg');
          const isNotIcon = !url.includes('icon') && !url.includes('logo') && !url.includes('spacer');
          const isNotAd = !url.includes('ad') && !url.includes('ads') && !url.includes('promo');
          
          return isImage && isNotIcon && isNotAd && url.startsWith('http');
        });
    
        console.log(`\n Ditemukan ${validUrls.length} gambar valid`);
        
        // Tampilkan semua URL yang ditemukan
        console.log('\n Daftar gambar yang ditemukan:');
        validUrls.forEach((url, index) => {
          const filename = url.split('/').pop().substring(0, 30);
          console.log(`${index + 1}. ${filename}...`);
        });
    
        const jumlahDownload = validUrls.length;
        console.log(`\n  Akan mendownload ${jumlahDownload} gambar...`);
    
       

        const result = await downloadsGambar(validUrls, folderName);
        return result;
}

async function downloadsGambar(validUrls, folderName) {
     let successCount = 0;
     let failCount = 0;
     const jumlahDownload = validUrls.length;

        for (let i = 0; i < jumlahDownload; i++) {
          try {
            const randomName = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
            const url = validUrls[i];
            const filename = `${folderName}/${randomName}_${i + 1}.jpg`;

            console.log(`\n[${i + 1}/${jumlahDownload}] Mendownload...`);
            console.log(`URL: ${url.substring(0, 60)}...`);

            await download(url, filename);
            console.log(`V Sukses: ${filename}`);
            successCount++;

            await delay(800); // Jeda pendek antar download
          } catch (err) {
            console.error(` Gagal gambar ${filename}: ${err.message}`);
            failCount++;
          }
        }
    
        console.log('\n' + '='.repeat(60));
        console.log(' LAPORAN AKHIR');
        console.log('='.repeat(60));
        console.log(`Total gambar ditemukan: ${validUrls.length}`);
        console.log(`Berhasil didownload: ${successCount}`);
        console.log(`Gagal didownload: ${failCount}`);
        console.log(`Folder: ${folderName}`);
        console.log('='.repeat(60));
        
    return {
        successCount
    }
}

const nextBtnSelector = "button.js-pagination-control-next";

export async function scrollAll(page, totalPages = 1) {
    let grandTotalSuccess = 0;
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        console.log(`\n📄 Processing page ${pageIndex + 1}/${totalPages}`);

        // 1️⃣ Balik ke atas
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await delay(500);

        //  Scroll 50 kali buat load semua lazy load images
        console.log(' Scrolling 50x untuk load semua gambar...');
        for(let i = 0; i < 50; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight / 4);
            });
            await delay(300);
        }
        console.log(' Selesai scroll 50 kali');

        const downloadResult = await checkValidUrls(page);

        grandTotalSuccess += downloadResult.successCount;

        // Kalau ini page terakhir → stop
        if (pageIndex === totalPages - 1) {
            console.log(" Done. Reached requested pages.");
            break;
        }

        //  Balik ke atas lagi sebelum klik Next
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await delay(500);

        //  Cari dan klik Next button
        console.log(' Mencari Next button...');
        const exists = await page.$(nextBtnSelector);
        
        if (!exists) {
            console.log(" Next button not found. Stop.");
            break;
        }

        //  Klik Next
        console.log(' Klik Next button...');
        await page.click(nextBtnSelector);

        await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
        await delay(1500); // Tunggu sebentar supaya DOM siap
    }

    return { sukses: true, successCount: grandTotalSuccess };
}

export const delay = (ms) => new Promise(r => setTimeout(r, ms));