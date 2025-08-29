import { JwtService } from "@nestjs/jwt";
import { ProcessEventsController } from "./processEvents.contoller";
import { ProcessEventsService } from "./processEvents.service";
import { Module } from '@nestjs/common';
import { authDB } from "src/database/authDB";
@Module({
  controllers: [ProcessEventsController],
  providers: [ProcessEventsService, JwtService, authDB],
})
export class EventsModule {}
