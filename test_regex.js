const htmlContent = '<img src="data:image/png;base64,' + 'A'.repeat(50000) + '" alt="test"><img src="real_image.png" alt="valid">';
console.log('Testing regex...');
const start = Date.now();
const result = htmlContent.replace(/<img[^>]+src=["']([^"'>]+(?:\.png|\.jpg|\.svg))["']/gi, 'REPLACED');
console.log('Regex result length:', result.length);
console.log('Time taken:', Date.now() - start, 'ms');
