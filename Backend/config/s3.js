import { S3Client } from "@aws-sdk/client-s3";

let s3Instance = null;
let initializationAttempted = false;

// Initialize S3 client on first use
const getS3Client = () => {
  if (s3Instance) {
    return s3Instance;
  }

  if (initializationAttempted && !s3Instance) {
    throw new Error("S3 Client initialization failed. Check AWS configuration.");
  }

  initializationAttempted = true;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

  const missingEnvVars = [];

  if (!accessKeyId) {
    missingEnvVars.push("AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY");
  }
  if (!secretAccessKey) {
    missingEnvVars.push("AWS_SECRET_ACCESS_KEY or AWS_SECRET_KEY");
  }
  if (!region) {
    missingEnvVars.push("AWS_REGION or AWS_DEFAULT_REGION");
  }

  if (missingEnvVars.length > 0) {
    const message = `Missing AWS configuration: ${missingEnvVars.join(", ")}`;
    console.error("❌", message);
    throw new Error(message);
  }

  try {
    s3Instance = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log(" S3 Client initialized");
    console.log("   Region:", region);
    console.log("   Bucket:", process.env.AWS_BUCKET_NAME || process.env.MINIO_BUCKET);

    return s3Instance;
  } catch (error) {
    console.error(" Failed to initialize S3 Client:", error.message);
    throw error;
  }
};

// Create a proxy that initializes S3 on first actual use
const s3Proxy = new Proxy({}, {
  get(target, prop) {
    const client = getS3Client();
    return client[prop];
  },
  has(target, prop) {
    const client = getS3Client();
    return prop in client;
  },
  ownKeys(target) {
    const client = getS3Client();
    return Object.keys(client);
  },
  getOwnPropertyDescriptor(target, prop) {
    const client = getS3Client();
    return Object.getOwnPropertyDescriptor(client, prop);
  },
});

console.log(" S3 module loaded (lazy initialization enabled)");

export const s3Client = s3Proxy;
export default s3Proxy;
