const http = require('http');
const fs = require('fs');
async function run() {
  const d = JSON.parse(fs.readFileSync('engine_output.json'));
  let mdStr = d.markdownReport;
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/gi;
  const matches = [...mdStr.matchAll(mermaidRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const code = matches[i][1].trim();
    console.log('Sending mermaid:', i);
    const json = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3069/api/generate-mermaid', { method: 'POST', headers: {'Content-Type': 'application/json'} }, (res) => {
        let data = ''; res.on('data', d => data += d); res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', e => reject(e)); req.write(JSON.stringify({ code })); req.end();
    });
    if (json.imageUrl) {
      const imgMd = `![Architectural Diagram ${i+1}](${json.imageUrl})`;
      mdStr = mdStr.replace(matches[i][0], imgMd);
    }
  }

  console.log('Sending PDF request...');
  const result = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3069/api/generate-pdf', { method: 'POST', headers: {'Content-Type': 'application/json'} }, (res) => {
        let data = ''; res.on('data', d => data += d); res.on('end', () => resolve(data));
      });
      req.on('error', e => reject(e)); req.write(JSON.stringify({ markdown: mdStr, filename: 'test_pdf' })); req.end();
  });
  console.log('PDF Result:', result);
}
run();
