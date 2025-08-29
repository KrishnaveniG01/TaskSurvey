import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { RowDataPacket } from 'mysql2';
import { TaskRepository } from './task.repository';
import { TaskAssignmentRepository } from '../taskAssignments/taskAsssignments.repository';
import { TaskQueryDto } from './dto/query-task.dto';
import { v4 as uuidv4 } from 'uuid';
import { TaskAttachmentRepository } from '../taskAttachments/taskattachments.repository';
import { TaskEntity } from './task.entity';
import { AwsS3Service } from 'src/aws/aws.S3.service';
import { TaskAssignmentService } from '../taskAssignments/taskAssignments.service';
import { TaskHandoverRepository } from './taskHandoverRepository';

interface Attachment {
  key: string;
  fileName: string;
  url?: string; // Add the optional 'url' property
}

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskAssignmentRepository: TaskAssignmentRepository,
    private readonly taskAttachmentRepository: TaskAttachmentRepository,
    private readonly awsS3Service: AwsS3Service,
    private readonly taskAssignmentService: TaskAssignmentService,
    private readonly taskHandoverRepository: TaskHandoverRepository,
  ) {}

  private mapDtoToTaskEntity(
    dto: CreateTaskDto,
    userId: string,
  ): Partial<TaskEntity> {
    return {
      taskTitle: dto.taskTitle,
      taskDescription: dto.taskDescription || '',
      plannedStartDate: dto.plannedStartDate || null,
      plannedStartTime: dto.plannedStartTime || null,
      plannedEndDate: dto.plannedEndDate || null,
      plannedEndTime: dto.plannedEndTime || null,
      mandatory: dto.isMandatory ? 1 : 0,
      proofOfCompletion: dto.isRequiresProof ? 1 : 0,
      important: dto.isImportant ? 1 : 0,
      reviewBy: dto.reviewerId || null,
      createdBy: userId,
      modifiedBy: userId,
    };
  }

  async create(
    createTaskDto: CreateTaskDto,
    user: any,
    files: Array<Express.Multer.File>,
  ): Promise<RowDataPacket> {
    console.log('--- Starting Task Creation ---');
    console.log('Received DTO:', JSON.stringify(createTaskDto, null, 2));
    console.log('Received Files Count:', files?.length || 0);

    const taskId = uuidv4();
    const now = new Date();
    const userId = user.userId;

    const { assignedTo, isRequiresProof, isDraft, orgId } = createTaskDto;

    // Create the main task
    const mappedTask = this.mapDtoToTaskEntity(createTaskDto, userId);
    const newTask: Partial<TaskEntity> = {
      ...mappedTask,
      taskId,
      orgId: orgId || 'edb8e528-d040-4dcc-adbf-5dfd3e6c4916',
      dataStatus: 'A',
      recStatus: 'P',
      recSeq: 1,
      createdOn: now,
      modifiedOn: now,
    };

    try {
      await this.taskRepository.create(newTask);
      console.log(`Successfully created main task with ID: ${taskId}`);
    } catch (error) {
      console.error('!!! FAILED to create main task:', error);
      throw new InternalServerErrorException('Failed to create the task.');
    }

    // Process task assignments
    if (assignedTo && typeof assignedTo === 'string') {
      let assignmentsArray: any[] = [];
      try {
        assignmentsArray = JSON.parse(assignedTo);
        console.log(
          `Successfully parsed ${assignmentsArray.length} assignments from 'assignedTo' string.`,
        );
      } catch (error) {
        console.error(
          `!!! FAILED to parse "assignedTo" JSON string: ${assignedTo}`,
          error,
        );
        assignmentsArray = [];
      }

      if (assignmentsArray.length > 0) {
        const assignmentData = assignmentsArray.map((assignmentDto: any) => ({
          userId: assignmentDto.userId,
          assignedBy: userId,
          taskId,
          assignmentId: uuidv4(),
          orgId: orgId || 'edb8e528-d040-4dcc-adbf-5dfd3e6c4916',
          assignedOn: now,
          dataStatus: 'A',
          recStatus: 'P',
          recSeq: 1,
          managerId: createTaskDto.reviewerId || null,
          plannedStartDate: createTaskDto.plannedStartDate || null,
          plannedStartTime: createTaskDto.plannedStartTime || null, // Added
          plannedEndDate: createTaskDto.plannedEndDate || null,
          plannedEndTime: createTaskDto.plannedEndTime || null, // Added
          createdOn: now,
          modifiedOn: now,
          createdBy: userId,
          modifiedBy: userId,
        }));

        console.log(
          'Prepared assignment data:',
          JSON.stringify(assignmentData, null, 2),
        );
        try {
          await this.taskAssignmentRepository.bulkCreate(assignmentData);
          console.log('Successfully saved task assignments.');
        } catch (error) {
          console.error('!!! FAILED to save task assignments:', error);
        }
      }
    } else {
      console.log('No assignments to process.');
    }

    // Process file attachments
    if (files && files.length > 0) {
  console.log(`Processing ${files.length} file attachments...`);
  
  const attachmentResults: any[] = [];
  
  for (const file of files) {
    try {
      // ✅ FIX 1: Call uploadFile with just the 'file' object
      const { fileUrl, fileName } = await this.awsS3Service.uploadFile(file);
      
      console.log(`Successfully uploaded file "${fileName}" to S3: ${fileUrl}`);

      // ✅ FIX 2: Prepare the attachment data with both fileUrl and fileName
      const attachmentData = {
        fileURL: fileUrl,
        fileName: fileName, // Add the fileName for the database
        taskId,
        attachmentId: uuidv4(),
        orgId: orgId || 'edb8e528-d040-4dcc-adbf-5dfd3e6c4916',
        isAttachmentCreationDoc: isRequiresProof ? 1 : 0,
        recStatus: 'A', 
        createdBy: userId,
        modifiedBy: userId,
      };
      
      attachmentResults.push(attachmentData);
    } catch (error) {
      console.error(`!!! FAILED to process file "${file.originalname}":`, error);
    }
  }

  if (attachmentResults.length > 0) {
    console.log('Prepared attachment data for DB:', JSON.stringify(attachmentResults, null, 2));
    try {
      await this.taskAttachmentRepository.bulkCreate(attachmentResults);
      console.log('Successfully saved task attachments to DB.');
    } catch (error) {
      console.error('!!! FAILED to save task attachments to DB:', error);
    }
  }


      if (attachmentResults.length > 0) {
        console.log(
          'Prepared attachment data for DB:',
          JSON.stringify(attachmentResults, null, 2),
        );
        try {
          await this.taskAttachmentRepository.bulkCreate(attachmentResults);
          console.log('Successfully saved task attachments to DB.');
        } catch (error) {
          console.error('!!! FAILED to save task attachments to DB:', error);
          console.error('Error details:', error);
        }
      }
    } else {
      console.log('No file attachments to process.');
    }

    return this.findOne(taskId);
  }

   async saveDraft(createTaskDto: CreateTaskDto, user: any): Promise<RowDataPacket> {
        const taskId = createTaskDto.taskId || uuidv4();
        const now = new Date();
        const userId = user.userId;

        const mappedTask = this.mapDtoToTaskEntity(createTaskDto, userId);

        const draftTask: Partial<TaskEntity> = {
          ...mappedTask,
          taskId,
          recStatus: 'D', // 'D' for Draft
          dataStatus: 'A',
          recSeq: 1, // Drafts are always the first version
          createdOn: now,
          modifiedOn: now,
        };

        await this.taskRepository.create(draftTask);
        // ... handle draft assignments if necessary
        return this.taskRepository.findOne(taskId, 'D');
    }

    /**
     * Publishes a draft by deactivating it and creating a new, active version.
     */
    async publishDraft(
        taskId: string,
        updateTaskDto: CreateTaskDto,
        user: any
    ): Promise<RowDataPacket> {
        
        const originalDraft = await this.taskRepository.findOne(taskId, 'D');
        if (!originalDraft) {
            throw new NotFoundException(`Draft task with ID ${taskId} not found.`);
        }
        
        const queryRunner = await this.taskRepository.getTransaction(); 
        await queryRunner.beginTransaction();

        try {
            await this.taskRepository.deactivate(taskId, originalDraft.recSeq, queryRunner);

            const newRecSeq = originalDraft.recSeq + 1;
            const mappedTask = this.mapDtoToTaskEntity(updateTaskDto, user.userId);
            
            const newTask: Partial<TaskEntity> = {
                ...mappedTask,
                taskId,
                recSeq: newRecSeq,
                recStatus: 'P',   // 'P' for Pending/Published
                dataStatus: 'A',
                createdOn: originalDraft.createdOn,
                createdBy: originalDraft.createdBy,
                modifiedOn: new Date(),
                modifiedBy: user.userId,
            };

            await this.taskRepository.create(newTask, queryRunner);
            
            await queryRunner.commit();

            return this.taskRepository.findOne(taskId, 'P');

        } catch (error) {
            await queryRunner.rollback();
            console.error('Transaction failed, rolling back changes:', error);
            throw new InternalServerErrorException('Failed to publish the draft.');
        } finally {
            queryRunner.release();
        }
    }

  async findAll(queryDto: TaskQueryDto) {
    const { tasks, total } =
      await this.taskRepository.findAllWithFilters(queryDto);
    return { tasks, total, page: queryDto.page, limit: queryDto.limit };
  }
  async findCategorizedTasksForReviewer(userId: string) {
        const tasks = await this.taskRepository.findCategorizedTasksForReviewer(userId);
        // You can add any additional business logic here if needed
        return tasks;
    }

  async findOne(taskId: string): Promise<RowDataPacket> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} Not Found`);
    }
    return task;
  }

  

  async remove(taskId: string): Promise<void> {
    const task = await this.findOne(taskId);
    await this.taskRepository.softDelete(task.taskId);
  }

  async findTaskByUser(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<{ tasks: RowDataPacket[]; total: number }> {
    return this.taskAssignmentService.findByUserId(userId, queryDto);
  }

  async getDraftTasks(createdBy: string): Promise<RowDataPacket[]> {
    return this.taskRepository.getDraftTasks(createdBy);
  }

  async findTasksCreatedBy(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<{ tasks: RowDataPacket[]; total: number }> {
    return this.taskRepository.findTasksCreatedBy(userId, queryDto);
  }
  async findTasksAssignedTo(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<{ tasks: RowDataPacket[]; total: number }> {
    return this.taskRepository.findTasksByAssignee(userId, queryDto);
  }

  async findTasksForReviewer(
    userId: string,
    queryDto: TaskQueryDto,
  ): Promise<{ tasks: RowDataPacket[]; total: number }> {
    return this.taskRepository.findTasksByReviewer(userId, queryDto);
  }

  async getCategorizedTasksForUser(userId: string) {
    const tasks =
      await this.taskRepository.findAndCategorizeTasksForUser(userId);
    return tasks;
  }

  async findTaskDetails(taskId: string): Promise<any> {
    const task = await this.taskRepository.findTaskDetailsById(taskId);

    if (!task || !task.adminAttachments) {
      return task;
    }
    for (const attachment of task.adminAttachments as Attachment[]) {
      if (attachment.key) {
        attachment.url = await this.awsS3Service.getPresignedUrl(
          attachment.key,
        );
      }
    }

    return task;
  }
  async submitTaskCompletion(
  taskId: string,
  userId: string,
  commentText: string,
  file: Express.Multer.File, // This can be null if no file is uploaded
): Promise<{ message: string }> {
  const taskData = await this.taskRepository.findSimpleTaskById(
    taskId,
    userId,
  );
  if (!taskData) {
    throw new NotFoundException(
      'Task not found or you are not assigned to it.',
    );
  }

  if (taskData.isRequiresProof && !file) {
    throw new BadRequestException(
      'Proof of completion is required for this task.',
    );
  }

  // ✅ Correctly handle the file upload logic
  if (file) {
    // 1. Get the object { fileUrl, fileName } from the S3 service
    const { fileUrl, fileName } = await this.awsS3Service.uploadFile(file);
    
    // 2. Pass all 4 arguments to the repository
    await this.taskRepository.addAttachment(taskId, fileUrl, fileName, userId);
  }
  if (commentText && commentText.trim() !== '') {
  await this.taskRepository.addComment(taskId, userId, commentText);
  }
  const newStatus = taskData.managerId ? 'I' : 'C';
  await this.taskRepository.updateTaskStatus(taskId, newStatus);

  const message =
    newStatus === 'I'
      ? 'Task submitted for review successfully.'
      : 'Task marked as complete successfully.';

  return { message };
}
async reviewTask(
    taskId: string,
    managerId: string,
    action: 'approve' | 'reject',
    comment?: string,
): Promise<{ message: string }> {
    
    // 1. Find the task that is currently "In Review"
    const taskToReview = await this.taskRepository.findTaskForReview(taskId, managerId);
    if (!taskToReview) {
        throw new NotFoundException('Task not found or you are not the reviewer for this task.');
    }

    // 2. If rejecting, a comment is mandatory
    if (action === 'reject' && (!comment || comment.trim() === '')) {
        throw new BadRequestException('A comment is required when rejecting a task.');
    }

    // 3. Determine the new status
    const newStatus = action === 'approve' ? 'D' : 'P'; // 'D' for Done, 'P' for Pending (rejected)

    // 4. Update the task status (using a versioning approach is best)
    await this.taskRepository.updateTaskStatus(taskId, newStatus);

    // 5. Add the manager's review comment
    if (comment && comment.trim() !== '') {
        await this.taskRepository.addComment(taskId, managerId, comment);
    }

    return { message: `Task has been successfully ${action}d.` };
}
async requestHandover(taskIds: string[], employeeId: string): Promise<{ message: string }> {
    if (!taskIds || taskIds.length === 0) {
        throw new BadRequestException('No tasks were selected for handover.');
    }
    // This logic should be wrapped in a transaction
    await this.taskHandoverRepository.createHandoverRequests(taskIds, employeeId);
    // You would also trigger a notification to the admin here
    return { message: 'Handover request submitted successfully.' };
}
async getPendingHandovers() {
    return this.taskHandoverRepository.findPending();
}
async actionHandover(handoverId: string, action: 'approve' | 'reject', adminId: string, newEmployeeId?: string) {
    if (action === 'approve' && !newEmployeeId) {
        throw new BadRequestException('A new employee must be selected for approval.');
    }
    // This entire block must be a single database transaction
    if (action === 'approve') {
      if (!newEmployeeId) {
            throw new BadRequestException('A new employee must be selected for approval.');
        }
        const handoverRequest = await this.taskHandoverRepository.findById(handoverId);
        // 1. Update the original taskAssignment with the new employee's ID
        await this.taskAssignmentRepository.reassignTask(handoverRequest.taskId, newEmployeeId);
        // 2. Update the handover request status
        await this.taskHandoverRepository.updateStatus(handoverId, 'Approved', adminId, newEmployeeId);
    } else {
        // Just update the handover request status
        await this.taskHandoverRepository.updateStatus(handoverId, 'Rejected', adminId);
    }
    return { message: `Request has been successfully ${action}d.` };
}
}
