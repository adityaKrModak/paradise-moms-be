import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { BadRequestException } from '@nestjs/common';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFile', () => {
    it('should throw error for oversized file', () => {
      const mockFile = {
        size: 6 * 1024 * 1024, // 6MB
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      expect(() => service['validateFile'](mockFile)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid file type', () => {
      const mockFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      expect(() => service['validateFile'](mockFile)).toThrow(
        BadRequestException,
      );
    });

    it('should pass validation for valid file', () => {
      const mockFile = {
        size: 1024 * 1024, // 1MB
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      expect(() => service['validateFile'](mockFile)).not.toThrow();
    });
  });

  describe('generateFolderPath', () => {
    it('should generate correct folder path with category', () => {
      const result = service['generateFolderPath']('product' as any);
      expect(result).toBe('paradise-moms/product');
    });

    it('should generate correct folder path with custom folder', () => {
      const result = service['generateFolderPath'](undefined, 'custom-folder');
      expect(result).toBe('paradise-moms/custom-folder');
    });

    it('should generate default folder path', () => {
      const result = service['generateFolderPath']();
      expect(result).toBe('paradise-moms/general');
    });
  });
});
