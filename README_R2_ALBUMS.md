# R2 Albums Setup

To complete the setup for Cloudflare R2 albums storage:

1. **Configure Environment Variables**:
   In your AI Studio project settings (or `.env` file), configure the following variables:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret_key
   R2_BUCKET_NAME=your_bucket_name
   ```

2. **Create Supabase Table**:
   Run the provided `schema-r2-albums.sql` script in your Supabase SQL Editor to create the `albums_r2` table to store metadata.

3. **Configure R2 Bucket CORS**:
   Ensure your R2 bucket has a CORS policy configured to allow PUT requests from your domain for the presigned URL uploads. You can set this in the Cloudflare dashboard or via the S3 API.
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

4. **Public Access**:
   Make sure your R2 bucket allows public read access (or has a custom domain configured) so that the generated image URLs can be viewed by anyone who has the link.
