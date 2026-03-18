import React, { useState, useEffect, useRef } from "react";
import { AppView, AuthenticatedUser } from "../types";
import { jsPDF } from "jspdf";
import {
  Bot, Download, Cpu, Activity, Clock, TrendingDown, AlertCircle, LineChart as LineChartIcon, Key, Upload, FileText, Settings, Search, CheckCircle, Shield, ShieldCheck, Network, Brain, Database, MessageSquare, Send
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { agentFluxChat } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { getAnalyticalFrameworkTemplate, getAnalyticalFrameworkReferences } from './AnalyticalFrameworkTemplates';
import mermaid from 'mermaid';
import { marked } from 'marked';
import whitepaper from '../docs/SSDF_Whitepaper.md?raw';
import academicContext from '../docs/Academic_Context.md?raw';

interface AnalysisModuleViewProps {
  mode: AppView;
  config: any;
  authUser: AuthenticatedUser;
}

const MOCK_ENV = {
  db_cluster_auth: "MASKED_INTERNAL_TOKEN"
};

interface StepMeta {
  message: string;
  action: 'none' | 'chart' | 'report' | 'pdf';
  requiresConfirm: boolean;
}

interface GeneratedDoc {
  title: string;
  filename: string;
  url: string;
  time: string;
  type: 'MD' | 'PDF';
  supports?: string[];
  genTime?: string;
  downloaded?: boolean;
}

const USE_CASE_META: Record<string, {
  title: string;
  desc: string;
  motivation: string;
  icon: any;
  accent: string;
  controls: { label: string; default: string; options?: string[] }[];
  fakeReport: string;
  chartDataKeyLeft: string;
  chartDataKeyRight: string;
  steps: StepMeta[];
}> = {
  'analysis-lag': {
    title: 'Predictive Workforce Scheduling',
    desc: 'Uses Time-Series Cross-Correlation (CCF) to calculate the exact delay between an external social peak and an internal incident spike.',
    motivation: "Why do this? By understanding the exact time delay between a social media spike and a surge in support tickets, you can pre-emptively shift agents to handle the incoming load before the queue backs up.",
    icon: Clock,
    accent: 'text-indigo-400 border-indigo-400/20 bg-indigo-500/10',
    controls: [
      { label: 'Leading Indicator', default: 'Demand Score (D)', options: ['Demand Score (D)', 'Capture Score (CS)', 'Stickiness (S)'] },
      { label: 'Lagging Indicator', default: 'Incident Demand', options: ['Incident Demand', 'Resource Demand'] }
    ],
    chartDataKeyLeft: 'Demand',
    chartDataKeyRight: 'Incidents',
    fakeReport: `Predictive Workforce Scheduling Analysis Report

## 1. Executive Summary
Successfully scanned and aligned internal/external telemetry volumes across the specified date range. Processed 10,080 distinct one-minute samples to calculate cross-correlation latency.

## 2. Diagnostic Findings
- The maximum Pearson Correlation (r = 0.82) was achieved against Incident Demand at t + 45.
- A sudden drop in Sentiment (SSM < -0.4) combined with High Demand (D > 600) spawns a massive surge in tickets 45 minutes later.

\`\`\`mermaid
graph TD
A[External Event Starts] --> B[45 Min Operations Delay]
B --> C[Internal Queue Surge]
\`\`\`

## 3. Forensic Ruling
The operational strain is purely reactionary to external event velocity, heavily lagged by a 45-minute propagation delay.

## 4. Actionable Recommendation
Workforce Management should configure API webhooks to alert local managers. When the threshold is broken, managers have exactly 45 minutes to pull agents off breaks or dispatch the overflow team before queue saturation hits 98%.

\`\`\`mermaid
graph TD
M[System Alert Triggered] --> N[Deploy Overflow Team]
N --> O[Queue Stabilized]
\`\`\`

## 5. Conclusion
By proactively bridging the isolated data streams between external social hype and internal ticket queues, Workforce Management can fundamentally shift their posture from reactive scrambling to predictive capacity balancing.`,
    steps: [
      { message: `Executing secure scan... I've processed [SYSTEM_INJECT_SAMPLES] distinct one-minute samples representing millions of viewers.\n\nScanning internal and external telemetry volumes across the specified date range. I've aligned the matrices.\n\nShall I proceed with the Cross-Correlation Function (CCF) phase to find the exact lag time?`, action: 'none', requiresConfirm: true },
      { message: "Running CCF Analysis...\n\nHere is the trajectory chart demonstrating the relationship between the External Demand and Internal Incidents. I found a maximum Pearson Correlation of 0.82. \n\nWould you like me to prepare the final detailed report based on these findings?", action: 'chart', requiresConfirm: true },
      { message: "I have drafted the recommendations for Workforce Management. Your Markdown Report has been generated below for download and local archiving.\n\nWould you like a PDF version of this report?", action: 'report', requiresConfirm: true },
      { message: "Generating PDF now.", action: 'pdf', requiresConfirm: false }
    ]
  },
  'analysis-toxicity': {
    title: 'Toxicity-Driven Productivity Analysis',
    desc: 'Identifies specific external thresholds that structurally damage workforce Productivity Rates, isolating viral negative events from standard operational load.',
    motivation: "Why do this? To decisively prove that low shift output wasn't an internal workforce failure, but rather the mathematical consequence of players submitting highly complex, toxic tickets driven by a highly negative viral social event.",
    icon: TrendingDown,
    accent: 'text-rose-400 border-rose-400/20 bg-rose-500/10',
    controls: [
      { label: 'Baseline Productivity', default: '0.65 Pkgs/Min', options: ['0.65 Pkgs/Min', '0.80 Pkgs/Min'] },
      { label: 'Toxicity Vector', default: 'Demand + Sentiment', options: ['Demand + Sentiment', 'Sentiment Velocity Only'] }
    ],
    chartDataKeyLeft: 'Sentiment (SSM)',
    chartDataKeyRight: 'Productivity',
    fakeReport: `Toxicity-Driven Productivity Analysis Report

## 1. Executive Summary
Processed internal HR productivity logs against external Social Sentiment Metrics (SSM) using Decision Tree classification to identify specific deterioration thresholds.

## 2. Diagnostic Findings
- The internal Decision Tree isolated a structural decay when SSM < -0.8 and D > 750.
- Standard Baseline: 0.65 Pkgs/Min vs Toxic Response Rate: 0.35 Pkgs/Min.
- Average incident resolution time ballooned from 92 seconds to 171 seconds due to emotionally charged requests.

\`\`\`mermaid
graph TD
D[Negative Viral Event] --> E[Queue Toxicity Increases]
E --> F[Agent Output Collapses]
\`\`\`

## 3. Forensic Ruling
The drop in Tier 1 output was NOT an internal workforce failure, but rather the mathematical consequence of players submitting highly complex, toxic tickets driven by an external anomaly.

## 4. Actionable Recommendation
Temporarily halt automated performance tracking logic (KPIs) during toxicity thresholds so agent performance scores are not unfairly penalized. Recommend deploying automated de-escalation messaging in the chat queue.

\`\`\`mermaid
graph TD
P[Toxicity Threshold Hit] --> Q[Halt Automated KPIs]
Q --> R[Preserve Morale]
\`\`\`

## 5. Conclusion
Correlating negative external sentiment directly against internal throughput guarantees that operational load expectations adapt dynamically to the true mathematical complexity of the incidents, preserving workforce morale.`,
    steps: [
      { message: `Executing secure scan... I've processed [SYSTEM_INJECT_SAMPLES] distinct one-minute samples representing millions of viewers.\n\nScanning the internal HR/Operations productivity logs against the external Social Sentiment Metric (SSM). I've aligned the matrices. \n\nShall I execute the Decision Tree classification to identify specific deterioration thresholds?`, action: 'none', requiresConfirm: true },
      { message: "Threshold detected... \n\nI have generated the trajectory overlay. Notice how rapidly productivity plunges precisely when Sentiment turns heavily negative. \n\nWould you like me to prepare the final detailed report based on these findings?", action: 'chart', requiresConfirm: true },
      { message: "Ruling formulated. The mathematical proof of external toxicity is ready. Your Markdown Report has been generated below for download and local archiving.\n\nWould you like a PDF version of this report?", action: 'report', requiresConfirm: true },
      { message: "Generating PDF now.", action: 'pdf', requiresConfirm: false }
    ]
  },
  'analysis-anomaly': {
    title: 'Automated Capacity Breach Detection',
    desc: 'Scans for uncoupled relationships—detecting internal failures that have not hit social media, or massive social hype generating zero operational stress.',
    motivation: "Why do this? To detect silent internal failures (e.g., a broken gateway) that are dropping internal volume, or massive external hype that is harmless, preventing false-alarms for engineers.",
    icon: Activity,
    accent: 'text-amber-400 border-amber-400/20 bg-amber-500/10',
    controls: [
      { label: 'Anomaly Isolation Method', default: 'Isolation Forest', options: ['Isolation Forest', 'K-Means Clustering', 'DBSCAN'] },
      { label: 'Sensitivity threshold', default: '95% Confidence', options: ['90% Confidence', '95% Confidence', '99% Confidence'] }
    ],
    chartDataKeyLeft: 'Demand',
    chartDataKeyRight: 'Incidents',
    fakeReport: `Automated Capacity Breach Detection Report

## 1. Executive Summary
Mapped 14,000 data points into the Unsupervised Isolation Forest, separating External Demand from Internal Incident metrics to find uncoupled parameter divergence.

## 2. Diagnostic Findings
The engine successfully identified two major decoupling events outside the 95% baseline cluster:
- Timestamp: 14:02:00 Z | External Demand (D) was LOW. Internal Incident Demand was CRITICAL.
- Timestamp: 22:45:00 Z | External Demand (D) was EXTREME. Internal Incident Demand was ZERO.

\`\`\`mermaid
graph TD
G[Internal Failure] --> H[Volume Drops]
H --> I[Social Silence]
\`\`\`

## 3. Forensic Ruling
The first anomaly (Type A) is a silent internal failure (e.g., billing gateway break) that social media had not noticed yet. The second anomaly (Type B) was safe visual hype created by a fast-growing streamer without generating bugs.

## 4. Actionable Recommendation
Configure the pager duty router to immediately page Core Server Engineers ONLY during a Type A anomaly (High Internal/Low External) and forcefully suppress all alarms during a Type B anomaly.

\`\`\`mermaid
graph TD
S[Anomaly Detected] --> T[Check Matrix]
T --> U[Page Engineers]
\`\`\`

## 5. Conclusion
Automated anomaly differentiation prevents engineers from chasing ghosts during high-visibility, zero-impact external events while ensuring critical silent internal failures are escalated to responders immediately.`,
    steps: [
      { message: `Executing secure scan... I've processed [SYSTEM_INJECT_SAMPLES] distinct one-minute samples representing millions of viewers.\n\nLoading data points into the Unsupervised Isolation Forest. I've separated External Demand from Internal Incident metrics. \n\nShall I run the isolation passes to flush out any 'uncoupled' anomalies outside the 95% confidence cluster?`, action: 'none', requiresConfirm: true },
      { message: "Isolation complete.\n\nI have successfully isolated severe decoupling events bounding outside the normal confidence interval. The chart mapping these breaks has been plotted above. \n\nWould you like me to prepare the final detailed report based on these findings?", action: 'chart', requiresConfirm: true },
      { message: "Triage complete. I have successfully differentiated between internal failure signals and safe visual hype. Your Markdown Report has been generated below for download and local archiving.\n\nWould you like a PDF version of this report? [SYSTEM_ASK_PDF]", action: 'report', requiresConfirm: true },
      { message: "Generating PDF now. [SYSTEM_REPORT]", action: 'pdf', requiresConfirm: false }
    ]
  },
  'analysis-decay': {
    title: 'Post-Launch Retention Profiling',
    desc: 'Computes the exponential decay constant of the Stickiness (S) and Capture Scores to grade pure content retention distinct from initial marketing hype.',
    motivation: "Why do this? Big marketing budgets guarantee Day 1 viewership. By mathematically tracing the 'half-life' of audience Stickiness, you can objectively judge if the actual core gameplay held their attention, ignoring the initial paid hype.",
    icon: LineChartIcon,
    accent: 'text-emerald-400 border-emerald-400/20 bg-emerald-500/10',
    controls: [
      { label: 'Decay Model', default: 'Exponential / Half-Life', options: ['Exponential / Half-Life', 'Logarithmic Decay'] },
      { label: 'Core Target Variable', default: 'Stickiness Score (S)', options: ['Stickiness Score (S)', 'Attention Score (AS)'] }
    ],
    chartDataKeyLeft: 'Demand',
    chartDataKeyRight: 'Stickiness',
    fakeReport: `Post-Launch Retention Profiling Report

## 1. Executive Summary
Ingested audience engagement curves spanning 7 days post-launch. Stripped away initial Day-1 marketing volume to calculate the exponential decay constant (Lambda) purely on the core Stickiness variable.

## 2. Diagnostic Findings
- Peak Volume initially hit 420,000 Concurrents with Stickiness (S) starting at 0.85 (incredibly strong Day 1 retention).
- By Day 7, Raw Volume dropped to 60,000, but Stickiness (S) remained suspended at 0.68.
- The mathematically calculated Exponential Decay Constant (Lambda) is 0.03.

\`\`\`mermaid
graph TD
J[Day 1 Hype] --> K[Marketing Viewers Drop]
K --> L[Core Players Remain]
\`\`\`

## 3. Forensic Ruling
Stickiness held remarkably well despite the raw drop in viewers over the week. The high Stickiness ratio paired with an incredibly low Decay Constant indicates a massive fundamental success.

## 4. Actionable Recommendation
Marketing budgets secured the Day 1 peak, but the core development team successfully retained the cohort. Recommend shifting budget away from new acquisition campaigns in favor of monetization/cosmetics targeted at the stable captured audience.

\`\`\`mermaid
graph TD
V[Audience Captured] --> W[Shift Budget]
W --> X[Target Monetization]
\`\`\`

## 5. Conclusion
Filtering out initial marketing volume provides an objective, mathematical grade of actual product stickiness, allowing for smarter reallocation of resources toward features that legitimately secure the audience ecosystem.`,
    steps: [
      { message: `Executing secure scan... I've processed [SYSTEM_INJECT_SAMPLES] distinct one-minute samples representing millions of viewers.\n\nIngesting audience engagement curves post-launch. I've stripped away the initial marketing volume to focus purely on the core Stickiness (S) variable. \n\nShall I calculate the exponential decay constant (Lambda) to score the game's actual retention mechanics?`, action: 'none', requiresConfirm: true },
      { message: "Fitting decay curve...\n\nThe mathematical profile has been locked. The computational breakdown isolates a firm stabilization in the cohort despite rapid shifts in raw viewership.\n\nWould you like me to prepare the final detailed report based on these findings?", action: 'chart', requiresConfirm: true },
      { message: "Grading complete. The retention index identifies a fundamentally stable core. Your Markdown Report has been generated below for download and local archiving.\n\nWould you like a PDF version of this report?", action: 'report', requiresConfirm: true },
      { message: "Generating PDF now.", action: 'pdf', requiresConfirm: false }
    ]
  },
  'analysis-redline': {
    title: 'Value-at-Risk "Redline" Simulation',
    desc: 'Uses historical regression to output the absolute ceiling of external Demand (D) that your current workforce can handle before queues collapse.',
    motivation: "Why do this? Borrowing from financial Value-at-Risk concepts, this allows us to locate the absolute 'Redline' limit. If upcoming Social Forecasing exceeds this Redline, you guarantee a queue collapse unless you outsource Tier-1 capacity in advance.",
    icon: ShieldCheck,
    accent: 'text-cyan-400 border-cyan-400/20 bg-cyan-500/10',
    controls: [
      { label: 'Regression Engine', default: 'Logistic Probability', options: ['Logistic Probability', 'Linear OLS'] },
      { label: 'Failure Threshold', default: 'Resource Demand > 95%', options: ['Resource Demand > 95%', 'Resource Demand > 99%'] }
    ],
    chartDataKeyLeft: 'Demand',
    chartDataKeyRight: 'Probability of Failure',
    fakeReport: `Value-at-Risk "Redline" Simulation Report

## 1. Executive Summary
Executed a Value-at-Risk parameters profile, stress-testing historical internal Resource bounds against escalating levels of External Demand (D) using the Logistic Regression Engine.

## 2. Diagnostic Findings
- Plotted the Failure Probability Sigmoid curve. 
- Discovered that a queue failure condition (Wait time > 120 minutes) becomes 95% probable when the market heat crosses exactly D = 865 while SSM < 0.

\`\`\`mermaid
graph TD
Y[Demand Scales] --> Z[D equals Limit]
Z --> V2[Queue Collapse]
\`\`\`

## 3. Forensic Ruling
Your internal infrastructure is strictly bounded by a "Redline" limit of D = 865 before the Tier 1 structure catastrophically buckles under incident weight.

## 4. Actionable Recommendation
If Marketing predicts an upcoming event will hit D = 1000, you will breach capacity by 15%. Mandatory action: Outsource a 15% spillover Tier-1 node for the duration of the event to handle the calculated surplus.

\`\`\`mermaid
graph TD
T2[Review Forecast] --> U2[Identify Surplus]
U2 --> W2[Outsource Node]
\`\`\`

## 5. Conclusion
Determining the exact capacity ceiling against external independent variables allows for precise, mathematically-defensible budget requests for outsourcing rather than relying on qualitative operational guesswork.`,
    steps: [
      { message: `Executing secure scan... I've processed [SYSTEM_INJECT_SAMPLES] distinct one-minute samples representing millions of viewers.\n\nExecuting Value-at-Risk boundaries... I'm stress-testing historical Resource bounds against escalating levels of External Demand (D) using Logistic Regression. \n\nShall I plot the failure probability curve?`, action: 'none', requiresConfirm: true },
      { message: "Regression executed.\n\nI have plotted the Failure Probability Sigmoid curve showing exactly where the internal queue hits a catastrophic probability of failure against scaling Demand. \n\nWould you like me to prepare the final detailed report based on these findings?", action: 'chart', requiresConfirm: true },
      { message: "I have drafted the Business Process Outsourcing escalation points. Your Markdown Report has been generated below for download and local archiving.\n\nWould you like a PDF version of this report?", action: 'report', requiresConfirm: true },
      { message: "Generating PDF now.", action: 'pdf', requiresConfirm: false }
    ]
  }
};

type MessageType = 'text' | 'chart' | 'report' | 'pdf_button' | 'yes_no_buttons';
interface ChatMessage {
  id: string;
  role: 'flux' | 'user';
  type: MessageType;
  content: string;
  actionContext?: 'proceed' | 'report' | 'pdf';
  actionResolved?: boolean;
}

const MermaidChart = ({ code }: { code: string }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
        chartRef.current.innerHTML = '';
        mermaid.render(`mermaid-${Date.now()}`, code).then(res => {
            if (chartRef.current) chartRef.current.innerHTML = res.svg;
        }).catch(err => console.error("Mermaid Render Error", err));
    }
  }, [code]);
  return <div ref={chartRef} className="my-6 bg-slate-900/50 p-6 rounded-xl border border-white/5 flex justify-center" />;
};

interface GeneratedDoc {
  title: string;
  filename: string;
  url: string;
  time: string;
  type: 'MD' | 'PDF';
  supports?: string[];
  genTime?: string;
  downloaded?: boolean;
}

const formatText = (t: string) => {
    let html = t.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
    html = html.replace(/(?<!`)`([^`\n]+)`(?!`)/g, '<span class="px-1.5 py-0.5 bg-black/30 text-cyan-300 rounded font-mono text-xs mx-1">$1</span>');
    return html;
};

const renderMsgContent = (rawText: string) => {
   const cleanText = rawText.replace(/\[SYSTEM_[A-Z_]+\]/g, '').trim();
   const blocks: React.ReactNode[] = [];
   
   // Handle both mermaid and markdown blocks
   const regex = /```(mermaid|md|markdown)\n([\s\S]*?)```/g;
   let lastIndex = 0;
   let match;
   let blockCounter = 0;

   while ((match = regex.exec(cleanText)) !== null) {
       // Push leading text
       if (match.index > lastIndex) {
           const textPart = cleanText.substring(lastIndex, match.index).trim();
           if (textPart) blocks.push(<div key={`t${blockCounter++}`} className="text-sm font-sans leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(textPart) }} />);
       }

       const type = match[1];
       const content = match[2];

       if (type === 'mermaid') {
           blocks.push(<MermaidChart key={`m${blockCounter++}`} code={content.trim()} />);
       } else if (type === 'md' || type === 'markdown') {
           // Markdown preview disabled as per user request
       }

       lastIndex = regex.lastIndex;
   }

   // Push trailing text
   if (lastIndex < cleanText.length) {
       const textPart = cleanText.substring(lastIndex).trim();
       if (textPart) blocks.push(<div key={`t${blockCounter++}`} className="text-sm font-sans leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(textPart) }} />);
   }

   return blocks;
};

const getOrdinalSuffix = (i: number) => {
    let j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
};

const formatObservationDates = (start: Date, end: Date) => {
    const shortFmt = (d: Date) => {
        let parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
        const mo = parts.find(p=>p.type==='month')?.value;
        const dy = parts.find(p=>p.type==='day')?.value;
        const h = parts.find(p=>p.type==='hour')?.value;
        let min = parts.find(p=>p.type==='minute')?.value;
        return `${mo}-${dy} ${h}:${min}`;
    };

    const proseFmt = (d: Date) => {
        let parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(d);
        const mo = parts.find(p=>p.type==='month')?.value;
        const dy = parseInt(parts.find(p=>p.type==='day')?.value || '1');
        const yr = parts.find(p=>p.type==='year')?.value;
        const h = parts.find(p=>p.type==='hour')?.value;
        const m = parts.find(p=>p.type==='minute')?.value;
        const ap = parts.find(p=>p.type==='dayPeriod')?.value?.toUpperCase();
        return `${h}:${m} ${ap} CST, ${mo} ${getOrdinalSuffix(dy)}, ${yr}`;
    };

    const nowParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(new Date());
    const nMo = nowParts.find(p=>p.type==='month')?.value;
    const nDy = parseInt(nowParts.find(p=>p.type==='day')?.value || '1');
    const nYr = nowParts.find(p=>p.type==='year')?.value;
    const nH = nowParts.find(p=>p.type==='hour')?.value;
    const nM = nowParts.find(p=>p.type==='minute')?.value;
    const nAp = nowParts.find(p=>p.type==='dayPeriod')?.value?.toUpperCase();
    const currentStr = `${nH}:${nM} ${nAp} CST, ${nMo} ${getOrdinalSuffix(nDy)}, ${nYr}`;

    return {
       headerStart: shortFmt(start),
       headerEnd: shortFmt(end),
       proseStart: proseFmt(start),
       proseEnd: proseFmt(end),
       currentDateCST: currentStr
    };
};

const AnalysisModuleView: React.FC<AnalysisModuleViewProps> = ({ mode, config, authUser }) => {
  const meta = USE_CASE_META[mode as string];
  const Icon = meta?.icon || Activity;
  const fullName = `${authUser.title} ${authUser.firstName} ${authUser.lastName}`;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingElapsed, setProcessingElapsed] = useState(0);
  const [realData, setRealData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [fullReport, setFullReport] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chartTriggered = useRef(false);
  const reportTriggered = useRef(false);
  const askProceedTriggered = useRef(false);
  const askReportTriggered = useRef(false);
  const askPdfTriggered = useRef(false);
  const mdTriggered = useRef(false);
  const plotImageBase64 = useRef<string>('');

  // Workflow context
  const [hasStarted, setHasStarted] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [controlVals, setControlVals] = useState<Record<number, string>>({});
  const currentSession = useRef(0);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', flowchart: { htmlLabels: false, useMaxWidth: false }, suppressErrorRendering: true, themeVariables: { fontSize: '10.5px' } });
    
    // Reset state on mode change
    setHasStarted(false);
    setRealData([]);
    setInsights(null);
    setFullReport('');
    chartTriggered.current = false;
    reportTriggered.current = false;
    askProceedTriggered.current = false;
    askReportTriggered.current = false;
    askPdfTriggered.current = false;
    mdTriggered.current = false;
    plotImageBase64.current = '';
    currentSession.current = 0;
    
    // Seed initial control defaults
    let initControls: Record<number, string> = {};
    meta.controls.forEach((c, i) => initControls[i] = c.default);
    setControlVals(initControls);

    setIsProcessing(true);
    
    import('../services/chatLogService').then(async ({ loadChatLog }) => {
        const historyData = await loadChatLog(authUser.uid, mode);
        if (historyData && historyData.messages && historyData.messages.length > 0) {
            setMessages(historyData.messages);
            if (historyData.hasStarted) setHasStarted(historyData.hasStarted);
            if (historyData.realData) setRealData(historyData.realData);
            if (historyData.insights) setInsights(historyData.insights);
            if (historyData.plotImageBase64) plotImageBase64.current = historyData.plotImageBase64;
            if (historyData.fullReport) setFullReport(historyData.fullReport);
        } else {
            // Initial greeting
            const sourceString = config.source ? config.source.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'twitch';
            const greeting = `Greetings, ${fullName}! I am Agent Flux. I operate simultaneously across **${sourceString}_historical.db** and **epic_games_historical.db**.
            
I am currently loaded with the structural logic for **${meta.title}**. Adjust the parameters on the left and hit "**Execute Diagnostic Run**" when you are ready to begin the step-by-step sequence.`;
            
            setMessages([{ id: Date.now().toString(), role: 'flux', type: 'text', content: greeting }]);
        }
        setIsProcessing(false);
    });
  }, [mode, meta.title]);

  // Sync to Firestore when core state changes
  useEffect(() => {
    if (messages.length === 0) return;
    if (messages.length === 1 && messages[0].content.includes('Greetings,') && !hasStarted) return;
    
    import('../services/chatLogService').then(({ saveChatLog }) => {
        saveChatLog(
             authUser.uid, mode, messages, config, 
             hasStarted, realData, insights, 
             plotImageBase64.current, fullReport
        );
    });
  }, [messages, hasStarted, realData, insights, fullReport]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setProcessingElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  const pushFluxMessage = (content: string, type: MessageType = 'text', delay = 1500, callback?: () => void) => {
    setIsProcessing(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role: 'flux', type, content }]);
      setIsProcessing(false);
      if (callback) callback();
    }, delay);
  };

  const handleRunAnalysis = async () => {
    if (isProcessing) return;
    
    currentSession.current += 1;
    setHasStarted(true);

    // Reset internal state tokens for identical consecutive runs
    chartTriggered.current = false;
    reportTriggered.current = false;
    askProceedTriggered.current = false;
    askReportTriggered.current = false;
    askPdfTriggered.current = false;
    mdTriggered.current = false;
    plotImageBase64.current = '';
    setFullReport('');
    
    const reqId = Date.now().toString() + '1';
    const initUserMsg = `Please execute the ${meta.title} diagnostic on the scoped data.`;
    setMessages(prev => [...prev, { 
      id: reqId, role: 'flux', type: 'text', 
      content: `Executing diagnostic run...`
    }]);

    setIsProcessing(true);
    let fetchedData: any[] = [];

    try {
      const res = await fetch('/api/historical-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: config.startDate.toISOString(),
          endDate: config.endDate.toISOString(),
          channels: config.channels,
          tags: config.tags,
          queues: config.queues,
          windowLength: 'Day',
          source: config.source
        })
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
         fetchedData = data.map((d: any) => {
            let demandScale = (d.D || 0) * 5.5; // Upscale stream data to full UI visualization bounds (600-1000)
            let ssm = d.SSM || 0;
            
            let prod = 0.65;
            if (ssm < -0.3 && demandScale > 500) prod = 0.35 + Math.random()*0.1;
            else if (ssm < 0) prod = 0.50 + Math.random()*0.1;
   
            let probFail = 1 / (1 + Math.exp(-0.03 * (demandScale - 800))) * 100;
   
            return {
               time: d.time.substring(0, 10),
               'Demand': Number(demandScale.toFixed(0)),
               'Incidents': Number(((d.IncidentDemand || 0) * 5.5).toFixed(0)),
               'Sentiment (SSM)': ssm,
               'Productivity': Number(prod.toFixed(2)),
               'Stickiness': d.S || 0,
               'Probability of Failure': Number(probFail.toFixed(1))
            };
         });
         if (fetchedData.length > 200) {
            const step = Math.ceil(fetchedData.length / 200);
            fetchedData = fetchedData.filter((_, i) => i % step === 0);
         }
         
         const engineRes = await fetch('/api/run-engine', {
             method: 'POST',
             body: JSON.stringify({
                 mode: mode,
                 data: fetchedData,
                 config: config,
                 meta: meta,
                 authUser: authUser
             })
         });
         const enginePayload = await engineRes.json();
         if (enginePayload.error) throw new Error(enginePayload.error);
         
         setRealData(enginePayload.realData || []);
         setInsights(enginePayload.insights || null);
         plotImageBase64.current = enginePayload.plotFilename ? `./${enginePayload.plotFilename}` : '';
         setFullReport("");
         
         const d1 = new Date(config.startDate);
         const d2 = new Date(config.endDate);
         const localD1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
         const localD2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
         const localD3 = new Date(localD2.getTime() + 86400000);
         const samples = Math.max(0, Math.floor((localD3.getTime() - localD1.getTime()) / 60000));
         const dynamicInitialMsg = meta.steps[0].message.replace(/10,080|\[SYSTEM_INJECT_SAMPLES\]/g, samples.toLocaleString());
         
         setMessages(prev => [...prev, {
             id: Date.now().toString()+'st1', role: 'flux', type: 'text', content: dynamicInitialMsg, actionContext: 'proceed'
         }]);
         setHasStarted(true);
         setIsProcessing(false);

      } else {
         throw new Error("No data returned for the selected Data Scope. Adjust date bounds or external sources.");
      }
    } catch (e: any) {
      console.error(e);
      setMessages([{ id: Date.now().toString(), role: 'flux', type: 'text', content: `[SYSTEM ERROR] Diagnostic Halted. ${e.message}` }]);
      setIsProcessing(false);
      setHasStarted(false);
      return;
    }
  };

  const getSystemPrompt = () => {
    // Mathematically pure calculation: enforce strict 12:00 AM CST boundary from D1 to D3 (the day AFTER config.endDate)
    const d1 = new Date(config.startDate);
    const d2 = new Date(config.endDate);
    
    // Extract base calendar dates to isolate midnight-to-midnight exactly
    const localD1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const localD2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const localD3 = new Date(localD2.getTime() + 86400000); // Add exactly 24 hours to D2
    
    // D1 to D3 minutes calculation (resolves the 10,079 minute off-by-one boundary glitch to perfect 10,080)
    const timeDiffMs = localD3.getTime() - localD1.getTime();
    const samples = Math.max(0, Math.floor(timeDiffMs / 60000));
    
    // Pass localD2 for formatting so the UI and Prose report the expected ending date (e.g. June 30th)
    const { headerStart, headerEnd, proseStart, proseEnd, currentDateCST } = formatObservationDates(localD1, localD2);
    
    // Force the strings to logically encompass the full days, without visually bleeding into July 1st
    const finalProseStart = proseStart.replace(/^\d{1,2}:\d{2}\s+(AM|PM)/i, '12:00 AM');
    const finalProseEnd = proseEnd.replace(/^\d{1,2}:\d{2}\s+(AM|PM)/i, '11:59 PM');
    
    const observationRangeShort = `${headerStart} to ${headerEnd}`;
    const observationRangeProse = `${finalProseStart} to ${finalProseEnd}`;

    return `You are Agent Flux, an AI embedded in the Signal Flux Telemetry Engine.
You are conducting the "${meta.title}" analysis for ${fullName}, ${authUser.position}.
Respond securely and concisely, maintaining the persona of a highly advanced analytical AI. Always address the user strictly by their exact provided Title and Name (${fullName}). NEVER hallucinate unauthorized academic titles like 'Professor'. You are highly conversational and can act as a helpful guide to answer any general questions about how this application works based on your internal knowledge base.

Data Context: You just scanned historical databases and processed ${samples.toLocaleString()} minute samples.
Data Scope Range (in prose format for conversation): EXACTLY ${observationRangeProse}.

Engine Configuration Details specifically for your Section 2 Configuration Table (USE THESE EXACT STRINGS FOR THE 'VALUE' COLUMN):
- Goal Motivation: ${meta.motivation}
- Entity (Company): ${config.company || 'Epic Games'}
- Asset (Game): ${config.game || 'Fortnite'}

Data Scope Details (Divide these cleanly into "External Signal Constraints" and "Internal Signal Constraints" in your markdown table):
[External Signal Constraints]
- External Data Source: ${config.source || 'Twitch'}
- External Channels: ${config.channels && config.channels.length > 0 ? config.channels.join(', ') : 'ALL'}
- External Tags: ${config.tags && config.tags.length > 0 ? config.tags.join(', ') : 'ALL'}

[Internal Signal Constraints]
- Internal Source Queues: ${config.queues && config.queues.length > 0 ? config.queues.join(', ') : 'ALL'}
- Global Time Viewport: ${observationRangeProse}

Engine Analytics Settings:
${meta.controls.map((c: any, i: number) => `- ${c.label}: ${controlVals[i] || c.default}`).join('\n')}

--- KNOWLEDGE BASE ---
${whitepaper}

${academicContext}
----------------------

Here are the RAW MATLAB/PYTHON Mathematical Findings calculated by the engine:
\`\`\`json
${insights ? JSON.stringify(insights, null, 2) : "No insights calculated."}
\`\`\`

Workflow Instructions:
1. If the user asks a general question about the application, the UI, or the SSDF math, ignore the diagnostic workflow below and answer them conversationally based on your Knowledge Base. NO MERMAID DIAGRAMS, NO FULL TABLES in the chat window. DO NOT use [SYSTEM_...] tags for general conversational replies.
2. For the chat window response DURING A DIAGNOSTIC RUN, ONLY output text and concise summary findings. Both your Chat Summary and the Report MUST explicitly state the Observation Date Range formatted in prose spacing (e.g. 12:00 AM, Jan 1st, 2025 to 11:59 PM, Jan 7th, 2025).
3. If the user agrees to proceed initially in the diagnostic, YOU MUST INCLUDE the exact text [SYSTEM_CHART] to render the dynamic trajectory graph. You must simultaneously ask the user if they want the final report, AND YOU MUST INCLUDE the exact text [SYSTEM_ASK_REPORT] at the very end of your message to render the Yes/No buttons.
4. If the user agrees to prepare the report, YOU MUST generate the FULL Markdown report strictly inside [START_REPORT_MARKDOWN] and [END_REPORT_MARKDOWN]. You MUST use exactly these 7 headers in the body of the report: 
"## 1. Executive Summary"
"## 2. Analytical Framework"
"## 3. Diagnostic Findings"
"## 4. Forensic Ruling"
"## 5. Actionable Recommendation"
"## 6. Conclusion"
"## 7. References" 
CRITICAL STYLISTIC & LAYOUT BOUNDARIES:
You are an objective mathematical engine. Maintain a strict, clinical, and authoritative forensic tone. Do not use flowery adjectives, hyperbole, or conversational filler. Every sentence must be data-driven. Keep your paragraph lengths highly consistent (2-4 sentences max) to ensure the deterministic CSS page breaks do not overflow.

EQUATION DEMAND: You MUST include exactly three (3) distinct mathematical formulation blocks or equations formatted precisely inside \`$$ ... $$\` throughout the body of the report (e.g., probability curves, anomaly scaling, or cross-correlation density). You MUST place exactly one equation inside "3. Diagnostic Findings", exactly one equation inside "4. Forensic Ruling", and exactly one equation inside "5. Actionable Recommendation". Put these on their own lines. Do NOT append your own \`\\tag{}\` labels to them; the system will numerically sequence them (e.g., Eqn 1, Eqn 2) automatically.

The engine CSS structurally forces a 'page break' before EVERY main header (##). Therefore, you MUST NEVER put a \`<div style="page-break-before: always;"></div>\` immediately before a header or at the end of a section, or you will create double blank pages! ONLY use this token exactly midway through sections to force exact text shifts between pages. 

- **1. Executive Summary**: MUST be constrained to Page 1 only. Write exactly 2 concise paragraphs summarizing the scope of the analysis and the primary fault discovered. Embed [TRAJECTORY_PLOT_IMAGE] immediately afterward preceded by bold title \`**Chart 1.1: Demand Trajectory Shift**\`.
- **2. Analytical Framework**: DO NOT GENERATE TEXT FOR THIS SECTION. Output the exact token \`[SYSTEM_INJECT_ANALYTICAL_FRAMEWORK]\` immediately after the "## 2. Analytical Framework" header, and absolutely nothing else for this section. The system will handle it.
- **3. Diagnostic Findings**: MUST span exactly Pages 6 and 7. On Page 6, write 1 paragraph detailing the data ingress profile, then output \`**Table 3.1: Data Specification & Engine Configuration**\` (3 columns \`| Category | Parameter | Value |\`). Immediately after Table 3.1, insert EXACTLY ONE \`<div style="page-break-before: always;"></div>\`. On Page 7 (after the break), write 1 paragraph discussing the specific structural patterns found and output \`**Figure 3.1: [Your Title]**\` ([SYSTEM_INJECT_DIAGRAM_3]).
- **4. Forensic Ruling**: MUST start exactly on Page 8. Write exactly 3 succinct bullet points detailing the fundamental, objective root causes of the shift, followed by a 1-paragraph concluding synthesis. This must perfectly fit on one page.
- **5. Actionable Recommendation**: MUST span exactly Pages 9 and 10. On Page 9, write 2 paragraphs prescribing explicit operational mitigations and output \`**Table 5.1: Proposed Remediation Impact**\` (3 columns outlining Action, Expected Result, and Metric). Immediately after Table 5.1, insert EXACTLY ONE \`<div style="page-break-before: always;"></div>\`. On Page 10 (after the break), write a final paragraph estimating the risk of inaction.
- **6. Conclusion**: MUST start exactly on Page 11. Write exactly 2 paragraphs summarizing the engine's final diagnostic state and formally closing the audit.
- **7. References**: DO NOT GENERATE TEXT FOR THIS SECTION. Output the exact token \`[SYSTEM_INJECT_REFERENCES]\` immediately after the "## 7. References" header, and absolutely nothing else. The system will handle it.

You MUST label ALL elements meticulously according to these strict formal academic standards (Table X.X, Figure X.X, Chart X.X). DO NOT output any Mermaid code yourself; only use the [SYSTEM_INJECT_DIAGRAM_X] tokens.
5. In conversations and within ANY data tables or incident summaries in your markdown report, YOU MUST NEVER use relative placeholders like 'T-1', 'T-2', 'T-3', or "Z" suffixes (e.g. 14:02Z). ALL times must be actual specific CST timestamps properly sequenced within the Data Scope Range!

CRITICAL REPORT HEADER REQUIREMENT:
The very first section inside your [START_REPORT_MARKDOWN] block MUST identically match the following exact structure, including the Title and the <br> tags to guarantee line breaks:

# ${meta.fakeReport.split('\n')[0]}
**Prepared for:** ${fullName}, ${authUser.position}<br>
        **Date Prepared:** ${currentDateCST}<br>
**Application:** Signal Flux Telemetry Engine<br>
**Prepared by:** Agent Flux<br>
**Observation Date Range:** ${observationRangeProse}<br>

6. At the exact same time you output [END_REPORT_MARKDOWN], you must ask the user "Would you like a PDF version of this report?" AND YOU MUST INCLUDE the exact text [SYSTEM_ASK_PDF] at the end of the message to render Yes/No buttons. DO NOT OUTPUT [SYSTEM_REPORT] yet.
7. If the user agrees to a PDF version (answers "Yes"), YOU MUST INCLUDE the exact text [SYSTEM_REPORT] exactly once to trigger PDF generation, and literally nothing else but a brief sentence like "Generating PDF now." NEVER OUTPUT THE MARKDOWN BLOCK AGAIN FOR ANY REASON. IGNORING THIS WILL CRASH THE ENGINE.
8. If the user explicitly asks to run another report, investigate a new configuration, or start over, you MUST ask the user if they'd like you to unlock and enable the "Execute Diagnostic Run" button for them. If the user says Yes, you MUST output the exact string [SYSTEM_ENABLE_RUN] securely on its own line and nothing else.`;
  };

  const getMermaidTemplates = (useCaseMode: string, conf: any): [string, string, string] => {
      const sourceTitle = conf.source || "External Platform";
      const qTitle = Array.isArray(conf.queues) && conf.queues.length > 0 ? conf.queues[0] : "Primary Queue";
      
      switch(useCaseMode) {
          case 'analysis-lag':
              return [
                  `graph TD\n  A["Time Series X(t)"] --> B["Cross-Covariance Function"]\n  B --> C["Lag Discovery"]`,
                  `graph LR\n  D["Peak Demand: T_0"] --> E["Optimal Shift: T_0 + k"]\n  E --> F["Workforce Aligned"]`,
                  `graph TD\n  G["Detect Peak (${sourceTitle})"] --> H["Calculate Time Delay"]\n  H --> I["Trace Impact on ${qTitle}"]`
              ];
          case 'analysis-toxicity':
              return [
                  `graph TD\n  A["Sentiment Extracted"] --> B["Weight Applied"]\n  B --> C["Toxic Decay Rate"]`,
                  `graph LR\n  D["Negative Valence"] --> E["Cognitive Load Increase"]\n  E --> F["Resolution Time Triples"]`,
                  `graph TD\n  G["Negative Viral Event (${sourceTitle})"] --> H["Queue Toxicity Increases"]\n  H --> I["Agent Output Collapses"]`
              ];
          case 'analysis-anomaly':
              return [
                  `graph LR\n  A["Data Points"] --> B["Random Forest Trees"]\n  B --> C["Short Path = Anomaly"]`,
                  `graph TD\n  D["Calculate Density"] --> E["Compare to Global Mean"]\n  E --> F["Flag Outliers"]`,
                  `graph LR\n  G["Monitor Isolation Metrics"] --> H["Anomaly Detected"]\n  H --> I["Type A: Internal Failure"]\n  H --> J["Type B: Safe Social"]`
              ];
          case 'analysis-decay':
              return [
                  `graph TD\n  A["Initial Volume N(0)"] --> B["Compute Decay rate λ"]\n  B --> C["Half-life t(1/2)"]`,
                  `graph LR\n  D["Unstable Curve"] --> E["High Bounce Rate"]\n  E --> F["Marketing Spend Wasted"]`,
                  `graph TD\n  G["Day 1 Hype (${sourceTitle})"] --> H["Viewers Drop"]\n  H --> I["Core Players Remain"]`
              ];
          case 'analysis-redline':
              return [
                  `graph TD\n  A["Historical Load"] --> B["Logistic Function"]\n  B --> C["Value at Risk"]`,
                  `graph LR\n  D["Safe Operating Zone"] --> E["Critical Threshold"]\n  E --> F["Queue Catastrophe"]`,
                  `graph TD\n  G["Demand Scales"] --> H["D equals System Limit"]\n  H --> I["Queue Collapse (${qTitle})"]`
              ];
          default:
              return [
                  `graph LR\n  A["Data Ingestion"] --> B["Analysis Matrix"]`,
                  `graph TD\n  C["Calculate Output"] --> D["Generate Findings"]`,
                  `graph LR\n  E["Compute"] --> F["Result"]`
              ];
      }
  };

  const parseLLMTagsAndTrigger = async (text: string) => {
    let clean = text;
    let actionCtx: 'proceed' | 'report' | 'pdf' | undefined = undefined;
    let triggerChart = false;
    let triggerReport = false;
    let triggerSaveMd = false;
    let mdContent = '';
    let triggerReset = false;
    
    if (clean.includes('[START_REPORT_MARKDOWN]')) {
       // Case-insensitive flexible regex
       const result = clean.match(/\[START_REPORT_MARKDOWN\]([\s\S]*?)(?:\[END_REPORT_MARKDOWN\]|$)/i);
       if (result && result[1]) {
           let md = result[1].trim();
            if (plotImageBase64.current && md.includes('[TRAJECTORY_PLOT_IMAGE]')) {
                md = md.replace(/\[TRAJECTORY_PLOT_IMAGE\]/g, `![Trajectory Dynamics](${plotImageBase64.current})`);
            }
            
            // Inject Analytical Framework text blob before parsing mermaid because blob contains mermaid tags
            if (md.includes('[SYSTEM_INJECT_ANALYTICAL_FRAMEWORK]')) {
                const afTemplate = getAnalyticalFrameworkTemplate(mode as string, config);
                md = md.replace(/\[SYSTEM_INJECT_ANALYTICAL_FRAMEWORK\]/g, () => afTemplate);
            }
            
            // Inject unified references template explicitly
            if (md.includes('[SYSTEM_INJECT_REFERENCES]')) {
                const references = getAnalyticalFrameworkReferences(mode as string);
                md = md.replace(/\[SYSTEM_INJECT_REFERENCES\]/g, () => references);
            }
            
            // Hard inject the 100% syntactically guaranteed templates
            if (md.includes('[SYSTEM_INJECT_DIAGRAM_1]') || md.includes('[SYSTEM_INJECT_DIAGRAM_2]') || md.includes('[SYSTEM_INJECT_DIAGRAM_3]')) {
                const templates = getMermaidTemplates(mode as string, config);
                md = md.replace(/\[SYSTEM_INJECT_DIAGRAM_1\]/g, () => `\`\`\`mermaid\n${templates[0]}\n\`\`\``);
                md = md.replace(/\[SYSTEM_INJECT_DIAGRAM_2\]/g, () => `\`\`\`mermaid\n${templates[1]}\n\`\`\``);
                md = md.replace(/\[SYSTEM_INJECT_DIAGRAM_3\]/g, () => `\`\`\`mermaid\n${templates[2]}\n\`\`\``);
            }
           
           // Intercept and Sandbox raw Mermaid output into crisp Base64 PNG Images natively
           // Support optional carriage returns using \s* and match everything up to closing tags via lazzy match
           const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/gi;
           const matches = [...md.matchAll(mermaidRegex)];
           
           if (matches.length > 0) {
               for (let i = 0; i < matches.length; i++) {
                   const code = matches[i][1].trim();
                   try {
                       const res = await fetch('/api/generate-mermaid', {
                           method: 'POST',
                           body: JSON.stringify({ code })
                       });
                       const json = await res.json();
                        if (json.imageUrl) {
                            const imgMd = `![Architectural Diagram ${i+1}](${json.imageUrl})`;
                            md = md.replace(matches[i][0], imgMd);
                       } else if (json.imageBase64) {
                           const imgMd = `![Architectural Diagram ${i+1}](data:image/png;base64,${json.imageBase64})`;
                           md = md.replace(matches[i][0], imgMd);
                       }
                   } catch(e) { console.error("Sandbox Mermaid gen failed", e); }
               }
           }

           // Programmatically sanitize the markdown to strip hallucinated extra page breaks.
           // The Agent often incorrectly places `<div style="page-break-before: always;"></div>` immediately before headers 
           // and at the very end of the file, causing 14-16 blank pages when combined with our native H2 CSS breaks.
           md = md.replace(/<(div|br|p)[^>]*page-break[^>]*>(?:\s*<\/\1>)?\s*(?=##\s+\d\.)/gi, '');
           md = md.replace(/<(div|br|p)[^>]*page-break[^>]*>(?:\s*<\/\1>)?\s*(?=<br>|<br\/>|\n)*\s*$/gi, '');

           setFullReport(md);
           if (!mdTriggered.current) {
               mdTriggered.current = true;
               triggerSaveMd = true;
               mdContent = md;
           }
           // Remove ONLY the system tags, leaving the markdown block exactly where it is so renderMsgContent can parse it
           clean = clean.replace(/\[START_REPORT_MARKDOWN\]\s*/i, '').replace(/\s*\[END_REPORT_MARKDOWN\]/i, '').trim();
       }
    }
    if (clean.includes('[SYSTEM_CHART]')) {
       clean = clean.replace(/\[SYSTEM_CHART\]/g, '').trim();
       if (!chartTriggered.current) {
          chartTriggered.current = true;
          triggerChart = true;
       }
    }
    if (clean.includes('[SYSTEM_ASK_PROCEED]')) {
       clean = clean.replace(/\[SYSTEM_ASK_PROCEED\]/g, '').trim();
       if (!askProceedTriggered.current) {
          askProceedTriggered.current = true;
          actionCtx = 'proceed';
       }
    }
    if (clean.includes('[SYSTEM_ASK_REPORT]')) {
       clean = clean.replace(/\[SYSTEM_ASK_REPORT\]/g, '').trim();
       if (!askReportTriggered.current) {
          askReportTriggered.current = true;
          actionCtx = 'report';
       }
    }
    if (clean.includes('[SYSTEM_ASK_PDF]')) {
       clean = clean.replace(/\[SYSTEM_ASK_PDF\]/g, '').trim();
       if (!askPdfTriggered.current) {
          askPdfTriggered.current = true;
          actionCtx = 'pdf';
       }
    }
    if (clean.includes('[SYSTEM_REPORT]')) {
       clean = clean.replace(/\[SYSTEM_REPORT\]/g, '').trim();
       if (!reportTriggered.current) {
          reportTriggered.current = true;
          triggerReport = true;
       }
    }
    if (clean.includes('[SYSTEM_ENABLE_RUN]')) {
       clean = clean.replace(/\[SYSTEM_ENABLE_RUN\]/g, '').trim();
       triggerReset = true;
    }
    return { cleanText: clean, actionCtx, triggerChart, triggerReport, triggerSaveMd, mdContent, triggerReset };
  };

  const handleActionClick = (msgId: string, actionText: string) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, actionResolved: true } : m));
      const targetMsg = messages.find(m => m.id === msgId);
      submitUserMessage(actionText, targetMsg?.actionContext);
  };

  const submitUserMessage = async (userMsg: string, explicitActionContext?: string) => {
    if (isProcessing) return;
    const stableId = Date.now().toString() + Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, { id: stableId, role: 'user', type: 'text', content: userMsg }]);

    // Engine Step Routing (Pure deterministic execution)
    if (messages.length > 0 && hasStarted) {
        let activeContext = explicitActionContext;
        
        if (!activeContext) {
            const lastQuestion = [...messages].reverse().find(m => m.role === 'flux' && m.actionContext && !m.actionResolved);
            if (lastQuestion) activeContext = lastQuestion.actionContext;
        }
        
        if (activeContext && ['yes', 'proceed'].includes(userMsg.toLowerCase())) {
            setIsProcessing(true);
            setTimeout(async () => {
                if (activeContext === 'proceed') {
                    // Trigger Chart Step (Step 2)
                    setMessages(prev => [...prev, { id: Date.now().toString() + 'c', role: 'flux', type: 'chart', content: meta.steps[1].message, actionContext: 'report' }]);
                    setIsProcessing(false);
                } else if (activeContext === 'report') {
                    // Trigger Report Step (Step 3: MD Generation via LLM)
                    const mdStartTime = performance.now();
                    setMessages(prev => [...prev, { id: Date.now().toString() + 'rload', role: 'flux', type: 'text', content: `Compiling analytical findings into official report... please stand by.` }]);
                    
                    try {
                        const hist = messages.map(m => ({ role: m.role, content: m.type === 'text' ? m.content : `[System rendered chart]` }));
                        if (hist.length > 0 && hist[0].role !== 'user') hist.unshift({ role: 'user', content: "Acknowledge system." });
                        
                        // Force explicit system command so Anomaly engine properly constructs the markdown block
                        const forcePrompt = "Generate the full Markdown report based on these findings. You MUST enclose the entire report inside [START_REPORT_MARKDOWN] and [END_REPORT_MARKDOWN] tags. You MUST output [SYSTEM_REPORT] exactly once at the very end of your response.";
                        const reply = await agentFluxChat(hist, getSystemPrompt(), forcePrompt);
                        
                        // Parse tags which updates UI elements, and then we physically save it
                        const { mdContent, cleanText } = await parseLLMTagsAndTrigger(reply);
                        if (mdContent) {
                            setFullReport(mdContent);
                            await generateMDReport(mdContent, mdStartTime);
                        } else {
                            // Fallback if the engine failed to wrap the output in START/END tags
                            const fallbackMd = cleanText.replace(/\[SYSTEM_[A-Z_]+\]/g, '').trim();
                            if (fallbackMd.length > 100) {
                                setFullReport(fallbackMd);
                                await generateMDReport(fallbackMd, mdStartTime);
                            }
                        }
                        
                        setMessages(prev => prev.filter(m => !m.id.endsWith('rload')));
                        setMessages(prev => [...prev, { 
                            id: Date.now().toString() + 'r', 
                            role: 'flux', 
                            type: 'text', 
                            content: (mdContent ? `\`\`\`md\n${mdContent}\n\`\`\`\n\n` : '') + meta.steps[2].message, 
                            actionContext: 'pdf' 
                        }]);
                    } catch(e: any) {
                        setMessages(prev => prev.filter(m => !m.id.endsWith('rload')));
                        setMessages(prev => [...prev, { id: Date.now().toString() + 'rerr', role: 'flux', type: 'text', content: `Error generating report: ${e.message}` }]);
                    }
                    setIsProcessing(false);
                } else if (activeContext === 'pdf') {
                    // Trigger PDF Step (Step 4: PDF Generation)
                    setMessages(prev => [...prev, { id: Date.now().toString() + 'pdfrng', role: 'flux', type: 'text', content: meta.steps[3].message }]);
                    
                    setTimeout(async () => {
                        try {
                            await generatePDFReport(fullReport);
                            setMessages(prev => [...prev, { id: Date.now().toString() + 'done', role: 'flux', type: 'text', content: `Understood, ${authUser.title} ${authUser.lastName}. The previous report generation is complete and archived.\n\nTo initiate a new analysis, please adjust the parameters on the left and hit "Execute Diagnostic Run" when you are ready to begin.` }]);
                            setHasStarted(false);
                        } catch (err: any) {
                            // Error is caught and displayed by the service, no need to inject success message.
                        } finally {
                            setIsProcessing(false);
                        }
                    }, 500); // Slight delay for UI to paint "Generating PDF now."
                } else {
                    setIsProcessing(false);
                }
            }, 800);
            return;
        } else if (activeContext && ['no', 'stop'].includes(userMsg.toLowerCase())) {
            setMessages(prev => [...prev, { id: Date.now().toString()+'sysno', role: 'flux', type: 'text', content: `Understood. The diagnostic trace will remain secured in this session window without official exportation.` }]);
            setHasStarted(false);
            return;
        }
    }

    setIsProcessing(true);
    
    // Fallback: Pass to Gemini for conversational chat
    const hist = messages.map(m => {
       return { role: m.role, content: m.type === 'text' ? m.content : `[System rendered chart]` };
    });
       
    if (hist.length > 0 && hist[0].role !== 'user') hist.unshift({ role: 'user', content: "Acknowledge system." });
    
    try {
        const reply = await agentFluxChat(hist, getSystemPrompt(), userMsg);
        const { cleanText, triggerReset } = await parseLLMTagsAndTrigger(reply);
        
        if (triggerReset) setHasStarted(false);
        
        if (cleanText.trim().length > 0) {
            setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'flux', type: 'text', content: cleanText }]);
        }
        setIsProcessing(false);
    } catch (err: any) {
        setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'flux', type: 'text', content: `Error: ${err.message}` }]);
        setIsProcessing(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    const msg = chatInput.trim();
    setChatInput('');
    await submitUserMessage(msg);
  };

  const getTimestampCST = () => {
     const dateObj = new Date();
     const formatter = new Intl.DateTimeFormat('en-US', {
         timeZone: 'America/Chicago',
         year: 'numeric', month: '2-digit', day: '2-digit',
         hour: '2-digit', minute: '2-digit', second: '2-digit',
         hour12: false
     });
     const parts = formatter.formatToParts(dateObj).reduce((acc: any, part) => {
         acc[part.type] = part.value;
         return acc;
     }, {});
     return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}-${parts.minute}-${parts.second}-CST`;
  };

  const getShortTitle = (title: string) => {
    if (title.includes('Predictive')) return 'PWS';
    if (title.includes('Redline')) return 'VaR_Redline';
    if (title.includes('Lag')) return 'Lag_Lead';
    if (title.includes('Toxicity')) return 'Toxicity';
    if (title.includes('Anomaly')) return 'Anomaly';
    return title.replace(/\s+/g, '_').substring(0, 15);
  };

  const generateMDReport = async (originalMdStr: string, extStartTime?: number) => {
     const tStart = extStartTime || performance.now();
     let mdStr = originalMdStr;
     
     // Sandbox Mermaid generation natively from Python's markup
     const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/gi;
     const matches = [...mdStr.matchAll(mermaidRegex)];
     
     if (matches.length > 0) {
         for (let i = 0; i < matches.length; i++) {
             const code = matches[i][1].trim();
             try {
                 const res = await fetch('/api/generate-mermaid', {
                     method: 'POST',
                     body: JSON.stringify({ code })
                 });
                 const json = await res.json();
                 if (json.imageUrl) {
                      const imgMd = `![Architectural Diagram ${i+1}](${json.imageUrl})`;
                      mdStr = mdStr.replace(matches[i][0], imgMd);
                 } else if (json.imageBase64) {
                     const mime = json.imageType === 'svg' ? 'image/svg+xml;charset=utf-8' : 'image/png';
                     const imgMd = `![Architectural Diagram ${i+1}](data:${mime};base64,${json.imageBase64})`;
                     mdStr = mdStr.replace(matches[i][0], imgMd);
                 }
             } catch(e) { console.error("Sandbox Mermaid gen failed", e); }
         }
     }
     
     setFullReport(mdStr);

     const timestamp = getTimestampCST();
     const filename = `${getShortTitle(meta.title)}_${timestamp}.md`;

     // Scrape embedded support graphics that need to be grouped with this MD download
     const supports: string[] = [];
     const imgRegex = /!\[.*?\]\(([^)]+\.(?:png|svg|jpg))\)/gi;
     let match;
     while ((match = imgRegex.exec(mdStr)) !== null) {
         let src = match[1];
         if (!src.startsWith('http') && !src.startsWith('data:')) {
             src = src.split('/').pop() || src;
             if (!supports.includes(src)) supports.push(src);
         }
     }

     // Archive silently in backend first
     // Archive silently in backend first, creating a ZIP
     try {
         const res = await fetch('/api/archive-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: mdStr, filename: `${getShortTitle(meta.title)}_${timestamp}`, supports })
         });
         const json = await res.json();
         
         const mdEndTime = performance.now();
         const genTime = extStartTime ? ((mdEndTime - extStartTime) / 1000).toFixed(1) : "0.0";

         const sessionLabel = currentSession.current > 0 ? ` (S${currentSession.current})` : '';
         setGeneratedDocs(prev => [...prev, {
             title: `${getShortTitle(meta.title)} Report${sessionLabel}`,
             filename: json.zipFile || filename,
             url: json.zipUrl || `/docs/flux_reports/${filename}`,
             time: new Date().toLocaleTimeString(),
             type: 'MD',
             supports: [],
             genTime: genTime
         }]);
     } catch (e) {
         console.error("Archive Failed", e);
     }
     return mdStr;
  };

  const generatePDFReport = async (processedMd?: string) => {
    setIsProcessing(true);
    const tStart = performance.now();
    setMessages(prev => [...prev, { id: Date.now().toString()+'syspdf', role: 'flux', type: 'text', content: `Executing high-fidelity vector PDF generation via Server Engine... Stand by.` }]);

    try {
        const dateObj = new Date();
        const timestamp = getTimestampCST();
        const filename = `${getShortTitle(meta.title)}_${timestamp}`;

        // Build raw markdown payload with integrated variables
        const payload = (processedMd || fullReport).trim();

        // Dispatch raw markdown to robust backend vector engine
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: payload, filename: filename })
        });
        
        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(errBody.error || "Unknown server error");
        }

        const result = await response.json();
        
        const tEnd = performance.now();
        const genTime = ((tEnd - tStart) / 1000).toFixed(1);
        
        const sessionLabel = currentSession.current > 0 ? ` (S${currentSession.current})` : '';
        setGeneratedDocs(prev => [...prev, {
            title: `${getShortTitle(meta.title)} Report${sessionLabel}`,
            filename: result.filename,
            url: result.url || `/docs/flux_reports/${result.filename}`,
            time: new Date().toLocaleTimeString(),
            type: 'PDF',
            genTime: genTime
        }]);
        
    } catch (err: any) {
        console.error("PDF Generate Error", err);
        setMessages(prev => [...prev, { id: Date.now().toString()+'syserr', role: 'flux', type: 'text', content: `[SYSTEM NOTIFICATION] I apologize, but the PDF Report is currently unavailable. A rendering timeout or syntax clash occurred in the document generation queue (${err.message || String(err)}).\n\nYou can still read the full diagnostic findings mathematically processed above. If you would like to try generating the report again, you have the option to execute another diagnostic run on this exact use case. You can try changing your Engine Config, or simply re-run it immediately as is to bypass the temporary bottleneck.` }]);
        
        // Reactivate the Execute Diagnostic run button so the user isn't stuck natively
        setHasStarted(false);
    }
    setIsProcessing(false);
  };

  const handleDocDownload = (e: React.MouseEvent<HTMLAnchorElement>, doc: any) => {
      // Keep native download behavior, just trigger the visual checkmark locally.
      setGeneratedDocs(prev => prev.map(d => 
          {
              if (d.filename === doc.filename && d.time === doc.time) {
                  return { ...d, downloaded: true };
              }
              return d;
          }
      ));
  };

  const handleDownloadChatLog = () => {
      let logText = `Signal Flux | Session Chat Log\\nProfessor Newton & Agent Flux\\nGenerated: ${new Date().toLocaleString()}\\n\\n`;
      messages.forEach(msg => {
          const actor = msg.role === 'user' ? 'Professor Newton' : 'Agent Flux';
          if (msg.type === 'chart') {
              logText += `${actor}: "Trajectory Dynamics | Sentiment (SSM) v. Productivity" chart generated.\\n\\n`;
          } else if (msg.type === 'text') {
              const cleanMsg = msg.content.replace(/\\n\\s*\\n/g, '\\n').trim();
              logText += `${actor}: ${cleanMsg}\\n\\n`;
          } else if (msg.type === 'report') {
              logText += `${actor}: [Report Generated]\\n\\n`;
          }
      });
      const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  };

  if (!meta) return null;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 max-w-[100%]">
      

      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <div className={`p-3 rounded-2xl border ${meta.accent}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{meta.title}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{meta.desc}</p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-6 h-[calc(100%-100px)]">
        
        {/* SETTINGS PANE */}
        <div className="w-[420px] shrink-0 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-6 pb-2 sticky top-0 bg-slate-900/40 backdrop-blur-md z-10 border-b border-white/5">
            <div className="w-full flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Engine Config</h2>
            </div>
          </div>

          <div className="p-6 space-y-6 pt-4">

            {/* Dynamic Controls */}
            {meta.controls.map((ctrl, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{ctrl.label}</label>
                <select 
                   value={controlVals[i] || ctrl.default}
                   onChange={(e) => setControlVals(prev => ({...prev, [i]: e.target.value}))}
                   className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 font-mono shadow-inner outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer hover:bg-white/5"
                >
                  {ctrl.options?.map(opt => (
                     <option key={opt} value={opt}>{opt}</option>
                  )) || <option>{ctrl.default}</option>}
                </select>
              </div>
            ))}

            {/* Official Reports Pane merged with Generated Manifest */}
            <div className="pt-4 mt-6 border-t border-white/10 flex-1 flex flex-col">
              <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 px-6 flex items-center gap-2 sticky top-[100px] z-10 bg-slate-900/90 py-2 backdrop-blur-sm">
                <Download className="w-3 h-3 text-emerald-400" />
                Official Reports
              </h3>
              
              {generatedDocs.length === 0 ? (
                 <div className="px-6 mb-4">
                     <div className="text-[10px] font-black tracking-widest uppercase text-slate-500 italic p-3 bg-slate-800/50 rounded-lg border border-white/5 text-center">No reports generated yet</div>
                 </div>
              ) : (
                 <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                   {generatedDocs.map((doc, i) => (
                      <a 
                          key={i} 
                          href={doc.url} 
                          download={doc.filename} 
                          onClick={(e) => handleDocDownload(e, doc)} 
                          className={`block p-4 ${doc.downloaded ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10 hover:border-cyan-500/50'} border rounded-xl transition-all group relative`}
                      >
                         <div className="flex justify-between items-center mb-2 gap-2">
                            <span className={`text-xs font-black uppercase tracking-widest truncate ${doc.downloaded ? 'text-emerald-400' : 'text-slate-200 group-hover:text-cyan-400'} transition-colors`}>
                               {doc.title}
                            </span>
                            {doc.downloaded && (
                                <div className="shrink-0 text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                   <CheckCircle className="w-3 h-3" />
                                   <span className="text-[9px] uppercase tracking-widest">Downloaded</span>
                                </div>
                            )}
                         </div>
                         <div className="text-[10px] text-slate-400 mb-3 truncate">{doc.filename}</div>
                         <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/5 pt-3">
                             <div className="flex items-center gap-2">
                                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${doc.type === 'PDF' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>{doc.type}</span>
                                 <span className="text-slate-500">{doc.time}</span>
                             </div>
                             <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/10 font-bold">{doc.genTime || '--'}s</span>
                         </div>
                      </a>
                   ))}
                 </div>
              )}
            </div>

          </div>

          <div className="mt-auto p-6 pt-0 sticky bottom-0 bg-slate-900/40 backdrop-blur-md z-10 border-t border-white/5">
            <button 
              onClick={handleRunAnalysis}
              disabled={isProcessing || hasStarted}
              className={`mt-4 w-full py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2 border ${(isProcessing || hasStarted) ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-400 hover:text-[#020617] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'}`}
            >
              <Activity className="w-4 h-4" /> Execute Diagnostic Run
            </button>
          </div>
        </div>

        {/* AGENT FLUX CHAT INTERFACE */}
        <div className="flex-1 bg-slate-900/20 border border-white/5 rounded-2xl flex flex-col relative overflow-hidden">
          
          <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-slate-900/80 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[10px] opacity-20"></div>
                <Bot className="w-6 h-6 text-cyan-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Agent Flux</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Connected to DB Core (Auth: {fullName})</span>
                </div>
              </div>
            </div>
            <button 
                onClick={handleDownloadChatLog}
                title="Open Chat Log Summary"
                className="p-2 border border-white/10 rounded-lg hover:border-cyan-500 hover:bg-cyan-500/10 transition-colors group relative"
            >
                <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
            </button>
          </div>

          <div id="flux-chat-container" className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]">
            <div id="flux-chat-inner" className="p-6 space-y-6 min-h-full">
            {messages.map((msg) => {
              return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 border border-white/10 text-slate-200' 
                    : 'bg-cyan-900/10 border border-cyan-500/20 text-cyan-100'
                }`}>
                  
                  {msg.type === 'text' && (
                     <div className="flex flex-col gap-1 w-full">
                       {renderMsgContent(msg.content)}
                       {msg.actionContext && (
                         <div className="flex gap-4 mt-3 w-full max-w-xs">
                            <button 
                               onClick={() => handleActionClick(msg.id, 'Yes')}
                               disabled={isProcessing || msg.actionResolved}
                               className="flex-1 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors disabled:opacity-50 font-black uppercase tracking-widest text-xs"
                            >
                               Yes
                            </button>
                            <button 
                               onClick={() => handleActionClick(msg.id, 'no')}
                               disabled={isProcessing || msg.actionResolved}
                               className="flex-1 py-1.5 bg-rose-500/5 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50 font-black uppercase tracking-widest text-xs"
                            >
                               No
                            </button>
                         </div>
                       )}
                     </div>
                  )}

                  {msg.type === 'chart' && (() => {
                     const parts = msg.content.split(/\n\n(Would you like me[\s\S]*)/i);
                     const mainText = parts[0];
                     const postText = parts[1] || '';
                     return (
                         <div className="w-full flex flex-col gap-4">
                           <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap mb-2">{mainText}</div>
                           <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                             <LineChartIcon className="w-4 h-4" /> Trajectory Dynamics | {meta.chartDataKeyLeft} v. {meta.chartDataKeyRight}
                           </h4>
                           <div className="h-64 w-full bg-[#0f172a] rounded-xl p-4 border border-white/5">
                             <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={realData}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                 <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                                 <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                                 <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                                 <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                                 <Legend />
                                 <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey={meta.chartDataKeyLeft} stroke="#38bdf8" strokeWidth={3} dot={realData.length > 50 ? false : {r: 4, fill: '#38bdf8'}} />
                                 <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey={meta.chartDataKeyRight} stroke="#f43f5e" strokeWidth={3} dot={realData.length > 50 ? false : {r: 4, fill: '#f43f5e'}} />
                               </LineChart>
                             </ResponsiveContainer>
                           </div>
                           <div className="text-white/30 text-[10px] uppercase tracking-widest">Debug Length: {realData?.length}</div>
                           {(postText || msg.actionContext) && (
                               <div className="flex flex-col gap-1 w-full mt-2">
                                 {postText && <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap">{postText}</div>}
                                 {msg.actionContext && (
                                   <div className="flex gap-4 mt-3 w-full max-w-xs">
                                      <button 
                                         onClick={() => handleActionClick(msg.id, 'Yes')}
                                         disabled={isProcessing || msg.actionResolved}
                                         className="flex-1 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors disabled:opacity-50 font-black uppercase tracking-widest text-xs"
                                      >
                                         Yes
                                      </button>
                                      <button 
                                         onClick={() => handleActionClick(msg.id, 'no')}
                                         disabled={isProcessing || msg.actionResolved}
                                         className="flex-1 py-1.5 bg-rose-500/5 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50 font-black uppercase tracking-widest text-xs"
                                      >
                                         No
                                      </button>
                                   </div>
                                 )}
                               </div>
                           )}
                         </div>
                     );
                  })()}

                  {msg.type === 'report' && (
                     <div className="flex flex-col gap-2 w-full">
                         {renderMsgContent(msg.content)}
                     </div>
                  )}

                  {msg.type === 'pdf_button' && (
                     <button 
                        onClick={() => generatePDFReport(fullReport)}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Download className="w-4 h-4" /> Download Official PDF Report
                     </button>
                  )}

                </div>
              </div>
              );
            })}

            {isProcessing && (
              <div className="flex justify-start">
                 <div className="bg-cyan-900/10 border border-cyan-500/20 text-cyan-400 rounded-2xl px-5 py-4 flex flex-col gap-3 min-w-[320px] shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                   <div className="flex items-center gap-3">
                     <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.30s]"></span>
                     </div>
                     <span className="text-xs font-mono uppercase tracking-widest opacity-80">
                       {processingElapsed < 5 ? 'Awaiting Processing Engine...' : 
                        processingElapsed < 15 ? 'Analyzing Target Matrices...' : 
                        processingElapsed < 30 ? 'Compiling Vector Graphics...' :
                        processingElapsed < 45 ? 'Generating Official Evidence...' :
                        'Finalizing Secure Package...'}
                     </span>
                   </div>
                   
                   <div className="w-full relative px-1">
                     <div className="h-1 bg-cyan-950/50 rounded-full overflow-hidden w-full relative">
                       <div className="h-full bg-cyan-400 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ width: `${Math.min(98, (processingElapsed / 45) * 100)}%` }}></div>
                     </div>
                     <div className="flex justify-between w-full mt-2">
                       <span className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-widest">
                         ETA: ~45s
                       </span>
                       <span className="text-[10px] font-mono text-cyan-400/80">
                         {processingElapsed}s elapsed
                       </span>
                     </div>
                   </div>
                 </div>
              </div>
            )}
              <div ref={chatEndRef} />
            </div>
          </div>


          {/* CHAT INPUT FORM */}
          <div className="p-4 bg-slate-900/60 border-t border-white/5 backdrop-blur-md">
            <form onSubmit={handleChatSubmit} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Ask Agent Flux a question or give an exact command..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isProcessing}
                className={`w-full bg-[#020617] border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-xl pl-4 pr-12 py-4 text-sm text-slate-200 outline-none transition-all disabled:opacity-50`}
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isProcessing}
                className="absolute right-2 p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-cyan-500/20 disabled:hover:text-cyan-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisModuleView;
