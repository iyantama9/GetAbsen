const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config/env');
const crypto = require('crypto');
const path = require('path');

const s3Client = config.r2.accountId ? new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
}) : null;

async function uploadFile(file, folder = 'uploads') {
  if (!s3Client) {
    console.warn('[R2] Not configured, skipping upload');
    return `https://placeholder.local/${folder}/${file.originalname}`;
  }

  const ext = path.extname(file.originalname);
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return config.r2.publicUrl
    ? `${config.r2.publicUrl}/${key}`
    : `https://${config.r2.bucketName}.${config.r2.accountId}.r2.cloudflarestorage.com/${key}`;
}

module.exports = { uploadFile };
