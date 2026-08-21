const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
async function test() {
  const client = new S3Client({
    region: 'auto',
    endpoint: 'https://1a2b3c.r2.cloudflarestorage.com',
    credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' }
  });
  try {
    await client.send(new PutObjectCommand({
      Bucket: 'fake-bucket',
      Key: 'test.jpg',
      Body: 'hello'
    }));
  } catch(e) {
    console.log("Status Code:", e.$metadata?.httpStatusCode);
    console.log("Error Name:", e.name);
  }
}
test();
