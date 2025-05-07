// lib/uploadToCloudinary.ts
import cloudinary from './cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'trips' },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}
