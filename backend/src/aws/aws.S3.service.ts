import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AwsS3Service {
  private s3: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME')
      || this.configService.get<string>('AWS_BUCKET_NAME');

    if (!bucket) {
      throw new Error('AWS bucket name is not configured. Please set AWS_S3_BUCKET_NAME or AWS_BUCKET_NAME in .env');
    }

    this.bucketName = bucket; // TypeScript now knows it's a string

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken
      },
    });

    console.log('S3 Client initialized with bucket:', this.bucketName);
  }

  async uploadFile(file: Express.Multer.File): Promise<{ fileUrl: string, fileName: string }> {
    const fileKey = `${uuidv4()}-${file.originalname}`;
    
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    
    const region = this.configService.get<string>('AWS_REGION');
    const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    
    // Return both the URL and the original filename
    return { fileUrl, fileName: file.originalname };
  }

  

   async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    
    // The URL will be valid for 1 hour (3600 seconds)
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}

