const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const code = `graph TD
  G["Negative Viral Event (External Platform)"] --> H["Queue Toxicity Increases"]
  H --> I["Agent Output Collapses"]`;

async function testMermaid() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    try {
        const page = await browser.newPage();
        
        // Pass browser logs to node terminal
        page.on('console', msg => console.log('MERMAID_PUPEETEER_CONSOLE:', msg.text()));
        
        await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
        const escapedCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\\$/g, '\\$');
        
        const mermaidScriptPath = path.join(process.cwd(), 'node_modules/mermaid/dist/mermaid.min.js');
        const mermaidScript = fs.readFileSync(mermaidScriptPath, 'utf-8');
        
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { background-color: white; margin: 0; padding: 20px; display: inline-block; }
              .mermaid svg text { font-size: 10.5px !important; }
              .mermaid svg .node rect, .mermaid svg .node polygon, .mermaid svg .node circle {
                  stroke-width: 1.5px !important;
              }
            </style>
            <script>${mermaidScript}</script>
            <script>
              mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', flowchart: { useMaxWidth: false, htmlLabels: false } });
              window.initDiagram = async () => {
                 try {
                     console.log("Starting render for: ", \`\${escapedCode}\`);
                     const { svg } = await mermaid.render('mermaid-svg', \`\${escapedCode}\`);
                     document.getElementById('container').innerHTML = svg;
                     document.body.setAttribute('data-done', 'true');
                     console.log("Render successful!");
                 } catch (e) {
                     console.error("Mermaid Render Error Caught Internally: ", e.message);
                     document.body.setAttribute('data-done', 'error');
                 }
              };
            </script>
          </head>
          <body onload="window.initDiagram()">
            <div id="container"></div>
          </body>
          </html>
        `;
        
        await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
        console.log("HTML set. Waiting for data-done...");
        
        try {
            await page.waitForFunction(() => document.body.hasAttribute('data-done'), { timeout: 10000 });
        } catch (waitErr) { console.warn("Sandbox explicitly timed out.") }
        
        const isError = await page.evaluate(() => document.body.getAttribute('data-done') === 'error');
        console.log("Is Error State: ", isError);
        
    } catch(e) {
        console.error("Top level failure: ", e);
    } finally {
        await browser.close();
    }
}

testMermaid();
