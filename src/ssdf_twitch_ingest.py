import os
import csv
import random
from datetime import datetime, timedelta

# SSDF Project - Phase 1: Unified Ingestion & Stochastic Entropy Simulation
# Lead: Uche Okpara
# Purpose: Extract 4.1 Ingress Fields with High-Fidelity Stochastic Modeling.
# Logic: Unified ingestion tool. Generates EMH telemetry with Gaussian entropy.

class SSDFIngestor:
    def __init__(self, env_file_path=".env"):
        self.base_url = "https://streamscharts.com/api/jazz"
        self.client_id, self.token = self._load_credentials(env_file_path)
        self.is_authenticated = self.client_id is not None and self.token is not None
        
        # Alignment Window
        self.start_date = "2025-10-01"
        self.end_date = "2026-01-08"

        # Signal vocabulary for simulation
        self.sim_topics = [
            "Drops Enabled", "Live Event", "Tournament", "Season Launch", 
            "Ranked Grind", "Creative/UEFN", "Crossover", "Big Update", "Pro Play"
        ]

        if not self.is_authenticated:
            print("\n[!] STATUS: SIMULATION MODE ACTIVE (No .env found)")
            self.output_file = "StreamsCharts_Twitch_simu.csv"
        else:
            print(f"\n[v] STATUS: PRODUCTION MODE ACTIVE (Authenticated)")
            self.output_file = "StreamsCharts_Twitch_live.csv"

    def _load_credentials(self, path):
        cid, tkn = None, None
        if not os.path.exists(path): return None, None
        try:
            with open(path, 'r') as f:
                for line in f:
                    if "client_id =" in line: cid = line.split("=")[1].strip()
                    if "token =" in line: tkn = line.split("=")[1].strip()
            return cid, tkn
        except Exception: return None, None

    def _generate_sim_json(self, channel_name, game_name):
        """Generates realistic telemetry with Gaussian entropy to prevent mathematical locks."""
        start_dt = datetime.strptime(self.start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(self.end_date, "%Y-%m-%d")
        days = (end_dt - start_dt).days
        
        mock_data = []
        base_viewers = random.randint(1800, 2500)
        
        for i in range(days + 1):
            curr_date = start_dt + timedelta(days=i)
            
            # --- STOCHASTIC ENTROPY ENGINE ---
            # 1. Random Walk: Long-term viewership drift
            base_viewers += random.gauss(0, 80) 
            base_viewers = max(1200, min(8000, base_viewers))
            
            # 2. Daily Volatility: Daily noise floor
            daily_variance = random.uniform(0.70, 1.30)
            
            # 3. Seasonal Spike: Non-linear event logic
            is_event = (curr_date.month == 12 and 1 <= curr_date.day <= 5)
            event_amp = random.uniform(3.5, 9.0) if is_event else 1.0
            
            viewer_count = int(base_viewers * daily_variance * event_amp)
            topic = random.choice(self.sim_topics)
            
            mock_data.append({
                "id": f"sc_sess_{random.randint(100000, 999999)}",
                "user_id": f"u_{channel_name.lower()}",
                "user_login": channel_name,
                "game_id": "33214" if game_name == "Fortnite" else "12345",
                "game_name": game_name,
                "title": f"{topic.upper()} | {game_name} LIVE EVENT" if is_event else f"{game_name} Stream",
                "tags": [topic, "Battle Royale"] if game_name == "Fortnite" else [topic, "Racing"],
                "language": "en",
                "is_mature": False,
                "viewer_count": viewer_count,
                "started_at": f"{curr_date.strftime('%Y-%m-%d')}T09:00:00Z",
                "source": "SSDF_Stochastic_Engine_v5",
                "timestamp": f"{curr_date.strftime('%Y-%m-%d')}T18:00:00Z"
            })
        return {"data": mock_data}

    def export_ingress_bigquery(self, data_dict):
        try:
            from google.cloud import bigquery
        except ImportError:
            print("[!] FATAL: google-cloud-bigquery package is missing. Please install it.")
            return

        client = bigquery.Client()
        dataset_id = "signal_flux_telemetry"
        table_id = "external_streams"
        table_ref = f"{client.project}.{dataset_id}.{table_id}"
        
        rows_to_insert = []
        for streamer, payload in data_dict.items():
            for record in payload.get('data', []):
                if isinstance(record.get('tags'), list): 
                    record['tags'] = "|".join(record['tags'])
                rows_to_insert.append(record)
                
        if not rows_to_insert:
            print("[v] No records generated for ingestion.")
            return

        print(f"[>] Streaming {len(rows_to_insert)} records to BigQuery: {dataset_id}.{table_id}...")
        errors = client.insert_rows_json(table_ref, rows_to_insert)
        
        if not errors:
            print("[v] UNIFIED INGRESS COMPLETE: Successfully streamed to BigQuery")
        else:
            print(f"[!] ENCOUNTERED ERRORS DURING BIGQUERY STREAMING: {errors}")

def main():
    ingestor = SSDFIngestor()
    results = {
        "Ninja": ingestor._generate_sim_json("Ninja", "Fortnite"),
        "Squishy": ingestor._generate_sim_json("SquishyMuffinz", "Rocket League")
    }
    ingestor.export_ingress_bigquery(results)

if __name__ == "__main__":
    main()