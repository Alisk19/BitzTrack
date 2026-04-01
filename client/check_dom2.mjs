import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        const logs = [];
        page.on('console', msg => logs.push('PAGE LOG: ' + msg.text()));
        page.on('pageerror', error => logs.push('PAGE ERROR: ' + error.message));

        await page.goto('http://localhost:3000/#/dashboard', { waitUntil: 'networkidle' });
        
        const content = await page.content();
        logs.push("INTERNAL HTML BODY START");
        const bodyContent = await page.evaluate(() => document.body.innerHTML);
        logs.push(bodyContent.substring(0, 1000));
        
        fs.writeFileSync('dom_output.txt', logs.join('\n'));
        await browser.close();
    } catch (e) {
        fs.writeFileSync('dom_output.txt', 'SCRIPT ERROR: ' + e.message);
    }
})();
