import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ask } from './tanya.js';

function createEnvFile(envPath) {
    const defaultContent = `# Auto Generated .env
GEMINI_API=
BEARER_TOKEN=
`;
    fs.writeFileSync(envPath, defaultContent);
}

async function env() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        console.log(" Path:", envPath);

        // 1️⃣ Buat kalau belum ada
        if (!fs.existsSync(envPath)) {
            console.log(" .env belum ada, membuat baru...");
            createEnvFile(envPath);
        }

        dotenv.config({ path: envPath });

        let gemini = process.env.GEMINI_API;
        let tokensRaw = process.env.BEARER_TOKEN;

        if (!gemini?.trim() || !tokensRaw?.trim()) {

            console.log(" ENV belum lengkap.");

            gemini = await ask("Masukkan GEMINI_API: ");
            const tokenInput = await ask("Masukkan BEARER_TOKEN (pisahkan dengan koma jika lebih dari satu): ");

            const newContent = `# Auto Generated .env
GEMINI_API=${gemini}
BEARER_TOKEN=${tokenInput}
`;

            fs.writeFileSync(envPath, newContent);

            console.log(" ENV berhasil disimpan.");

            dotenv.config({ path: envPath, override: true });

            tokensRaw = tokenInput;
        }

        const tokenList = tokensRaw
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        console.log(` Total token ditemukan: ${tokenList.length}`);

        return {
            geminiApi: process.env.GEMINI_API,
            bearerTokens: tokenList
        };

    } catch (err) {
        console.error(" inputenv:", err);
        throw err;
    }
}

env();