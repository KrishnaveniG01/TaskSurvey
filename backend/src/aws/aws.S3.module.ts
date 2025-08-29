import { Module } from '@nestjs/common';
import { AwsS3Service } from './aws.S3.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AwsS3Service],
  exports: [AwsS3Service],
})
export class AwsModule {}
