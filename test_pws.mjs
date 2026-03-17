const md = `**Predictive Workforce Scheduling**

External social velocity rarely impacts internal support queues instantaneously. A sudden spike in *Demand (D)* combined with plunging *Sentiment (SSM)* (e.g., a server crash during a massive tournament) generates a wave of support tickets on a delay. By calculating the exact time-lag between external peaks and internal surges, Workforce Management (WFM) teams can dynamically adjust schedules prior to queue collapse.

We employ a Cross-Correlation Function (CCF) on the discrete time series to identify the exact minute-lag ($k$) that yields the highest correlation coefficient between an external $SSM$ drop and an internal *Incident Demand* spike.

**Mathematical Definition of Cross-Correlation**

$$ (f \\star g)[k] = \\sum_{m=-\\infty}^{\\infty} f[m]^* g[m+k] $$

Where $k$ represents the exact lag delay in minutes. By maximizing $(f \\star g)[k]$, the algorithm locates the exact delay structure. `;

fetch('http://127.0.0.1:3000/api/generate-pdf', { 
    method: 'POST', 
    body: JSON.stringify({ markdown: md, filename: 'test_pws_local' }), 
    headers: { 'Content-Type': 'application/json' } 
})
.then(async res => {
   console.log("Status:", res.status);
   console.log(await res.text());
})
.catch(console.error);
