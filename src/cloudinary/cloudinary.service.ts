import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  CloudinaryUploadResponse,
  OptimizedImageUrls,
} from './interfaces/upload-response.interface';
import { ImageCategory } from './dto/upload-image.dto';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }
  async uploadImage(
    file: Express.Multer.File,
    options: {
      folder?: string;
      category?: ImageCategory;
      width?: number;
      height?: number;
      transformation?: string;
    } = {},
  ): Promise<{
    uploadResult: CloudinaryUploadResponse;
    optimizedUrls: OptimizedImageUrls;
  }> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate folder path
      const folder = this.generateFolderPath(options.category, options.folder);

      // Upload configuration with optimization
      const uploadOptions = {
        folder,
        resource_type: 'image' as const,
        ...(this.buildTransformation(options).length > 0 && {
          transformation: this.buildTransformation(options),
        }),
      };

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        uploadOptions,
      );

      // Generate optimized URLs
      const optimizedUrls = this.generateOptimizedUrls(uploadResult.public_id);

      return {
        uploadResult: uploadResult as CloudinaryUploadResponse,
        optimizedUrls,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, and GIF files are allowed',
      );
    }
  }

  private generateFolderPath(
    category?: ImageCategory,
    customFolder?: string,
  ): string {
    const baseFolder = 'paradise-moms';

    if (customFolder) {
      return `${baseFolder}/${customFolder}`;
    }

    if (category) {
      return `${baseFolder}/${category}`;
    }

    return `${baseFolder}/general`;
  }

  private buildTransformation(options: {
    width?: number;
    height?: number;
    transformation?: string;
  }): string[] {
    const transformations: string[] = [];

    // Add custom transformation if provided
    if (options.transformation) {
      transformations.push(options.transformation);
    }

    // Add resize transformation if dimensions provided
    if (options.width || options.height) {
      let resize = 'c_fill';
      if (options.width) resize += `,w_${options.width}`;
      if (options.height) resize += `,h_${options.height}`;
      transformations.push(resize);
    }

    // Quality and format optimization is handled in URL generation, not upload transformation
    return transformations;
  }

  private generateOptimizedUrls(publicId: string): OptimizedImageUrls {
    return {
      original: cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
      }),
      thumbnail: cloudinary.url(publicId, {
        width: 150,
        height: 150,
        crop: 'fill',
        fetch_format: 'auto',
        quality: 'auto:good',
      }),
      medium: cloudinary.url(publicId, {
        width: 500,
        height: 500,
        crop: 'limit',
        fetch_format: 'auto',
        quality: 'auto:good',
      }),
      large: cloudinary.url(publicId, {
        width: 1200,
        height: 1200,
        crop: 'limit',
        fetch_format: 'auto',
        quality: 'auto:good',
      }),
      webp: cloudinary.url(publicId, {
        fetch_format: 'webp',
        quality: 'auto:good',
      }),
      avif: cloudinary.url(publicId, {
        fetch_format: 'avif',
        quality: 'auto:good',
      }),
    };
  }
}
