
import { LogEntry } from '../types';

/**
 * Uploads a batch of log entries to Google Cloud Storage.
 * Uses the JSON API: POST https://storage.googleapis.com/upload/storage/v1/b/[BUCKET]/o
 */
export async function uploadLogsToGCS(
  bucketName: string,
  folderPath: string,
  authToken: string,
  logs: LogEntry[]
): Promise<boolean> {
  if (!bucketName || !authToken || logs.length === 0) return false;

  // 1. Generate a unique filename based on timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const filename = `${folderPath.replace(/\/$/, '')}/telemetry_${timestamp}.json`;

  // 2. Prepare the payload
  const fileContent = JSON.stringify(logs, null, 2);
  const metadata = {
    name: filename,
    contentType: 'application/json',
  };

  // 3. Construct the multipart request body
  // GCS requires a specific multipart format for uploading metadata + media in one go,
  // OR we can use the 'resumable' or simple 'media' upload types.
  // For simplicity and client-side ease, we'll use the 'uploadType=media' with query param name,
  // effectively uploading just the content. 
  // To set the name/path properly, we use the endpoint:
  // https://storage.googleapis.com/upload/storage/v1/b/[BUCKET_NAME]/o?uploadType=media&name=[OBJECT_NAME]
  
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GCS Upload Failed:', errorText);
      throw new Error(`GCS Upload Error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('GCS Service Error:', error);
    throw error;
  }
}
