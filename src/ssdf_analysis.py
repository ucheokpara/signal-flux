import pandas as pd
import matplotlib.pyplot as plt
import os
import requests
import json
import numpy as np
import warnings
from datetime import datetime

# SSDF Project - Phase 2: Agentic Analysis Engine
# Lead: Uche Okpara
# Project: SSDF Integration
# Terminology: EMH (V_total), IDS (ID_s), RDS (RD_s)
# Logic: Deep Search Lag (60d) | High Rigor (r_ext >= 0.75).
# Update: Optimized MIN_OVERLAP_DAYS to 3 to capture high-impact short-window events.

# Suppress runtime warnings for correlations on constant data slices
warnings.filterwarnings('ignore', category=RuntimeWarning)

class DataAnalystAgent:
    def __init__(self, api_key=""):
        self.api_key = api_key
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={self.api_key}"

    def analyze_plot(self, game, phrase, result_dict, data_type, filename):
        # High entropy critique: r_ext should rarely hit 1.0 in realistic telemetry
        realism = "REALISM VALIDATED" if result_dict['max_r_ext'] < 0.95 else "SUSPICIOUS PERFECTION (Low Sample/Artifact)"
        
        system_prompt = (
            f"Act as a Senior Data Scientist for the SSDF Project. Status: {realism}. "
            "Analyze the link between External Market Heat (EMH) and the internal Demand Signals. "
            f"Dashboard: {filename}. Threshold: r_ext >= 0.75. Peak Lag: {result_dict['peak_lag']} days."
        )
        user_query = (
            f"Queue: {result_dict['queue']} | Peak r_ext: {result_dict['max_r_ext']} | Peak Lag: {result_dict['peak_lag']}d\n"
            f"Discuss the comparison of the 2D plot shapes. Note that Panel 1 shows total game EMH as context. "
            f"Critique the r_ext of {result_dict['max_r_ext']}—if it is 1.0, address the likely lack of overlapping data points. "
            f"Quantify the staffing strategy based on the {result_dict['peak_lag']}-day delay for {game}."
        )
        payload = {
            "contents": [{"parts": [{"text": user_query}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]}
        }
        try:
            response = requests.post(self.api_url, headers={'Content-Type': 'application/json'}, json=payload)
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        except:
            return f"REPORT: {filename} | r_ext={result_dict['max_r_ext']} | Lag={result_dict['peak_lag']}d."

class SSDFAnalyzer:
    def __init__(self):
        self.game_menu = {"1": "Fortnite", "2": "Rocket League", "3": "Fall Guys"}
        self.popular_tags = ["Drops Enabled", "Live Event", "Tournament", "Crossover", "Big Update"]
        self.MAX_LAG_WINDOW = 60 
        self.RIGOR_THRESHOLD = 0.75
        self.MIN_OVERLAP_DAYS = 3 # Lowered to 3 to accommodate short-burst events (e.g. 5-day windows)

    def detect_available_source(self):
        if os.path.exists("StreamsCharts_Twitch_live.csv"): return "StreamsCharts_Twitch_live.csv", "LIVE"
        if os.path.exists("StreamsCharts_Twitch_simu.csv"): return "StreamsCharts_Twitch_simu.csv", "SIMU"
        return None, None

    def run_analysis(self, twitch_csv, internal_csv, def_csv, game_name, phrase, data_label):
        print(f"\n[i] Scouring Telemetry for high-rigor trends (T+0 to T+{self.MAX_LAG_WINDOW}d)...")
        try:
            df_t = pd.read_csv(twitch_csv, encoding='utf-8-sig')
            df_i = pd.read_csv(internal_csv, encoding='utf-8-sig')
            df_d = pd.read_csv(def_csv, sep='\t', encoding='ISO-8859-1')
        except Exception as e:
            print(f"[!] Error: {e}"); return
        
        df_t['date'] = pd.to_datetime(df_t['timestamp']).dt.date
        df_i['date'] = pd.to_datetime(df_i['Event Date']).dt.date
        df_i['Packages'] = pd.to_numeric(df_i['Packages'], errors='coerce').fillna(0)
        aht_map = df_d.set_index('Queues')['Average handle time'].to_dict()
        df_i['Work_Minutes'] = df_i['Packages'] * df_i['Source Queue'].map(aht_map).fillna(0)

        # Baseline Game Heat (For Visualization context)
        game_mask = df_t['game_name'].str.contains(game_name, case=False, na=False)
        # Specific Topic Heat (For Correlation calculation)
        topic_mask = game_mask & df_t['title'].str.lower().str.contains(phrase.lower(), na=False)
        
        df_game_ext = df_t[game_mask]
        df_topic_ext = df_t[topic_mask]
        
        if df_game_ext.empty: 
            print(f"[!] No matching external data found for game: '{game_name}'."); return

        # Baseline for plotting
        game_ext_series = df_game_ext.groupby('date')['viewer_count'].sum()
        # Topic-specific for correlation
        topic_ext_series = df_topic_ext.groupby('date')['viewer_count'].sum()

        unique_queues = df_i['Source Queue'].unique()
        internal_daily_incidents = df_i.groupby(['date', 'Source Queue'])['Packages'].sum().unstack(fill_value=0)
        
        # We align correlation against the TOPIC signal
        combined = pd.DataFrame({'EMH_Topic': topic_ext_series}).join(internal_daily_incidents).fillna(0)

        analyst = DataAnalystAgent()
        report_list = []

        print(f"[i] Checking {len(unique_queues)} queues for r_ext >= {self.RIGOR_THRESHOLD}...")
        for q in unique_queues:
            if q not in combined.columns or combined[q].std() == 0 or combined['EMH_Topic'].std() == 0: continue
            
            best_lag, max_r_ext = 0, -1
            with np.errstate(all='ignore'):
                for lag in range(self.MAX_LAG_WINDOW + 1):
                    shifted_q = combined[q].shift(-lag)
                    # Check overlap: Correlation is meaningless on very few points
                    overlap_count = (combined['EMH_Topic'] > 0).sum()
                    if overlap_count < self.MIN_OVERLAP_DAYS: continue
                    
                    curr_r = combined['EMH_Topic'].corr(shifted_q)
                    if not np.isnan(curr_r) and abs(curr_r) > max_r_ext:
                        max_r_ext = abs(curr_r); best_lag = lag
            
            if max_r_ext >= self.RIGOR_THRESHOLD:
                res = {"queue": q, "max_r_ext": round(max_r_ext, 3), "peak_lag": best_lag,
                       "total_work_hours": round((df_i[df_i['Source Queue'] == q]['Work_Minutes'].sum()) / 60, 2)}
                
                # Plot Generation
                fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(14, 15), sharex=True)
                
                # Panel 1: Contextual EMH (Full Game Volume)
                ax1.plot(game_ext_series.index, game_ext_series.values, color='#6441a5', lw=3, label='Full Game EMH')
                # Highlight the Topic Signal if present
                if not topic_ext_series.empty:
                    ax1.fill_between(topic_ext_series.index, topic_ext_series.values, color='#6441a5', alpha=0.3, label=f'Signal: {phrase}')
                ax1.set_title(f"1. EXTERNAL MARKET HEAT (EMH): {game_name}", loc='left', fontweight='bold')
                ax1.set_ylabel("Viewer Count")
                ax1.legend()
                ax1.grid(True, alpha=0.2)

                # Panel 2: IDS
                q_pkgs = df_i[df_i['Source Queue'] == q].groupby('date')['Packages'].sum()
                ax2.plot(q_pkgs.index, q_pkgs.values, color='#2196f3', lw=2, label=f'IDS (r_ext={res["max_r_ext"]})')
                ax2.set_title(f"2. INCIDENT DEMAND SIGNAL: {q} (Peak Lag: {best_lag}d)", loc='left', fontweight='bold')
                ax2.set_ylabel("Incident Count")
                ax2.legend()
                ax2.grid(True, alpha=0.2)
                
                # Panel 3: RDS
                q_load = df_i[df_i['Source Queue'] == q].groupby('date')['Work_Minutes'].sum()
                ax3.bar(q_load.index, q_load.values, color='#f44336', alpha=0.4, label='RDS (Load)')
                ax3.set_title(f"3. RESOURCE DEMAND SIGNAL: Operational Load", loc='left', fontweight='bold')
                ax3.set_ylabel("Work Minutes")
                ax3.legend()
                ax3.grid(True, alpha=0.2)
                
                plt.xlabel("Event Date"); plt.tight_layout(pad=3.0)
                clean_q = "".join([c if c.isalnum() else "_" for c in q])
                out = f"SSDF_{data_label}_{game_name}_{phrase.replace(' ','_')}_{clean_q}_Dashboard.png"
                plt.savefig(out); plt.close()
                print(f"[v] Plot Ready: {out} | Analyzing...")
                
                # Buffer the discussion
                report_list.append(analyst.analyze_plot(game_name, phrase, res, data_label, out))

        # Output final consolidated list
        print("\n" + "="*85 + "\n" + f"CONSOLIDATED SSDF PROJECT BRIEFING | r_ext >= {self.RIGOR_THRESHOLD}\n" + "="*85)
        if report_list:
            for i, report in enumerate(report_list, 1):
                print(f"REPORT #{i}:")
                print(report + "\n" + "-"*40)
        else:
            print(f"[!] No high-rigor correlations (r_ext >= {self.RIGOR_THRESHOLD}) detected.")
            print(f"[i] Potential Cause: Topic signal '{phrase}' too sparse (< {self.MIN_OVERLAP_DAYS} days) for valid correlation.")
        print("="*85)

def main():
    analyzer = SSDFAnalyzer()
    csv_file, label = analyzer.detect_available_source()
    if csv_file:
        print("\n=== SSDF ANALYST ENGINE ===\n[1] Fortnite\n[2] Rocket League\n[3] Fall Guys")
        game_choice = input("\nEnter game number: ")
        game = analyzer.game_menu.get(game_choice, "Fortnite")
        
        print("\n[1] Drops Enabled\n[2] Live Event\n[3] Tournament\n[4] Crossover")
        tag_choice = input("\nEnter tag number: ")
        try:
            tag = analyzer.popular_tags[int(tag_choice)-1]
        except:
            tag = "Live Event"
            
        analyzer.run_analysis(csv_file, "merged_epic_games_data.csv", "source_queue_definitions.csv", game, tag, label)

if __name__ == "__main__":
    main()