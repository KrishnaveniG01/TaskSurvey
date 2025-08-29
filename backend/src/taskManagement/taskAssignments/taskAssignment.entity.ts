export class AssignmentEntity {
  assignmentId: string;         
  recSeq: number;               
  orgId: string;                
  recStatus: string;            
  taskId: string;               
  userId?: string | null;       
  managerId?: string | null;   
  plannedStartDate?: string | null; 
  plannedEndDate?: string | null;   
  actualStartDate?: string | null;  
  actualEndDate?: string | null;    
  dataStatus: string;
  assignedBy: string;           
  assignedOn: Date;            
  completedBy?: string | null;  
  completedOn?: Date | null;    
  createdBy: string;           
  createdOn: Date;             
  modifiedBy: string;           
  modifiedOn: Date;            
}
