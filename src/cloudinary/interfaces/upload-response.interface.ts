import { UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadResponse extends UploadApiResponse {}

export interface OptimizedImageUrls {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  webp: string;
  avif: string;
}
