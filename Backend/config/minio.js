import dotenv from "dotenv";
import { Client } from "minio";

dotenv.config();

const hasMinioConfig = Boolean(process.env.MINIO_ENDPOINT || process.env.MINIO_HOST || process.env.MINIO_ACCESS_KEY || process.env.MINIO_SECRET_KEY);
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || process.env.MINIO_HOST || (hasMinioConfig ? "127.0.0.1" : "s3.amazonaws.com");
const MINIO_PORT = parseInt(process.env.MINIO_PORT || (hasMinioConfig ? "9000" : "443"), 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL ? process.env.MINIO_USE_SSL.toLowerCase() === "true" : !hasMinioConfig;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
const BUCKET = process.env.MINIO_BUCKET || process.env.AWS_BUCKET_NAME || "docvault";

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
  throw new Error("Missing MinIO/S3 credentials for MinIO client. Set MINIO_ACCESS_KEY/MINIO_SECRET_KEY or AWS_ACCESS_KEY_ID/AWS_ACCESS_KEY and AWS_SECRET_ACCESS_KEY/AWS_SECRET_KEY");
}

const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, "us-east-1");
      console.log(`Created bucket '${BUCKET}'`);
    } else {
      console.log(`Bucket '${BUCKET}' exists`);
    }
  } catch (err) {
    console.error("MinIO bucket check/create failed", err);
    throw err;
  }
};

await ensureBucket();

console.log(`MinIO client initialized: endpoint=${MINIO_ENDPOINT}:${MINIO_PORT} ssl=${MINIO_USE_SSL} bucket=${BUCKET}`);

export { minioClient, BUCKET };
