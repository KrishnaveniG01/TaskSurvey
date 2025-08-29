export class TaskAttachment {
  attachmentId: string;
  recSeq: number;
  taskId: string;
  fileUrl: string;
  fileName: string;
  createdBy: string;
  createdOn: Date;
  modifiedBy: string;
  modifiedOn: Date;
  recStatus: string;
  dataStatus: string;
  isAttachmentCreationDoc?: boolean;
}
