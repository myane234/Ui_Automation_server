import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export async function ask(teks) {
    try {
        return new Promise(resolve => {
            rl.question(teks, (jawaban) => {
                resolve(jawaban)
            })
        })
        } catch(err) {
        console.error(`Ask: ${err}`)
        throw(err)
    }
}

export async function askAwal() {
    let URL;
    let WhiskWorkers = 0;
    let pageCustom = 1;
    try {
        URL = await ask("Masukkan URL Adobe(only 1 page) untuk di scrape:  ");
        WhiskWorkers = Number(await ask("Masukkan Jumlah Workers Whisk, mending 1:1 max 1:2 Per Token:  "));
        pageCustom = Number(await ask("Masukkan Page yang diinginkan default 1:  "));
        return { URL, WhiskWorkers, pageCustom };
    } catch(err) {
        console.error(`askAwal: ${err}`)
    }
}