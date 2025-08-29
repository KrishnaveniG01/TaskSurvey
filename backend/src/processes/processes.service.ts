import { Injectable } from '@nestjs/common';
import { eventAndProcessDB } from 'src/database/eventsDB'; // replace with your DB client

@Injectable()
export class ProcessService {
  async getAllActiveProcesses() {
    const [processes] = await eventAndProcessDB.query(
      `SELECT processId, processName FROM orgProcesses WHERE recStatus = 'A'`
    );
    return processes;
  }
}
