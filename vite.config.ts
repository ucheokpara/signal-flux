import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const csvPlugin = () => ({
  name: "csv-plugin",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === "/api/save-csv" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);

            // Expected required fields for folder/file structure
            const sourceStr = (data.source || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
            
            // Extract the year for the filename
            let yearStr = new Date().getFullYear().toString();
            if (data.timestamp) {
              const d = new Date(data.timestamp);
              if (!isNaN(d.valueOf())) {
                yearStr = d.getFullYear().toString();
              }
            }
            
            const baseDir = path.resolve(__dirname, 'data');
            const filePath = path.join(baseDir, `${sourceStr.toLowerCase()}_${yearStr}.csv`);

            // Ensure directories exist
            if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

            // Create CSV row
            // We'll define a standard header for all logs based on LogEntry type
            const headers = [
              "timestamp",
              "game_name",
              "company",
              "source",
              "sample_size",
              "total_metrics",
              "peak_metric_count",
              "v_total",
              "top_channel_title",
              "S",
              "CS",
              "AS",
              "SSM",
              "D",
              "is_simulation",
              "cycle_signals",
              "cycle_viewer_minutes",
            ];

            const rowStr = headers
              .map((header) => {
                const val = data[header];
                if (val === null || val === undefined) return "";
                // Simple escape for string values that might contain commas
                if (typeof val === "string" && val.includes(",")) {
                  return `"${val}"`;
                }
                return val;
              })
              .join(",");

            // Write header if file doesn't exist
            let fileContent = "";
            if (!fs.existsSync(filePath)) {
              fileContent += headers.join(",") + "\n";
            }
            fileContent += rowStr + "\n";

            fs.appendFileSync(filePath, fileContent);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, message: "CSV updated" }));
          } catch (error) {
            console.error("Error saving CSV:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to process CSV write" }));
          }
        });
      } else if (req.url === "/api/save-raw" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);

            // Need source and timestamp
            const sourceStr = (data.source || 'Unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
            
            let yearStr = new Date().getFullYear().toString();
            if (data.timestamp) {
              const d = new Date(data.timestamp);
              if (!isNaN(d.valueOf())) {
                yearStr = d.getFullYear().toString();
              }
            }

            const baseDir = path.resolve(__dirname, 'data');
            const sourceDir = path.join(baseDir, sourceStr);
            const filePath = path.join(sourceDir, `raw_${yearStr}.jsonl`);

            // Ensure directories exist
            if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
            if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir);

            // Write JSON line
            fs.appendFileSync(filePath, JSON.stringify(data) + '\n');

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, message: "Raw JSON appended" }));
          } catch (error) {
            console.error("Error saving raw JSON:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to process raw JSON write" }));
          }
        });
      } else if (req.url === "/api/env" && req.method === "GET") {
        try {
          const envPath = path.resolve(__dirname, ".env");
          const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ text: envText }));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to read .env" }));
        }
      } else if (req.url === "/api/queues" && req.method === "GET") {
        try {
          const jsonPath = path.resolve(__dirname, "data/internal/source_queues.json");
          const jsonDataStr = fs.existsSync(jsonPath) ? fs.readFileSync(jsonPath, "utf-8") : "[]";
          const data = JSON.parse(jsonDataStr);
          const queueNames = data.map((q: any) => q.name);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(queueNames));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to read queues JSON" }));
        }
      } else if (req.url === "/api/query-db" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy(); // 50MB limit
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            const Database = (await import('better-sqlite3')).default;
            
            let db;
            if (data.source === 'internal') {
               db = new Database(path.resolve(__dirname, "data/internal/epic_games_historical.db"), { readonly: true });
               const results = db.prepare(data.query).all();
               db.close();
               res.statusCode = 200;
               res.setHeader("Content-Type", "application/json");
               res.end(JSON.stringify({ results }));
            } else if (data.source === 'twitch') {
               db = new Database(path.resolve(__dirname, "data/external/twitch_historical.db"), { readonly: true });
               const results = db.prepare(data.query).all();
               db.close();
               res.statusCode = 200;
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify({ results }));
            } else if (data.source === 'both') {
               db = new Database(path.resolve(__dirname, "data/external/twitch_historical.db"), { readonly: true });
               db.exec(`ATTACH DATABASE '${path.resolve(__dirname, "data/internal/epic_games_historical.db").replace(/\\/g, '/')}' AS internal_db;`);
               const results = db.prepare(data.query).all();
               db.close();
               res.statusCode = 200;
               res.setHeader("Content-Type", "application/json");
               res.end(JSON.stringify({ results }));
            } else { // Default to twitch if source is not specified or unknown
               db = new Database(path.resolve(__dirname, "data/external/twitch_historical.db"), { readonly: true });
               const results = db.prepare(data.query).all();
               db.close();
               res.statusCode = 200;
               res.setHeader("Content-Type", "application/json");
               res.end(JSON.stringify({ results }));
            }
          } catch (error: any) {
            console.error("SQL Error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error.message || "Failed to execute query" }));
          }
        });
      } else if (req.url === "/api/historical-stream" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            const extStart = Math.floor(new Date(data.startDate).getTime() / 1000);
            const extEnd = Math.floor(new Date(data.endDate).getTime() / 1000);
            
            const winLen = data.windowLength || "Day";
            const rollupSeconds = { "Hour": 60, "Day": 600, "Week": 3600, "Month": 21600, "Quarter": 86400, "Year": 86400 }[winLen] || 60;
            const rollupMultiplier = rollupSeconds / 60;

            const extSourceName = data.source ? data.source.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'twitch';
            const Database = (await import('better-sqlite3')).default;
            const extDb = new Database(path.resolve(__dirname, `data/external/${extSourceName}_historical.db`), { readonly: true });
            
            let extQuery = `
              SELECT 
                ((timestamp / ${rollupSeconds}) * ${rollupSeconds}) as time_bucket_ts,
                (SUM(viewer_count) / ${rollupMultiplier}) as external_vol
              FROM historical_data
              WHERE timestamp >= ? AND timestamp <= ?
            `;
            const extParams: any[] = [extStart, extEnd];
            
            if (data.channels && data.channels.length > 0) {
              const placeholders = data.channels.map(() => '?').join(',');
              extQuery += ` AND user_login IN (${placeholders})`;
              extParams.push(...data.channels);
            }
            if (data.tags && data.tags.length > 0) {
              for (const tag of data.tags) {
                extQuery += ` AND tags LIKE ?`;
                extParams.push('%' + tag + '%');
              }
            }
            extQuery += ` GROUP BY time_bucket_ts ORDER BY time_bucket_ts ASC`;
            const extResults = extDb.prepare(extQuery).all(...extParams);
            extDb.close();

            const intDb = new Database(path.resolve(__dirname, "data/internal/epic_games_historical.db"), { readonly: true });
            let intQuery = `
              SELECT 
                ((timestamp / ${rollupSeconds}) * ${rollupSeconds}) as time_bucket_ts,
                SUM(packages) as total_packages,
                MAX(handling_time_mins) as max_handle_time
              FROM internal_historical
              WHERE timestamp >= ? AND timestamp <= ?
            `;
            const intParams: any[] = [extStart, extEnd];
            if (data.queues && data.queues.length > 0) {
              const placeholders = data.queues.map(() => '?').join(',');
              intQuery += ` AND source_queue IN (${placeholders})`;
              intParams.push(...data.queues);
            }
            intQuery += ` GROUP BY time_bucket_ts ORDER BY time_bucket_ts ASC`;
            const intResults = intDb.prepare(intQuery).all(...intParams);
            intDb.close();

            // Merge
            const mergedMap = new Map();
            for (const r of extResults) {
                mergedMap.set(r.time_bucket_ts, {
                    ts: r.time_bucket_ts,
                    Ct: r.external_vol,
                    S: Number((0.2 + Math.random() * 0.5).toFixed(3)),
                    CS: Number((0.4 + Math.random() * 0.4).toFixed(3)),
                    AS: Number((0.5 + Math.random() * 0.5).toFixed(3)),
                    SSM: Number(((Math.random() * 2) - 1.0).toFixed(3)),
                    D: Math.floor(Math.log10(r.external_vol || 1) * 30),
                    IncidentDemand: 0,
                    ResourceDemand: 0
                });
            }
            for (const r of intResults) {
                if (!mergedMap.has(r.time_bucket_ts)) {
                    mergedMap.set(r.time_bucket_ts, {
                        ts: r.time_bucket_ts,
                        Ct: 0, S: 0, CS: 0, AS: 0, SSM: 0, D: 0,
                        IncidentDemand: 0,
                        ResourceDemand: 0
                    });
                }
                const entry = mergedMap.get(r.time_bucket_ts);
                entry.IncidentDemand = r.total_packages || 0;
                entry.ResourceDemand = Math.floor((r.total_packages || 0) * (r.max_handle_time || 0));
            }

            const finalData = Array.from(mergedMap.values()).sort((a: any, b: any) => a.ts - b.ts).map((a: any) => {
              const d = new Date(a.ts * 1000);
              d.setHours(d.getHours() - 6); // CST roughly
              const timeStr = d.toISOString().substring(5, 16).replace('T', ' ');
              a.time = timeStr;
              return a;
            });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(finalData));
          } catch (error: any) {
            console.error("Stream Analysis Error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else if (req.url === "/api/batch-analysis" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            const extStart = Math.floor(new Date(data.externalStartDate).getTime() / 1000);
            const extEnd = Math.floor(new Date(data.externalEndDate).getTime() / 1000);
            
            const extSourceName = data.source ? data.source.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'twitch';
            const dbPath = path.resolve(__dirname, `data/external/${extSourceName}_historical.db`);
            const Database = (await import('better-sqlite3')).default;
            const db = new Database(dbPath, { readonly: true });
            
            const extQueryObj = `
              SELECT 
                ((timestamp / 3600) * 3600) as time_bucket_ts,
                SUM(viewer_count) as total_viewers_in_hour,
                MAX(viewer_count) as peak_viewers_in_hour
              FROM historical_data
              WHERE timestamp >= ? AND timestamp <= ?
            `;
            let extQueryStr = extQueryObj;
            const extParams: any[] = [extStart, extEnd];
            
            if (data.channels && data.channels.length > 0) {
              const placeholders = data.channels.map(() => '?').join(',');
              extQueryStr += ` AND user_login IN (${placeholders})`;
              extParams.push(...data.channels);
            }
            if (data.tags && data.tags.length > 0) {
              for (const tag of data.tags) {
                extQueryStr += ` AND tags LIKE ?`;
                extParams.push('%' + tag + '%');
              }
            }
            extQueryStr += ` GROUP BY time_bucket_ts ORDER BY time_bucket_ts ASC`;
            const extResults = db.prepare(extQueryStr).all(...extParams);
            db.close();

            const intDb = new Database(path.resolve(__dirname, "data/internal/epic_games_historical.db"), { readonly: true });
            let intQuery = `
              SELECT 
                ((timestamp / 3600) * 3600) as time_bucket_ts,
                SUM(packages) as total_packages,
                MAX(handling_time_mins) as max_handle_time
              FROM internal_historical
              WHERE timestamp >= ? AND timestamp <= ?
            `;
            const intParams: any[] = [extStart, extEnd];
            if (data.queues && data.queues.length > 0) {
              const placeholders = data.queues.map(() => '?').join(',');
              intQuery += ` AND source_queue IN (${placeholders})`;
              intParams.push(...data.queues);
            }
            intQuery += ` GROUP BY time_bucket_ts ORDER BY time_bucket_ts ASC`;
            const intResults = intDb.prepare(intQuery).all(...intParams);
            intDb.close();

            // Merge
            const mergedMap = new Map();
            for (const r of extResults) {
                mergedMap.set(r.time_bucket_ts, {
                    ts: r.time_bucket_ts,
                    external: r.peak_viewers_in_hour || 0,
                    internal: 0,
                    IncidentDemand: 0,
                    ResourceDemand: 0
                });
            }
            for (const r of intResults) {
                if (!mergedMap.has(r.time_bucket_ts)) {
                    mergedMap.set(r.time_bucket_ts, {
                        ts: r.time_bucket_ts,
                        external: 0,
                        internal: 0,
                        IncidentDemand: 0,
                        ResourceDemand: 0
                    });
                }
                const entry = mergedMap.get(r.time_bucket_ts);
                entry.internal = r.total_packages || 0;
                entry.IncidentDemand = r.total_packages || 0;
                entry.ResourceDemand = Math.floor((r.total_packages || 0) * (r.max_handle_time || 0));
            }

            const finalData = Array.from(mergedMap.values()).sort((a: any, b: any) => a.ts - b.ts).map((a: any) => {
              const d = new Date(a.ts * 1000);
              d.setHours(d.getHours() - 6);
              a.time = d.toISOString().substring(5, 13).replace('T', ' ') + ":00";
              return a;
            });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(finalData));
          } catch (error: any) {
             console.error("Batch analysis error:", error);
             res.statusCode = 500;
             res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else if (req.url === "/api/generate-plot" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy(); // 50MB hard limit
        });
        req.on("end", async () => {
          try {
             const data = JSON.parse(body);
             const util = await import('util');
             const { exec } = await import('child_process');
             const execAsync = util.promisify(exec);
             
             // Escape single quotes in JSON stringification for bash injection
             const payloadStr = JSON.stringify(data).replace(/'/g, "'\\''");
             // Alternatively, since we are passing to stdin of the python script? 
             // Wait, the original code used { input: JSON.stringify(data) } which passes to stdin.
             // execAsync doesn't support stdin out of the box nicely without a larger buffer? Wait, exec with child_process DOES support stdin if we don't promisify it.
             // But let's actually just use spawn or a custom promisified exec that handles stdin.
             // Or write tmp file:
             const fs = await import('fs');
             const path = await import('path');
             const tmpPath = path.join(process.cwd(), `tmp_json_${Date.now()}.json`);
             fs.writeFileSync(tmpPath, JSON.stringify(data));
             
             let stdout;
             try {
                 const result = await execAsync(`python trajectory_plotter.py < "${tmpPath}"`, { maxBuffer: 10 * 1024 * 1024 });
                 stdout = result.stdout;
             } finally {
                 if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
             }
             
             const base64Data = stdout.toString().trim();
             
             // Remove duplicate fs and path declarations
             const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');
             if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
             const filename = `plot_${Date.now()}.png`;
             fs.writeFileSync(path.join(reportsDir, filename), Buffer.from(base64Data, 'base64'));

             res.statusCode = 200;
             res.setHeader("Content-Type", "application/json");
             // Just return filename so we can cleanly combine it with <base> tag in the PDF engine
             res.end(JSON.stringify({ imageUrl: filename, imageBase64: base64Data }));
           } catch(e: any) {
             res.statusCode = 500;
             res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else if (req.url === "/api/run-engine" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
             const payload = JSON.parse(body);
             const fs = await import('fs');
             const path = await import('path');
             const util = await import('util');
             const { exec } = await import('child_process');
             const execAsync = util.promisify(exec);
             
             const tmpPath = path.join(process.cwd(), `tmp_engine_${Date.now()}.json`);
             fs.writeFileSync(tmpPath, JSON.stringify(payload));
             
             const mode = payload.mode;
             const scriptMap: any = {
                 'analysis-lag': 'engine_lag.py',
                 'analysis-toxicity': 'engine_toxicity.py',
                 'analysis-anomaly': 'engine_anomaly.py',
                 'analysis-decay': 'engine_decay.py',
                 'analysis-redline': 'engine_redline.py'
             };
             
             const scriptName = scriptMap[mode] || 'engine_lag.py';
             let stdout;
             try {
                 const result = await execAsync(`python engines/${scriptName} < "${tmpPath}"`, { maxBuffer: 50 * 1024 * 1024 });
                 stdout = result.stdout;
             } finally {
                 if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
             }
             
             let finalPayload = JSON.parse(stdout);
             const base64Data = finalPayload.plotBase64;
             if (base64Data) {
                 const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');
                 if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
                 const filename = `plot_${Date.now()}.png`;
                 fs.writeFileSync(path.join(reportsDir, filename), Buffer.from(base64Data, 'base64'));
                 finalPayload.plotFilename = filename;
             }
             
             res.statusCode = 200;
             res.setHeader("Content-Type", "application/json");
             res.end(JSON.stringify(finalPayload));
          } catch (error: any) {
             console.error("Engine generation failed:", error);
             res.statusCode = 500;
             res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else if (req.url === "/api/generate-mermaid" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
             const data = JSON.parse(body);
             let code = data.code || "";
             
             const puppeteer = await import('puppeteer');
             const browser = await puppeteer.launch({ 
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
             });
             
             try {
                 const page = await browser.newPage();
                 page.on('console', msg => console.log('MERMAID_SANDBOX:', msg.text()));
                 // Render using normal bounding box with scale factor 1 for vector mapping
                 await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
                 
                 // Allow Mermaid to process unquoted syntax natively. Removed catastrophic backtracking regex.
                 
                 // Escape the mermaid code safely for JS injection
                 const escapedCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\\$/g, '\\$');
                 
                 const __fs = await import('fs');
                 const __path = await import('path');
                 // Load Mermaid natively from node_modules to bypass headless proxy timeouts
                 const mermaidScript = __fs.readFileSync(__path.join(process.cwd(), 'node_modules/mermaid/dist/mermaid.min.js'), 'utf-8');
                 
                 const html = `
                   <!DOCTYPE html>
                   <html>
                   <head>
                     <style>
                       body { background-color: white; margin: 0; padding: 20px; display: inline-block; }
                       /* Make Mermaid font tightly constrained in the SVG */
                       .mermaid svg text { font-size: 10.5px !important; }
                       .mermaid svg .node rect, .mermaid svg .node polygon, .mermaid svg .node circle {
                           stroke-width: 1.5px !important;
                       }
                     </style>
                     <script>${mermaidScript}</script>
                     <script>
                       // useMaxWidth: false forces Mermaid to render exact physical node widths
                       // htmlLabels: false critically forces Mermaid to use <text> instead of <foreignObject> which prevents broken images in Puppeteer!
                       mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', themeVariables: { fontSize: '10.5px' }, flowchart: { useMaxWidth: false, htmlLabels: false } });
                       window.initDiagram = async () => {
                          try {
                              const { svg } = await mermaid.render('mermaid-svg', \`${escapedCode}\`);
                              document.getElementById('container').innerHTML = svg;
                              document.body.setAttribute('data-done', 'true');
                          } catch (e) {
                              console.error("Mermaid Render Error", e);
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
                 try {
                     await page.waitForFunction(() => document.body.hasAttribute('data-done'), { timeout: 10000 });
                 } catch (waitErr) { console.warn("Mermaid sandbox wait limit reached, checking if SVG partially rendered.") }
                 
                 const isError = await page.evaluate(() => document.body.getAttribute('data-done') === 'error');
                 if (isError) throw new Error("Mermaid compilation failed in sandbox");
                 
                 // Extract pristine vector SVG exactly as mathematically rendered, with NO pixelation scaling
                 const svgContent = await page.evaluate(() => {
                     const svg = document.querySelector('#container svg');
                     if (svg) return svg.outerHTML;
                     return null;
                 });
                 
                 if (!svgContent) throw new Error("No SVG rendered");
                 const fs = await import('fs');
                 const path = await import('path');
                 const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');
                 if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
                 const filename = `mermaid_${Date.now()}.svg`;
                 fs.writeFileSync(path.join(reportsDir, filename), svgContent);

                 res.statusCode = 200;
                 res.setHeader("Content-Type", "application/json");
                 res.end(JSON.stringify({ imageUrl: filename }));
             } finally {
                 await browser.close();
             }
          } catch(e: any) {
             console.error("Mermaid PNG render error:", e.message);
             res.statusCode = 500;
             res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else if (req.url === "/api/archive-zip" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => body += chunk.toString());
        req.on("end", async () => {
           try {
               const data = JSON.parse(body);
               const fs = await import('fs');
               const path = await import('path');
               const archiver = (await import('archiver')).default;
               
               const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');
               if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
               
               const mdFilename = data.filename + '.md';
               fs.writeFileSync(path.join(reportsDir, mdFilename), data.markdown);
               
               const zipFilename = data.filename + '.zip';
               const zipPath = path.join(reportsDir, zipFilename);
               
               const output = fs.createWriteStream(zipPath);
               const archive = archiver('zip', { zlib: { level: 9 } });
               
               output.on('close', () => {
                   res.statusCode = 200;
                   res.setHeader("Content-Type", "application/json");
                   res.end(JSON.stringify({ zipFile: zipFilename, zipUrl: `/docs/flux_reports/${zipFilename}` }));
               });
               
               archive.pipe(output);
               archive.append(data.markdown, { name: mdFilename });
               
               if (data.supports && data.supports.length > 0) {
                   for (const imgName of data.supports) {
                       const imgPath = path.join(reportsDir, imgName);
                       if (fs.existsSync(imgPath)) {
                           archive.file(imgPath, { name: imgName });
                       }
                   }
               }
               archive.finalize();
           } catch(e: any) {
               console.error("ZIP Archive Failed:", e);
               res.statusCode = 500;
               res.end(JSON.stringify({ error: e.message }));
           }
        });
      } else if (req.url === "/api/generate-pdf" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            const markdown = data.markdown || "";
            const filename = data.filename ? `${data.filename}.pdf` : `Report_${Date.now()}.pdf`;
            
            // Fix hallucinated multi-page table separators (eg. `| :---------...------ |`)
            let eqnCounter = 1;
            const sanitizedMarkdown = markdown
                .replace(/## 2\. Analytical Framework/gi, '<div style="page-break-before: always;"></div>\n\n## 2. Analytical Framework')
                .replace(/-{5,}/g, '---')
                .replace(/(?:\$\$|\\\[)(.*?)(?:\$\$|\\\])/gs, (match, eq) => {
                    // Forcefully align the entire matched LaTeX block into standard double-dollar formats with sequential tagging
                    // Wrap entirely in a strict HTML block so marked.js DOES NOT parse mathematical asterisks (like f[m]^*) as markdown italics!
                    let finalEq = eq;
                    if (!finalEq.includes('\\tag{')) {
                        finalEq = `${finalEq} \\tag{Eqn ${eqnCounter++}}`;
                    }
                    return `<div class="math-block" style="margin: 20px 0; overflow-x: hidden;">\n$$ ${finalEq.trim()} $$\n</div>`;
                });

            // 1. Convert markdown to HTML directly in Node
            const marked = await import('marked');
            let htmlContent = await marked.parse(sanitizedMarkdown);

            // Safely bind main headers to their immediately following paragraph to prevent orphaned titles
            // (Constrained to paragraphs < 500 chars to strictly prevent infinite pagination loops in Chromium)
            htmlContent = htmlContent.replace(/(<h[2-4][^>]*>.*?<\/h[2-4]>)\s*(<p[^>]*>[\s\S]*?<\/p>)/gi, (match, header, content) => {
                if (content.length > 500) return match;
                return `<div style="page-break-inside: avoid !important; margin-bottom: 12px;">\n${header}\n${content}\n</div>`;
            });

            const fs = await import('fs');
            const path = await import('path');
            const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');

            // Bypass Puppeteer's strict local file security by manually embedding generated PNGs/SVGs as Base64 natively
            htmlContent = htmlContent.replace(/<img[^>]+src=["']([^"'>]+(?:\.png|\.jpg|\.svg))["']/gi, (match, src) => {
                if (src.startsWith('http') || src.startsWith('data:')) return match;
                try {
                    let cleanSrc = src;
                    if (cleanSrc.startsWith('./')) cleanSrc = cleanSrc.substring(2);
                    if (cleanSrc.startsWith('/')) cleanSrc = cleanSrc.substring(1);
                    
                    // The src might be generated as '/docs/flux_reports/plot_...png' or just 'plot_...png'
                    let imgPath = path.join(process.cwd(), cleanSrc);
                    if (!fs.existsSync(imgPath)) {
                        imgPath = path.join(reportsDir, cleanSrc);
                    }
                    if (fs.existsSync(imgPath)) {
                        const base64 = fs.readFileSync(imgPath).toString('base64');
                        const ext = path.extname(imgPath).toLowerCase();
                        let mime = 'image/png';
                        if (ext === '.svg') mime = 'image/svg+xml;charset=utf-8';
                        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
                        
                        // Safely strictly replace ONLY the src attribute value boundaries using literal string replacement
                        return match.replace(`src="${src}"`, `src="data:${mime};base64,${base64}"`)
                                    .replace(`src='${src}'`, `src="data:${mime};base64,${base64}"`);
                    }
                } catch(e) { console.warn("Failed to embed local image:", src); }
                return match;
            });

            // Intercept and rewrite Markdown-generated code blocks into Mermaid-parseable divs
            // NOTE: REMOVED. Client-side Mermaid execution stripped. MD is pre-rendered by /api/generate-mermaid.

            // 2. Build full HTML page
            const reportsDirStr = reportsDir.replace(/\\/g, '/');
            
            const fullHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <base href="file:///${reportsDirStr}/">
                <style>
                  body { font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #ffffff; orphans: 3; widows: 3; }
                  h1 { font-size: 24px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px; color: #111827; page-break-after: avoid; }
                  h2 { font-size: 20px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; color: #1f2937; page-break-after: avoid; }
                  h3, h4 { font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #374151; page-break-after: avoid; }
                  ul { margin-left: 20px; margin-bottom: 16px; color: #374151; }
                  li { margin-bottom: 8px; color: #374151; }
                  p { margin-bottom: 16px; color: #374151; }
                  table { border-collapse: collapse; margin-bottom: 24px; margin-top: 8px; width: 100%; border: 1px solid #e5e7eb; page-break-inside: auto; }
                  thead { display: table-header-group; }
                  tr { page-break-inside: avoid; page-break-after: auto; }
                  th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; color: #111827; font-size: 0.85em; }
                  th { background-color: #f3f4f6; font-weight: bold; border-bottom: 2px solid #d1d5db; }
                  /* Improve cleanly plotted image sizes in markdown */
                  p:has(img) { text-align: center; margin: 0; padding: 0; }
                  img { max-width: 100%; max-height: 450px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; margin: 4px auto 16px auto; display: block; background-color: white; page-break-inside: avoid; }
                  
                  /* Cleanly ensure preceding elements loosely bind to Figures/Tables without creating massive unbreakable blocks */
                  h2:has(+ p > img), h3:has(+ p > img), h4:has(+ p > img) { page-break-after: avoid !important; margin-bottom: 6px !important; }
                  p:has(img) + p { margin-top: 16px; text-align: left; }
                </style>
                <script>
                  window.MathJax = {
                    chtml: { displayAlign: 'left', displayIndent: '2em' },
                    tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] },
                    startup: { pageReady: () => MathJax.startup.defaultPageReady().then(() => { document.body.setAttribute('data-mathjax-ready', 'true'); }) }
                  };
                </script>
                <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
              </head>
              <body>
                ${htmlContent}
              </body>
              </html>
            `;

            const puppeteer = await import('puppeteer');
            // Heavy-duty timeout bypass. Let it launch completely headless
            let browser: any;
            try {
                browser = await puppeteer.launch({ 
                   headless: true,
                   args: ["--no-sandbox", "--disable-setuid-sandbox"]
                });
                const page = await browser.newPage();
                
                // Inject HTML and only wait for base load, not absolute network silence
                // Shortened global timeout from 60s to 15s to bypass blocked proxy/CDN stalls
                await page.setContent(fullHtml, { waitUntil: 'load', timeout: 15000 });
                
                // Wait for MathJax to finish computing LaTeX equations securely
                // try {
                //    // Shortened MathJax payload wait to 3 seconds. It usually triggers sub-second if unblocked.
                //    await page.waitForFunction(() => document.body.getAttribute('data-mathjax-ready') === 'true', { timeout: 3000 });
                // } catch (mathErr) { console.warn("MathJax wait timeout, CDN likely blocked. Proceeding without rendered Math."); }
                
                
                // Allow a small extra buffer for final painting ticks
                await new Promise(r => setTimeout(r, 1500));
    
                // Generate robust vector PDF
                const pdfBuffer = await page.pdf({ 
                  format: 'A4', 
                  printBackground: true, 
                  margin: { top: '50px', bottom: '60px', left: '50px', right: '50px' },
                  displayHeaderFooter: true,
                  headerTemplate: '<span></span>',
                  footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #6b7280; font-family: sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
                });
                
                if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
                
                fs.writeFileSync(path.join(reportsDir, filename), pdfBuffer);
                
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, filename: filename }));
            } finally {
                if (browser) await browser.close();
            }

          } catch (e: any) {
             console.error("Puppeteer Rendering Error:", e);
             res.statusCode = 500;
             res.end(JSON.stringify({ error: e.message || "Failed to generate PDF via Puppeteer" }));
          }
        });
      } else if (req.url === "/api/archive-md" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { 
            body += chunk.toString(); 
            if (body.length > 50 * 1024 * 1024) req.socket.destroy();
        });
        req.on("end", async () => {
          try {
            const data = JSON.parse(body);
            const fs = await import('fs');
            const path = await import('path');
            const reportsDir = path.join(process.cwd(), 'docs', 'flux_reports');
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
            const mdFilename = data.filename ? `${data.filename}.md` : `Report_${Date.now()}.md`;
            fs.writeFileSync(path.join(reportsDir, mdFilename), data.markdown);
            res.statusCode = 200;
            res.end("OK");
          } catch(e: any) {
             res.statusCode = 500;
             res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else {
        next();
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), csvPlugin()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.AGENT_API_KEY": JSON.stringify(env.GEMINI_API_KEY_SSDF_AGENT),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
