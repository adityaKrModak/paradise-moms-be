import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadImageDto: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(file, {
        folder: uploadImageDto.folder,
        category: uploadImageDto.category,
        width: uploadImageDto.width,
        height: uploadImageDto.height,
        transformation: uploadImageDto.transformation,
      });

      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          publicId: result.uploadResult.public_id,
          originalUrl: result.uploadResult.secure_url,
          optimizedUrls: result.optimizedUrls,
          metadata: {
            width: result.uploadResult.width,
            height: result.uploadResult.height,
            format: result.uploadResult.format,
            bytes: result.uploadResult.bytes,
            folder: result.uploadResult.folder,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('images/bulk')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadImageDto: UploadImageDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per request');
    }

    try {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadImage(file, {
          folder: uploadImageDto.folder,
          category: uploadImageDto.category,
          width: uploadImageDto.width,
          height: uploadImageDto.height,
          transformation: uploadImageDto.transformation,
        }),
      );

      const results = await Promise.all(uploadPromises);

      return {
        success: true,
        message: `${results.length} images uploaded successfully`,
        data: results.map((result) => ({
          publicId: result.uploadResult.public_id,
          originalUrl: result.uploadResult.secure_url,
          optimizedUrls: result.optimizedUrls,
          metadata: {
            width: result.uploadResult.width,
            height: result.uploadResult.height,
            format: result.uploadResult.format,
            bytes: result.uploadResult.bytes,
            folder: result.uploadResult.folder,
          },
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('image/:publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    try {
      // Decode the public ID (it might be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);

      await this.cloudinaryService.deleteImage(decodedPublicId);

      return {
        success: true,
        message: 'Image deleted successfully',
        data: { publicId: decodedPublicId },
      };
    } catch (error) {
      throw error;
    }
  }
}
