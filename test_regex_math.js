const md = `$$ (f \\star g)[k] = \\sum_{m=-\\infty}^{\\infty} f[m]^* g[m+k] $$`;
const regex = /(?:\\$\\$|\\\\\\[)(.*?)(?:\\$\\$|\\\\\\])/gs;

// Wait, the correct test should be exactly what's in vite.config.ts:
const regex2 = /(?:\$\$|\\\[)(.*?)(?:\$\$|\\\])/gs;
console.log("MATCHING regex2?:", regex2.test(md));
