import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = configService.get<string>('MINIO_ENDPOINT');
    const accessKey = configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = configService.get<string>('MINIO_SECRET_KEY');
    const region = configService.get<string>('MINIO_REGION') || 'us-east-1';

    this.bucketName = configService.get<string>('MINIO_BUCKET') || 'brainbattle';
    this.publicBaseUrl = configService.get<string>('MINIO_PUBLIC_BASE_URL') || 
      `${endpoint}/${this.bucketName}`;

    // Create S3Client for MinIO (S3-compatible)
    this.s3Client = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    // Attempt to create bucket if it doesn't exist (idempotent)
    try {
      await this.ensureBucketExists();
      this.logger.log(`MinIO bucket '${this.bucketName}' is ready`);
    } catch (error) {
      this.logger.warn(
        `Failed to ensure bucket exists: ${error}. Please create bucket '${this.bucketName}' manually in MinIO console.`,
      );
    }
  }

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists() {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`Bucket '${this.bucketName}' already exists`);
    } catch (error: any) {
      // If bucket doesn't exist (404), create it
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Creating bucket '${this.bucketName}'...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Upload file to MinIO
   * @param key Object key (path in bucket)
   * @param buffer File buffer
   * @param contentType MIME type
   * @returns Public URL of uploaded file
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      // Return public URL
      const publicUrl = `${this.publicBaseUrl}/${key}`;
      this.logger.log(`File uploaded: ${key}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Generate object key for avatar
   * Format: avatars/{userId}/{timestamp}-{random}.{ext}
   */
  generateAvatarKey(userId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const ext = originalFilename.split('.').pop() || 'jpg';
    return `avatars/${userId}/${timestamp}-${random}.${ext}`;
  }
}

