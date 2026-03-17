import { marked } from 'marked';
const str = "Testing mathematical italics: \n\n<div class='math'>$$ (f * g)[k] = \\sum_{m=-\\infty}^{\\infty} f[m]^* g[m+k] \\tag{Eqn 1} $$</div>";
console.log(marked.parse(str));
