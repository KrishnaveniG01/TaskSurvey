import { Module } from '@nestjs/common';
import { ProcessController } from './processes.controller';
import { ProcessService } from './processes.service';// If you have a service

@Module({
  controllers: [ProcessController],
  providers: [ProcessService], // If using a service
})
export class ProcessModule {}
