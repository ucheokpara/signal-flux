import sys
import json
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64

def generate_plot(data, left_key="Demand", right_key="Incidents", title="Trajectory Plot"):
    if not data:
        return ""
        
    timestamps = [d.get('time', '') for d in data]
    
    # Handle potentially missing or differently named keys gracefully
    left_data = [d.get(left_key, 0) for d in data]
    right_data = [d.get(right_key, 0) for d in data]
    
    plt.style.use('default')
    fig, ax1 = plt.subplots(figsize=(10, 5), facecolor='white')
    ax1.set_facecolor('white')
    
    line1 = ax1.plot(timestamps, left_data, label=left_key, color='#2563eb', linewidth=2)
    ax1.set_ylabel(left_key, color='#2563eb', fontsize=11, fontweight='bold')
    ax1.tick_params(axis='y', labelcolor='#2563eb')
    
    ax2 = ax1.twinx()
    line2 = ax2.plot(timestamps, right_data, label=right_key, color='#dc2626', linewidth=2)
    ax2.set_ylabel(right_key, color='#dc2626', fontsize=11, fontweight='bold')
    ax2.tick_params(axis='y', labelcolor='#dc2626')
    
    lines = line1 + line2
    labels = [l.get_label() for l in lines]
    ax1.legend(lines, labels, loc='lower left', fontsize=10)
    
    n = max(1, len(timestamps) // 8)
    ax1.set_xticks(range(0, len(timestamps), n))
    ax1.set_xticklabels([timestamps[i] for i in range(0, len(timestamps), n)], rotation=45, ha='right', fontsize=9)
    
    plt.title(f'{title} (CST)', fontsize=14, pad=10, fontweight='bold')
    ax1.set_xlabel('Observation Time (CST)', fontsize=11, fontweight='bold')
    ax1.grid(True, linestyle=':', alpha=0.6, color='#94a3b8')
    
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

if __name__ == "__main__":
    try:
        json_str = sys.stdin.read()
        payload = json.loads(json_str)
        
        if isinstance(payload, dict) and "data" in payload:
            data = payload.get("data", [])
            left_key = payload.get("leftKey", "Demand Score (D)")
            right_key = payload.get("rightKey", "Actual Incident Demand")
            title = payload.get("title", "Trajectory Plot")
            print(generate_plot(data, left_key, right_key, title))
        else:
            # Fallback to old array format
            print(generate_plot(payload))
    except Exception as e:
        print("ERROR:", str(e))
