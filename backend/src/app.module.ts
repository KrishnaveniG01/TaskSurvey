import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TaskCommentModule } from './taskManagement/taskComments/taskComments.module';
import { TaskAttachmentModule } from './taskManagement/taskAttachments/taskAttachments.module';
import { TaskAssignmentModule } from './taskManagement/taskAssignments/taskAssignments.module';
import { TaskModule } from './taskManagement/tasks/tasks.module'; 
import { EventsModule } from './processEvents/processEvents.module';
import { ProcessModule } from './processes/processes.module';
import { SurveyModule } from './survey/survey.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Default path
    }),

    AuthModule,
    EventsModule,
    ProcessModule,
    SurveyModule,
    TaskModule,
    TaskAssignmentModule,
    TaskAttachmentModule,
    TaskCommentModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || "yourSecretKey", // Better to read from env
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
