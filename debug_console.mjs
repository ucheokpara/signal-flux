import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
    page.on('requestfailed', request => {
        console.log('REQUEST_FAILED:', request.url(), request.failure()?.errorText);
    });

    console.log("Navigating to localhost:3000...");
    
    try {
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e) {
        console.log("Navigation timeout or error:", e.message);
    }
    
    await browser.close();
})();
