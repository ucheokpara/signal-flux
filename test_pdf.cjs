const fs = require('fs');
const http = require('http');

async function test_hang() {
  const d = JSON.parse(fs.readFileSync('engine_output.json'));
  let mdStr = d.markdownReport;
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/gi;
  const matches = [...mdStr.matchAll(mermaidRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const code = matches[i][1].trim();
    console.log('Sending mermaid:', i);
    const json = await parsePost('http://localhost:3000/api/generate-mermaid', { code });
    if (json.imageUrl) {
      const imgMd = `![Architectural Diagram ${i+1}](${json.imageUrl})`;
      mdStr = mdStr.replace(matches[i][0], imgMd);
    }
  }

  console.log('Sending PDF request...');
  const result = await parsePost('http://localhost:3000/api/generate-pdf', { markdown: mdStr, filename: 'test_pdf' });
  console.log('PDF Result:', result);
}

function parsePost(url, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: {'Content-Type': 'application/json'} }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', e => reject(e));
    req.write(JSON.stringify(payload));
    req.end();
  });
}

test_hang().catch(e => console.error(e));
