import { chromium } from 'playwright';

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.error('PAGE ERROR:', error));

        await page.goto('http://localhost:3000/#/dashboard', { waitUntil: 'networkidle' });
        
        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
})();
