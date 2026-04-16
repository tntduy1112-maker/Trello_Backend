const Minio = require('minio');
const env = require('./env');

const client = new Minio.Client({
  endPoint: env.minio.endpoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey,
});

/**
 * Ensure the default bucket exists with public-read policy.
 * Called once on app startup.
 */
const initBucket = async () => {
  const bucket = env.minio.bucket;
  try {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket, 'us-east-1');
      // Set bucket policy: allow anonymous GET (public read)
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      });
      await client.setBucketPolicy(bucket, policy);
      console.log(`[MinIO] Bucket "${bucket}" created with public-read policy`);
    } else {
      console.log(`[MinIO] Bucket "${bucket}" already exists`);
    }
  } catch (err) {
    console.error('[MinIO] initBucket error:', err.message);
    throw err;
  }
};

module.exports = { client, initBucket };
