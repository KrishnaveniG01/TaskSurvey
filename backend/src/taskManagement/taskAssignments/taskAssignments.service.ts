import { Injectable, NotFoundException } from "@nestjs/common";
import { TaskAssignmentRepository } from "./taskAsssignments.repository";
import { RowDataPacket } from "mysql2";
import { TaskQueryDto } from "../tasks/dto/query-task.dto"; 

@Injectable()
export class TaskAssignmentService {
    constructor (private readonly taskAssignmentrepository: TaskAssignmentRepository){}
    
   

    async create(assignmentData:any): Promise<void> {
        await this.taskAssignmentrepository.create({
            ...assignmentData,
            dataStatus:'A',
            createdOn: new Date(),
            modifiedOn: new Date(),
        });
    }
    
    async findByTaskId(taskId: string): Promise<RowDataPacket[]> {
        return this.taskAssignmentrepository.findByTaskId(taskId);
    }

    async findOne(assignmentId: string, recSeq: number): Promise <RowDataPacket> {
        const assignment = await this.taskAssignmentrepository.findById(assignmentId, recSeq);
        if(!assignment) {
            throw new NotFoundException(`Assignment with ID ${assignmentId}, and recSeq ${recSeq} not found`);
        }
        return assignment;
    }

    async update(assignmentId:string, recSeq: number, updateData: any): Promise<RowDataPacket> {
        await this.taskAssignmentrepository.update(assignmentId, recSeq, {
            ...updateData,
            modifiedOn: new Date(),
        });
        return this.findOne(assignmentId, recSeq);
    }

    async remove(assignmentId: string, recSeq: number): Promise<void> {
        await this.findOne(assignmentId, recSeq);
        return this.taskAssignmentrepository.softdelete(assignmentId, recSeq);
    }

    
    async findByUserId(userId: string, queryDto: TaskQueryDto): Promise<{ tasks: RowDataPacket[], total: number }> {
        return this.taskAssignmentrepository.findByUserId(userId, queryDto);
    }
}

