import os
import glob
from google.cloud import storage

# Helper script to execute Phase 2 data migration to GCS securely 
def upload_data_to_gcs(bucket_name="signal-flux-telemetry-archive"):
    """
    Uploads all historical telemetry databases and raw CSV trackers 
    from the local 'data' folder into the centralized Cloud Storage bucket.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    
    if not os.path.exists(data_dir):
        print(f"Error: Data directory {data_dir} not found.")
        return

    # Gather data files
    db_files = glob.glob(os.path.join(data_dir, "**", "*.db"), recursive=True)
    csv_files = glob.glob(os.path.join(data_dir, "**", "*.csv"), recursive=True)
    jsonl_files = glob.glob(os.path.join(data_dir, "**", "*.jsonl"), recursive=True)
    
    files_to_upload = db_files + csv_files + jsonl_files
    
    if not files_to_upload:
        print("No telemetry files found to upload.")
        return
        
    print(f"Discovered {len(files_to_upload)} telemetry files. Initializing GCS upload...")

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
    except Exception as e:
        print(f"Failed to initialize Google Cloud Storage Client: {e}")
        print("Ensure you have run `gcloud auth application-default login`.")
        return

    for file_path in files_to_upload:
        # Map local file structure precisely into bucket layout
        rel_path = os.path.relpath(file_path, data_dir)
        # Using forward slashes for GCP bucket objects
        blob_path = rel_path.replace(os.path.sep, '/')
        
        blob = bucket.blob(blob_path)
        print(f"Uploading {rel_path} to gs://{bucket_name}/{blob_path} ...", end=" ")
        
        try:
            blob.upload_from_filename(file_path)
            print("OK")
        except Exception as e:
            print(f"FAILED ({e})")
            
    print("\nPhase 2 GCS Migration Complete!")

if __name__ == "__main__":
    upload_data_to_gcs()
