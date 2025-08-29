

export interface Task {
  taskId?: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskReviewer?: string | null;
  taskReviewerName?: string;
  isRequiresProof?: boolean | null;
  isImportant?: boolean | null;
  isMandatory?: boolean | null;
  additionalDocuments: StoredTaskDocument[];
  createdBy?: string;
  createdByName?: string;
  assignedTo: Assignee[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  comments?: Comment[];
  createdAt?: string;
  isDraft?: boolean;
  statusForEmployee?:
    | 'Pending'
    | 'In Progress'
    | 'In Review'
    | 'Completed'
    | 'Overdue'
    | 'Due Today';
  unreadCommentCount?: number;
}

// Add these minimal types too:

export interface Assignee {
  userId: string;
  userName?: string;
}

export interface StoredTaskDocument {
  documentId: string;
  name: string;
  url: string;
}

export interface Comment {
  commentId: string;
  message: string;
  createdBy: string;
  createdAt: string;
}
