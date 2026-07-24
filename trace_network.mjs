import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('request', request => {
        if (request.url().includes('/me')) {
            console.log('--- MOCK DEVTOOLS: REQUEST ---');
            console.log('Request URL:', request.url());
            console.log('Request Headers:', JSON.stringify(request.headers(), null, 2));
        }
    });

    page.on('response', async response => {
        if (response.url().includes('/me')) {
            console.log('--- MOCK DEVTOOLS: RESPONSE ---');
            console.log('Response Status:', response.status());
            try {
                const body = await response.json();
                console.log('Response JSON:', body);
            } catch (e) {
                console.log('Response Body:', await response.text());
            }
        }
    });

    console.log('Navigating to http://localhost:5173/');
    try {
        await page.goto('http://localhost:5173/', { timeout: 30000 });
    } catch (e) {
        console.log("Nav failed, continuing to print:", e.message);
    }

    await page.waitForTimeout(5000);

    const ls = await page.evaluate(() => {
        let res = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            res[key] = localStorage.getItem(key);
        }
        return res;
    });
    console.log('--- LOCAL STORAGE ---');
    console.log(ls);

    await browser.close();
}

run();
