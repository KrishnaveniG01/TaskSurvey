import { 
    Body, 
    Controller, 
    Delete, 
    Get, 
    Param, 
    Patch, 
    Post, 
    Query, 
    UploadedFiles, 
    UseInterceptors,
    UseGuards,
    Request,
    Put,
    NotFoundException,
    UploadedFile
} from "@nestjs/common";
import { TaskService } from './tasks.service';
import { CreateTaskDto } from "./dto/create-task.dto";
import { FileInterceptor, FilesInterceptor, NoFilesInterceptor } from "@nestjs/platform-express";
import { TaskQueryDto } from "./dto/query-task.dto";
import { JwtAuthGuard } from "src/auth/guards/auth.guard";
import { AuthGuard } from "@nestjs/passport";


@Controller('tasks')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('attachments')) 
    create(
        @Request() req,
        @Body() createTaskDto : CreateTaskDto,
        @UploadedFiles() files: Array<Express.Multer.File> 
    ) {
        console.log('DTO received in controller:', createTaskDto);
        console.log('Files received in controller:', files);

        
        return this.taskService.create(createTaskDto, req.user, files);
    }


    @Get('alltasks')
    findAll(@Query() queryDto: TaskQueryDto) {
        return this.taskService.findAll(queryDto);
    }

    
    @Post('save-draft')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(NoFilesInterceptor()) 
    saveDraft(
        @Request() req,
        @Body() createTaskDto: CreateTaskDto,
    ) {
        // This correctly calls the saveDraft service method
        return this.taskService.saveDraft(createTaskDto, req.user);
    }
   
    @Put('publish/:taskId') // Use PUT for updating/publishing an existing resource
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('attachments')) // Allow files when publishing
    async publishDraft(
        @Param('taskId') taskId: string, 
        @Body() updateTaskDto: CreateTaskDto, // The endpoint must receive the full, updated task data
        @Request() req
    ) {
      // This correctly calls the publishDraft service method with all required data
      return await this.taskService.publishDraft(taskId, updateTaskDto, req.user);
    }
  

    @Get('user/:userId')
    findTaskByUser (
        @Param('userId') userId: string,
        @Query() queryDto: TaskQueryDto 
    ){
        return this.taskService.findTaskByUser(userId, queryDto);
    } 

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.taskService.findOne(id);
    }

    @Get('drafts/:userId')
    async getDraftTasks(@Param('userId') userId: string) {
        return await this.taskService.getDraftTasks(userId);
    }
   
   
    @Delete(':id')
    remove(@Param('id') id : string) {
        return this.taskService.remove(id);
    }
    @Get('created-by/:userId')
    findTasksCreatedBy(
        @Param('userId') userId: string,
        @Query() queryDto: TaskQueryDto
    ) {
        return this.taskService.findTasksCreatedBy(userId, queryDto);
    }
    @Get('assigned-to/:userId')
  findTasksAssignedTo(
    @Param('userId') userId: string,
    @Query() queryDto: TaskQueryDto,
  ) {
    return this.taskService.findTasksAssignedTo(userId, queryDto);
  }
  @Get('reviewed-by/:userId')
  findTasksForReviewer(
    @Param('userId') userId: string,
    @Query() queryDto: TaskQueryDto,
  ) {
    return this.taskService.findTasksForReviewer(userId, queryDto);
  }

    @Get(':taskId')
async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.findTaskDetails(taskId);
}
@Get('assigned-to/:userId/categorized')
async getCategorizedTasks(@Param('userId') userId: string) {
    return this.taskService.getCategorizedTasksForUser(userId);
}
@Get(':taskId/details')
async getTaskDetails(@Param('taskId') taskId: string) {
    const taskDetails = await this.taskService.findTaskDetails(taskId);
    if (!taskDetails) {
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }
    return taskDetails;
}
@Get('reviewed-by/:userId/categorized')
    async getCategorizedTasksForReviewer(@Param('userId') userId: string) {
        return this.taskService.findCategorizedTasksForReviewer(userId);
    }


@UseGuards(AuthGuard('jwt'))
@Post(':taskId/submit')
@UseInterceptors(FileInterceptor('proofFile')) // 'proofFile' is the field name from the form
async submitTask(
    @Param('taskId') taskId: string,
    @Body() body: { commentText: string },
    @UploadedFile() file: Express.Multer.File,
    @Request() req, // To get the logged-in user
) {
    const userId = req.user.userId;
    const { commentText } = body;

    return this.taskService.submitTaskCompletion(
        taskId,
        userId,
        commentText,
        file,
    );
}
@UseGuards(AuthGuard('jwt'))
@Post(':taskId/review')
async reviewTask(
    @Param('taskId') taskId: string,
    @Body() body: { action: 'approve' | 'reject', comment?: string },
    @Request() req,
) {
    const managerId = req.user.userId;
    const { action, comment } = body;
    return this.taskService.reviewTask(taskId, managerId, action, comment);
}
@Post('request-handover')
@UseGuards(JwtAuthGuard)
async requestHandover(@Body() body: { taskIds: string[] }, @Request() req) {
    const employeeId = req.user.userId;
    return this.taskService.requestHandover(body.taskIds, employeeId);
}
@Get('handover-requests')
@UseGuards(JwtAuthGuard) // Add role-based guard for admin
async getHandoverRequests() {
    return this.taskService.getPendingHandovers();
}
@Post('handover-requests/:handoverId/action')
@UseGuards(JwtAuthGuard) // Add role-based guard for admin
async actionHandoverRequest(
    @Param('handoverId') handoverId: string,
    @Body() body: { action: 'approve' | 'reject', newEmployeeId?: string },
    @Request() req
) {
    const adminId = req.user.userId;
    return this.taskService.actionHandover(handoverId, body.action, adminId, body.newEmployeeId);
}

}
