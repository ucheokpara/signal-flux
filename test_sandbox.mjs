import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const code = `graph TD; A-->B;`;

async function test() {
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    try {
        const page = await browser.newPage();
        page.on('console', msg => console.log('MERMAID_LOG:', msg.text()));
        await page.setViewport({ width: 800, height: 600 });
        
        const mermaidScript = fs.readFileSync(path.join(process.cwd(), 'node_modules/mermaid/dist/mermaid.min.js'), 'utf-8');
        
        const escapedCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\\$/g, '\\$');

        const html = `<html><head><script>${mermaidScript}</script><script>
            mermaid.initialize({startOnLoad:false});
            window.initDiagram = async () => {
                try {
                    console.log("Starting render");
                    const {svg} = await mermaid.render('id1', \`${escapedCode}\`);
                    console.log("Render success!");
                    document.body.innerHTML = svg;
                    document.body.setAttribute('data-done', 'true');
                } catch(e) {
                    console.error('MERMAID ERROR:', e.message, e.stack);
                    document.body.setAttribute('data-done', 'error');
                }
            };
        </script></head><body onload='window.initDiagram()'></body></html>`;
        
        await page.setContent(html);
        await page.waitForFunction(() => document.body.hasAttribute('data-done'));
        const isError = await page.evaluate(() => document.body.getAttribute('data-done'));
        console.log("FINAL STATUS:", isError);
    } finally {
        await browser.close();
    }
}
test();
