import { Module } from '@nestjs/common';
import { taskDB } from './taskDB';
import { authDB } from './authDB';

@Module({
  providers: [
    {
      provide: 'TASK_DB_CONNECTION', 
      useClass: taskDB, 
    },
    {
      provide: 'AUTH_DB_CONNECTION', 
      useClass: authDB, 
    },
  ],
  
  exports: ['TASK_DB_CONNECTION', 'AUTH_DB_CONNECTION'],
})
export class DatabaseModule {}

