import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  storage: 'local' | 's3';
}

export interface UploadOptions {
  userId: string;
  folder?: string;
  preserveOriginalName?: boolean;
  maxSize?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly useS3: boolean;
  private readonly localUploadPath: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET', '');
    this.localUploadPath = path.join(process.cwd(), 'uploads');

    // Determine if S3 is configured
    this.useS3 = !!(
      this.configService.get('AWS_ACCESS_KEY_ID') &&
      this.configService.get('AWS_SECRET_ACCESS_KEY') &&
      this.bucketName
    );

    if (this.useS3) {
      this.s3Client = new S3Client({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });
      this.logger.log('✅ S3 upload service initialized');
    } else {
      this.logger.log(
        '📁 Local upload service initialized (S3 not configured)',
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadResult> {
    try {
      this.logger.log(
        `📤 Starting upload: ${file.originalname} (${file.size} bytes)`,
      );

      // Validate file
      await this.validateFile(file, options);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const baseName = options.preserveOriginalName
        ? file.originalname.replace(fileExtension, '')
        : uuidv4();
      const fileName = `${baseName}${fileExtension}`;

      const folder = options.folder || 'invoices';
      const key = `${folder}/${options.userId}/${fileName}`;

      let result: UploadResult;

      if (this.useS3) {
        try {
          result = await this.uploadToS3(file, key);
        } catch (s3Error) {
          this.logger.warn(
            `⚠️ S3 upload failed, falling back to local storage: ${s3Error.message}`,
          );
          result = await this.uploadToLocal(file, key);
        }
      } else {
        result = await this.uploadToLocal(file, key);
      }

      this.logger.log(`✅ Upload successful: ${result.url}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async validateFile(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<void> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      throw new Error(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Check MIME type
    const defaultAllowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const allowedTypes = options.allowedMimeTypes || defaultAllowedTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check if file is actually readable
    if (!file.buffer && !file.path) {
      throw new Error('File data is not accessible');
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer || (await fs.readFile(file.path)),
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
        },
      });

      await this.s3Client.send(uploadCommand);

      const url = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION', 'us-east-1')}.amazonaws.com/${key}`;

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storage: 's3',
      };
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error.message}`);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    try {
      const fullPath = path.join(this.localUploadPath, key);
      const directory = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      const fileData = file.buffer || (await fs.readFile(file.path));
      await fs.writeFile(fullPath, fileData);

      const url = `/uploads/${key}`;

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storage: 'local',
      };
    } catch (error) {
      this.logger.error(`Local upload failed: ${error.message}`);
      throw new Error(`Failed to upload locally: ${error.message}`);
    }
  }

  async deleteFile(key: string, storage: 'local' | 's3'): Promise<void> {
    try {
      if (storage === 's3' && this.useS3) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
        await this.s3Client.send(deleteCommand);
        this.logger.log(`🗑️ Deleted S3 file: ${key}`);
      } else {
        const fullPath = path.join(this.localUploadPath, key);
        await fs.unlink(fullPath);
        this.logger.log(`🗑️ Deleted local file: ${key}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file ${key}: ${error.message}`);
    }
  }

  getUploadInfo(): { storage: 'local' | 's3'; configured: boolean } {
    return {
      storage: this.useS3 ? 's3' : 'local',
      configured: this.useS3,
    };
  }
}
