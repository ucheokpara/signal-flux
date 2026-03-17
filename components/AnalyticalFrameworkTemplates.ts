export const getAnalyticalFrameworkTemplate = (useCaseMode: string, conf: any): string => {
  const sourceTitle = conf.source || "External Platform";
  const qTitle = Array.isArray(conf.queues) && conf.queues.length > 0 ? conf.queues[0] : "Primary Queue";
  
  switch(useCaseMode) {
      case 'analysis-lag':
          return `**Predictive Workforce Scheduling**

External social velocity rarely impacts internal support queues instantaneously. A sudden spike in *Demand (D)* combined with plunging *Sentiment (SSM)* (e.g., a server crash during a massive tournament) generates a wave of support tickets on a delay. By calculating the exact time-lag between external peaks and internal surges, Workforce Management (WFM) teams can dynamically adjust schedules prior to queue collapse.

We employ a Cross-Correlation Function (CCF) on the discrete time series to identify the exact minute-lag ($k$) that yields the highest correlation coefficient between an external $SSM$ drop and an internal *Incident Demand* spike.

**Table 2.1: Lagged Correlation Example (Demand vs Incidents)**

| Time | Demand Score (D) | Scaled Incidents |
| :--- | :--- | :--- |
| 13:45 | 150 | 10 |
| 14:00 | 800 | 15 |
| 14:15 | 750 | 20 |
| 14:30 | 600 | 30 |
| 14:45 | 400 | 950 |
| 15:00 | 200 | 800 |

**Mathematical Definition of Cross-Correlation**

The cross-correlation of two discrete time series, $f$ (External Demand) and $g$ (Internal Incidents), is mathematically defined as:

$$ (f \\star g)[k] = \\sum_{m=-\\infty}^{\\infty} f[m]^* g[m+k] $$

Where $k$ represents the exact lag delay in minutes. By maximizing $(f \\star g)[k]$, the algorithm locates the exact delay structure. 

**Figure 2.1: WFM Alert Module Action Flow**

[SYSTEM_INJECT_DIAGRAM_1]

**Numerical Example: The 45-Minute Window**

At 14:00, $D$ spikes from 150 to $D=800$, while $SSM$ drops to $-1.0$. The mathematical engine knows from historical CCF modeling that the maximum lag $Lag = 45$ minutes. We deduce that at exactly 14:45, *Incident Demand* will spike from $3,000 \\rightarrow 12,000$ tickets. WFM can successfully shift 50 agents off breaks at 14:30.

**Figure 2.2: Lag Correlation Timeline Mechanism**

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusions on Lag Interpolation**

By proactively bridging the isolated data streams between external social hype and internal ticket queues, Workforce Management fundamentally shifts their posture from reactive scrambling to predictive capacity balancing. The 45-minute window serves as a guaranteed operational buffer for load balancing.

`;
      
      case 'analysis-toxicity':
          return `**"Toxicity-Driven" Productivity Deterioration Analysis**

During highly negative viral events, players submit angrier, more complex tickets. This framework analyzes historical data to prove that specific external social states directly degrade internal *Productivity Rates*. This enables objective operational adjustments rather than attributing low output to agent inefficiency.

We employ Decision Tree Classifiers to find the exact external threshold (e.g., $SSM < -0.4$ and $D > 500$) that mathematically guarantees a structural drop in *Productivity Rate* below the local rolling average.

**Table 2.1: Toxicity vs. Productivity Yield Classification**

| Event | Volume | Sentiment | Classification Phase |
| :--- | :--- | :--- | :--- |
| Quiet Weekend | Low | High | Low Priority (Q3) |
| Esports Finals | High | High | Golden Launch (Q2) |
| Patch 1.2 Delay | High | Low | Toxicity Zone (Q4) |
| Server Crash | High | Low | Toxicity Zone (Q4) |

**Mathematical Definition of Productivity Collapse**

A normal shift runs at a baseline *Productivity Rate*, mathematically defined as the ratio of Incidents ($I$) to Resource Minutes ($R$):

$$ \\mu_{P} = \\frac{\\sum_{i=1}^{n} I_i}{\\sum_{i=1}^{n} R_i} \\approx 0.65 \\text{ Pkgs/Min} $$

When $SSM \\rightarrow -1$ and $D \\gg \\mu_D$, the cognitive load on agents increases due to abusive, complex interactions. The required Resource Minutes ($R$) scales disproportionately to $I$, driving productivity below a critical threshold $\\tau$.

**Figure 2.1: Toxicity Decision Tree and KPI Adjustment**

[SYSTEM_INJECT_DIAGRAM_1]

**Numerical Example: The Escalation Penalty**

During a poorly received patch ($SSM = -1.0, D > 600$), tickets become abusive. Agents require more time to de-escalate. Resolving 1,000 incidents usually requires 1,538 Resource Minutes ($0.65$ Pkgs/Min). During the toxic event, resolving those identical 1,000 incidents requires 2,857 Resource Minutes, plunging Productivity to exactly $0.35$ Pkgs/Min.

**Figure 2.2: Forensic Impact Breakdown**

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusions on Productivity Deterioration**

Correlating negative external sentiment directly against internal throughput mathematically proves that operational load expectations must adapt dynamically to the actual complexity of the incidents, preserving workforce morale rather than imposing unachievable baseline KPIs on toxic tickets.

`;

      case 'analysis-anomaly':
          return `**Automated Capacity Breach Anomaly Detection**

Internal Demand usually tracks linearly with External Demand. If *Incident Demand* violently spikes but *External Volume* remains flat, it indicates a highly localized internal failure (e.g., a silent payment gateway bug) that hasn't hit social media yet. Conversely, an extreme external spike with no internal ticket growth is "safe hype."

We train an unsupervised anomaly detection model using **Isolation Forests** on $(Demand, Incident Demand)$ coordinate pairs. Instances that fall outside the 95% confidence cluster are flagged as "Uncoupled Anomalies".

**Table 2.1: Tracking Anomaly Variance (Internal vs External)**

| Time | External Demand ($D$) | Internal Incidents ($I$) | Note |
| :--- | :--- | :--- | :--- |
| T-1 | 10 | 10 | Baseline |
| T-2 | 12 | 11 | Baseline |
| T-3 | 11 | 10 | Baseline |
| T-4 | 15 | 85 | **Type A (High Internal, Low External)** |
| T-5 | 12 | 12 | Baseline |
| T-6 | 95 | 10 | **Type B (High External, Low Internal)** |

**Mathematical Definition of Isolation Forests**

The algorithm randomly sub-samples the data and builds Random Decision Trees (i-Trees) by selecting random thresholds. Anomalies, being "few and different," are quickly isolated closer to the root of the trees. The expected path length $E(h(x))$ computes the anomaly score $s(x, n)$:

$$ s(x, n) = 2^{ -\\frac{E(h(x))}{c(n)} } $$

Where $c(n)$ is the average path length of an unsuccessful search. $s \\rightarrow 1$ indicates a definitive anomaly.

**Figure 2.1: Capacity Breach Isolation Forest State Diagram**

[SYSTEM_INJECT_DIAGRAM_1]

**Numerical Example: The Billing Failure**

- **Type A Anomaly**: $D = 120$ (Low). 'Incident Demand' spikes to 15,000 Pkgs. Path length $h(x)$ is incredibly short. $s(x, 1000) = 0.96$. A critical, non-social bug (e.g. billing server routing error) is occurring. Alert Engineering immediately.
- **Type B Anomaly**: $D = 950$ (Extreme). 'Incident Demand' remains flat at 2,000 Pkgs. Conclusion: A famous streamer is generating visual hype without breaking the servers. Do nothing to operations.

**Figure 2.2: Incident Triage Pipeline for Decoupled Anomalies**

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusions on Anomaly Classification**

By measuring the explicit variance path distances, the SSDF engine mechanically isolates false alarms from silent critical failures, ensuring the engineering on-call teams are only paged during mathematically undeniable Type-A structural breaks.

`;

      case 'analysis-decay':
          return `**Post-Launch "Stickiness" Decay Profiling**

Major marketing pushes cause immediate spikes in volume. By forensically analyzing the tail-end of a major spike—specifically the "half-life" of *Stickiness (S)*—studios can objectively grade the long-term retention of the content release, divorced entirely from the initial marketing hype parameter.

We fit an exponential decay curve to the ` + "`Stickiness (S)`" + ` variable post-peak to calculate the decay constant ($\\lambda$). A lower decay constant signifies mathematically superior audience retention independent of the peak $N_0$.

**Table 2.1: Stickiness (S) Exponential Decay Profile (DLC 1 vs DLC 2)**

| Days Since Launch | DLC 1 (Healthy $\\lambda = 0.02$) | DLC 2 (Toxic $\\lambda = 0.24$) |
| :--- | :--- | :--- |
| Day 1 | 0.85 | 0.85 |
| Day 2 | 0.82 | 0.50 |
| Day 3 | 0.80 | 0.40 |
| Day 4 | 0.78 | 0.35 |
| Day 5 | 0.75 | 0.30 |
| Day 6 | 0.72 | 0.25 |
| Day 7 | 0.70 | 0.20 |

**Mathematical Definition of Exponential Half-life**

The volume of retained Stickiness $N(t)$ at time $t$ is calculated by integrating the constant decay rate factor $\\lambda$ against the initial peak constraint:

$$ N(t) = N_0 \\cdot e^{-\\lambda t} $$

Solving for the exact half-life metric $t_{1/2}$ reveals the pure biological half-life of the audience's engagement:

$$ t_{1/2} = \\frac{\\ln(2)}{\\lambda} $$

**Figure 2.1: Retention Grade Decision Tree**

[SYSTEM_INJECT_DIAGRAM_1]

**Numerical Example: The Toxic Curve**

- **DLC 1**: Peak Volume $= 300,000$. Stickiness $S = 0.85$. Day 7 Volume is $80,000$, but Stickiness is $S = 0.70$. Decay Constant ($\\lambda$) is $0.02$. A massive fundamental gameplay success retaining the core base.
- **DLC 2**: Peak Volume $= 500,000$. Stickiness $S = 0.85$. Day 7 Volume is $80,000$. Stickiness $S = 0.20$. Decay Constant ($\\lambda$) is $0.24$. The half-life $t_{1/2}$ is only 2.8 days. A fundamental failure driven entirely by transient marketing spend.

**Figure 2.2: Decay Profiling Calculation Pipeline**

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusions on Stickiness Decay**

Removing the overwhelming noise of peak volume and exclusively analyzing the logarithmic decay of the core variable correctly aligns the engineering grading metric to what actually defines long-term product viability: stability of the recurring consumer base.

`;

      case 'analysis-redline':
          return `**The "Redline" Stress Test (Value-at-Risk Simulation)**

Borrowing from financial risk management, this backward-analysis calculates how much External Demand the current internal workforce can absorb before failing entirely. By historically tracking the exact *Demand (D)* level that forced *Resource Demand* to hit maximum capacity, the engine establishes an exact "System Redline."

We use Logistic Regression to calculate the Probability Density Function (PDF) of a Queue Failure (e.g., Resource Demand exceeding 95% capacity) given variable $X$, which is the incoming external Demand $D$.

**Table 2.1: Value-at-Risk Logistic Regression: Probability of Queue Failure**

| Demand Score (D) | Probability of Queue Failure (%) |
| :--- | :--- |
| 100 | 1% |
| 250 | 2% |
| 400 | 5% |
| 550 | 15% |
| 700 | 45% |
| 850 | **95% (Redline)** |
| 1000 | 99% |

**Mathematical Definition of Logistic Value-at-Risk**

The probability of the binary failure event $\\Phi(X)$ is mapped via the standard logistic function (Sigmoid curve), fitting the historical breakdown thresholds:

$$ P(\\text{Failure}) = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 D)}} $$

Where $\\beta_1$ is the regression coefficient for Demand $D$. We solve for $D$ where $P(\\text{Failure}) \\ge 0.95$ to isolate the definitive maximum tolerable system stress threshold.

**Figure 2.1: Pre-Emptive Action Outsource Trigger Flow**

[SYSTEM_INJECT_DIAGRAM_1]

**Numerical Example: Outsource Triggering**

Feeding 6 months of historical data into the logistic simulation, the model calculates that a Queue Failure (e.g., player wait times exceeding 2 hours) is 95% likely whenever $D > 850$ and $SSM < 0$. The studio's explicitly defined "System Redline" is exactly $D=850$. 

If a newly announced gaming event is forecast to hit $D=1200$, the operations team definitively knows they must outsource support capacity or provision overflow servers prior to Friday night.

**Figure 2.2: Value-at-Risk Calibration Process**

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusions on The Redline Simulation**

Substituting reactive capacity management with predictive Value-at-Risk statistical mechanics ensures that no internal queue hits a catastrophic failure state during entirely predictable social demand surges, guaranteeing enterprise continuity.

`;
          
      default:
          return `**Methodology Framework**

The mathematical analysis applies specific transformations to external and internal state tensors to correlate social telemetry against workforce output.

**Framework Math**

Standard computation is utilized.

[SYSTEM_INJECT_DIAGRAM_1]

**Calculations**

Data is formatted.

[SYSTEM_INJECT_DIAGRAM_2]

**Conclusion**

See external docs.`;
  }
};


export const getAnalyticalFrameworkReferences = (useCaseMode: string): string => {
  switch(useCaseMode) {
      case 'analysis-lag':
          return `* Gans, N., Koole, G., & Mandelbaum, A. (2003). "Telephone Call Centers: Tutorial, Review, and Research Prospects." Manufacturing & Service Operations Management.`;
      case 'analysis-toxicity':
          return `* Grandey, A. A. (2003). "When 'The Show Must Go On': Surface Acting and Deep Acting as Determinants of Emotional Exhaustion." Academy of Management Journal.`;
      case 'analysis-anomaly':
          return `* Chandola, V., Banerjee, A., & Kumar, V. (2009). "Anomaly Detection: A Survey." ACM Computing Surveys.`;
      case 'analysis-decay':
          return `* Sifa, R., Bauckhage, C., & Drachen, A. (2014). "The Playtime Volatility of Free-To-Play Games." IEEE Conference on Computational Intelligence and Games.`;
      case 'analysis-redline':
          return `* Jorion, P. (2007). "Value at Risk: The New Benchmark for Managing Financial Risk."`;
      default:
          return `* No academic references provided.`;
  }
};
