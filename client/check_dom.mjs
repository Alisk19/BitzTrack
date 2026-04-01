import { chromium } from 'playwright';

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.error('PAGE ERROR:', error));

        await page.goto('http://localhost:3000/#/dashboard', { waitUntil: 'networkidle' });
        
        const content = await page.content();
        console.log("INTERNAL HTML HEAD START");
        console.log(content.substring(0, 500));
        console.log("INTERNAL HTML BODY START");
        const bodyContent = await page.evaluate(() => document.body.innerHTML);
        console.log(bodyContent.substring(0, 1000));
        
        await browser.close();
    } catch (e) {
        console.error('SCRIPT ERROR:', e);
    }
})();
