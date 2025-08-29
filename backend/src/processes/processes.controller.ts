import { Controller, Get } from '@nestjs/common';
import { ProcessService } from './processes.service';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Get()
  async getActiveProcesses() {
    return this.processService.getAllActiveProcesses();
  }
}
