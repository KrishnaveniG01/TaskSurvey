export class TaskEntity {
  taskId: string; 
  recSeq: number; 
  orgId: string; 
  recStatus: string; 
  dataStatus: string; 
  taskTitle?: string | null; 
  taskDescription: string; 
  plannedStartDate?: string | null; 
  plannedStartTime?: string | null; 
  plannedEndDate?: string | null;
  plannedEndTime?: string | null;
  poolTask?: number | null; 
  groupTask?: number | null;
  mandatory?: number | null;
  proofOfCompletion?: number; 
  important?: number; 
  reviewBy?: string | null; 
  createdBy: string; 
  createdOn: Date;
  modifiedBy: string; 
  modifiedOn: Date;
}




