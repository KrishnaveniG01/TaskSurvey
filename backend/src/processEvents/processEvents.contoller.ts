import { Body, Controller ,Get,Post,Req} from "@nestjs/common"
import { ProcessEventsService } from "./processEvents.service"
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
 
@Controller('events')
export class ProcessEventsController{
    constructor(private readonly processEventsService: ProcessEventsService) { }

@UseGuards(AuthGuard('jwt'))
 @Get('/getEvents')
 async getEvents(@Req() req:Request){
   const user1= (req as any).user;
     const role =user1.role
     console.log("role value is :", role)
    return await this.processEventsService.getEventsByRole(role);
 }

 @UseGuards(AuthGuard('jwt')) 
  @Post('bulk-verify-access')
  checkAccess(@Body() body: any, @Req() req) {
    return this.processEventsService.bulkVerifyUserAccess(body, req.user);
  }
}