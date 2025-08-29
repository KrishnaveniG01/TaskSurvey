import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { TaskAssignmentService } from "./taskAssignments.service";
import { TaskQueryDto } from "../tasks/dto/query-task.dto";

@Controller('tasks/:taskId/assignments')
export class TaskAssignmentsController {
    constructor(private readonly taskAssignmentService: TaskAssignmentService){}

    @Post()
    create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() assignmentData : any
    ){
        return this.taskAssignmentService.create({...assignmentData, taskId});
    }

    @Get()
    findByTaskId(@Param('taskId', ParseUUIDPipe) taskId : string) {
        return this.taskAssignmentService.findByTaskId(taskId);
    }

    @Get('user/:userId')
    findByUserId (
        @Param('userId') userId: string,
        @Query() queryDto: TaskQueryDto
    ){
        return this.taskAssignmentService.findByUserId(userId, queryDto);
    } 

    @Patch(':assignmentId/:recSeq')
    update(
        @Param('assignmentId') assignmentId: string,
        @Param('recSeq', ParseIntPipe) recSeq: number,
        @Body() updateData: any
    ) {
        return this.taskAssignmentService.update(assignmentId, recSeq, updateData);
    }

    @Delete(':assignmentId/:recSeq')
    remove(
        @Param('assignmentId') assignmentId: string,
        @Param('recSeq', ParseIntPipe) recSeq : number
) {
    return this.taskAssignmentService.remove(assignmentId, recSeq);
}
}