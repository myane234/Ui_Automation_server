import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootProject = path.resolve(__dirname, '../../')

function createEnvFile(envPath) {
    const defaultContent = `# Auto Generated .env
GEMINI_API=
BEARER_TOKEN=
`;
    fs.writeFileSync(envPath, defaultContent);
}

export async function env(settingsSystem) {

    let gemini = settingsSystem.GeminiAPI;     
    let tokenInput = settingsSystem.WhiskTokens;

    try {
        const envPath = path.join(rootProject , '.env');
        console.log(" Path:", envPath);

        // 1️⃣ Buat kalau belum ada
        if (!fs.existsSync(envPath)) {
            console.log(" .env belum ada, membuat baru...");
            createEnvFile(envPath);
        }

        dotenv.config({ path: envPath });

        let geminiRaw = process.env.GEMINI_API;
        let tokensRaw = process.env.BEARER_TOKEN;

        if (!geminiRaw?.trim() || !tokensRaw?.trim()) {

            console.log(" ENV belum lengkap.");

            // gemini = await ask("Masukkan GEMINI_API: ");
            // const tokenInput = await ask("Masukkan BEARER_TOKEN (pisahkan dengan koma jika lebih dari satu): ");

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
