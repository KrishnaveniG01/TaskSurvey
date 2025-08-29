import { Injectable } from "@nestjs/common";
import { RowDataPacket } from "mysql2";
import { TaskQueryDto } from "./dto/query-task.dto";
import { taskDB } from "src/database/taskDB";
import { authDB } from "src/database/authDB";

interface TaskDetails {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  isRequiresProof: boolean;
  isImportant: boolean;
  isMandatory: boolean;
  recStatus: string;
  managerId: string | null;
  taskType: string;
 adminAttachments: { key: string; fileName: string; }[];
  comments: { commentText: string; createdAt: string; authorName: string }[];
}

@Injectable()
export class TaskRepository {
    constructor (private readonly db:taskDB,
        private readonly authDB: authDB
        
    ){}
    

    async findAllWithFilters(query: TaskQueryDto): Promise< { tasks: RowDataPacket[]; total: number} > {
      const {
        page = 1,
        limit = 10,
        status, // This will now be 'P', 'D', etc., or undefined
        search,
        sortBy = 'createdOn',
        sortOrder = 'DESC',
    } = query;

           const offset = (page - 1) * limit;
    // Start with the most important filter: only get active data
    const filters: string[] = ["t.dataStatus = 'A'"];
    const params: any[] = [];

      if (status) {
        filters.push('t.recStatus = ?');
        params.push(status);
    }
    
    if (search) {
        filters.push('(t.taskTitle LIKE ? OR t.taskDescription LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }
        // if(priority) {
        //     filters.push('t.priority = ?');
        //     params.push(priority);
        // }
        // if(assignedBy) {
        //     filters.push('t.assignedBy = ?');
        //     params.push(assignedBy); 
        // }
        // if(assignedTo){
        //     filters.push('t.assignedTo = ?');
        //     params.push(assignedTo);
        // }
        // if(startDate){
        //     filters.push('t.startDate >= ?');
        //     params.push(startDate);
        // }
        // if(endDate){
        //     filters.push('t.endDate <= ?');
        //     params.push(endDate);
        // }

         const whereClause = `WHERE ${filters.join(' AND ')}`;


         const sql = `
        SELECT t.*
        FROM tasks t
        INNER JOIN (
            SELECT taskId, MAX(recSeq) as maxRecSeq
            FROM tasks
            GROUP BY taskId
        ) latest ON t.taskId = latest.taskId AND t.recSeq = latest.maxRecSeq
        ${whereClause}
        ORDER BY t.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(t.taskId) as total
        FROM tasks t
        INNER JOIN (
            SELECT taskId, MAX(recSeq) as maxRecSeq
            FROM tasks
            GROUP BY taskId
        ) latest ON t.taskId = latest.taskId AND t.recSeq = latest.maxRecSeq
        ${whereClause}
    `;
    
    const [countResult] = await this.db.query(countSql, params) as [RowDataPacket[], any];
    const total = countResult[0]?.total || 0;
    
    const [rows] = await this.db.query(sql, [...params, limit, offset]) as [RowDataPacket[], any];

    return { tasks: rows, total };
}
    
   
    async findOne(taskId: string, recStatus?: string): Promise<any> {
    let sql = `SELECT * FROM tasks WHERE taskId = ? AND dataStatus = 'A'`;
    const params: any[] = [taskId];

    if (recStatus) {
        sql += ` AND recStatus = ?`;
        params.push(recStatus);
    }
    
    sql += ` ORDER BY recSeq DESC LIMIT 1`; // Get the latest version

    const [rows] = await this.db.query<RowDataPacket[]>(sql, params);
const row = rows[0];
    return row;
}

// You also need a way to handle transactions
async getTransaction() {
    // This implementation depends on your database connection setup.
    // It should return a connection object that can start/commit/rollback transactions.
    return this.db.getConnection(); 
}
    async findById(taskId: string): Promise<RowDataPacket | null> {
    const [rows] = await this.db.query('SELECT * FROM tasks WHERE taskId = ?', [taskId]);
    return (rows as RowDataPacket[])[0] || null;
  }
    async deactivate(taskId: string, recSeq: number, queryRunner?: any): Promise<void> {
    const sql = `
        UPDATE tasks 
        SET dataStatus = 'I', modifiedOn = ?
        WHERE taskId = ? AND recSeq = ?;
    `;
    const connection = queryRunner || this.db; // Use transaction or default connection
    await connection.query(sql, [new Date(), taskId, recSeq]);
}

// Your existing 'create' method is also needed
async create(task: any, queryRunner?: any): Promise<string> {
    const columns = Object.keys(task).join(', ');
    const placeholders = Object.keys(task).map(() => '?').join(', ');
    const values = Object.values(task);
    const sql = `INSERT INTO tasks (${columns}) VALUES (${placeholders})`;
    
    const connection = queryRunner || this.db; // Use transaction or default connection
    await connection.query(sql, values);
    return task.taskId;
}
async markAsCompleted(taskId: string, completerId: string): Promise<void> {
    const sql = `
        UPDATE taskAssignments 
        SET 
            completedBy = ?, 
            completedOn = NOW(),
            recStatus = 'C' -- 'D' for Done/Closed
        WHERE 
            taskId = ?;
    `;
    await this.db.query(sql, [completerId, taskId]);
}

    async softDelete(taskId: string): Promise<void> {
        await this.db.query(
            'UPDATE tasks SET dataStatus = ?, modifiedOn = CURRENT_TIMESTAMP() WHERE taskId = ?',
            ['I', taskId],
        );

    }
    async updateOverdueTasks(): Promise<number> {
    const updateQuery = `
        UPDATE
            taskClone.tasks
        SET
            recStatus = 'O'
        WHERE
            recStatus = 'P' 
            AND CONCAT(plannedEndDate, ' ', COALESCE(plannedEndTime, '23:59:59')) < NOW();
    `;

    const [result] = await this.db.query<any>(updateQuery);
    console.log(`${result.affectedRows} tasks marked as Overdue.`);
    return result.affectedRows;
}
    async getDraftTasks(userId: string): Promise<RowDataPacket[]> {
  // The SQL query will now reference both databases explicitly.
  const sqlQuery = `
    SELECT
      t.taskId,
      t.taskTitle,
      t.plannedStartDate,
      t.plannedStartTime,
      t.recStatus,
      t.dataStatus,
   

      uc.userName AS createdByName , 
      t.plannedStartDate AS startDate,
      t.plannedStartTime AS startTime
    FROM
      taskClone.tasks AS t 
    JOIN
      userManagementClone.userCredentials AS uc ON t.createdBy = uc.userId 
    WHERE
      t.createdBy = ?       
      AND t.recStatus = 'D'
      AND t.dataStatus = 'A'
  `;

  // The 'userId' parameter is used in the WHERE clause
  const [rows] = await this.db.query<RowDataPacket[]>(sqlQuery, [userId]);
  return rows;
}


// For Admins (shows who the task is ASSIGNED TO)
async findTasksCreatedBy(userId: string, queryDto: TaskQueryDto): Promise<{ tasks: RowDataPacket[], total: number }> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdOn', sortOrder = 'DESC' } = queryDto;
    const offset = (page - 1) * limit;
    
    let whereClauses = "t.createdBy = ? AND t.dataStatus = 'A'";
    const params: any[] = [userId];

    if (status) { whereClauses += ' AND t.recStatus = ?'; params.push(status); }
    if (search) { whereClauses += ' AND t.taskTitle LIKE ?'; params.push(`%${search}%`); }

    const sql = `
        SELECT
            t.taskId, t.taskTitle, t.plannedEndDate as dueDate, t.recStatus as status,
            -- ✅ FIX: Concatenate all assignee names into one string
            GROUP_CONCAT(assignee.userName SEPARATOR ', ') as assignedToName,
            reviewer.userName as reviewerName
        FROM tasks t
        LEFT JOIN taskAssignments ta ON t.taskId = ta.taskId
        LEFT JOIN userManagementClone.userCredentials assignee ON ta.assignedTo = assignee.userId
        LEFT JOIN userManagementClone.userCredentials reviewer ON t.reviewBy = reviewer.userId
        WHERE ${whereClauses}
        -- ✅ FIX: Group by task ID to ensure one row per task
        GROUP BY t.taskId, reviewer.userName
        ORDER BY t.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(t.taskId) as total FROM tasks t WHERE ${whereClauses}`;
    
    const [rows] = await this.db.query(sql, [...params, limit, offset]) as [RowDataPacket[], any];
    const [countResult] = await this.db.query(countSql, params) as [RowDataPacket[], any];
    
    return { tasks: rows, total: countResult[0]?.total || 0 };
}

// For Employees (shows who the task was ASSIGNED BY)
async findTasksByAssignee(userId: string, queryDto: TaskQueryDto): Promise<{ tasks: RowDataPacket[], total: number }> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdOn', sortOrder = 'DESC' } = queryDto;
    const offset = (page - 1) * limit;
    
    let whereClauses = "ta.assignedTo = ? AND t.dataStatus = 'A'";
    const params: any[] = [userId];

    if (status) { whereClauses += ' AND t.recStatus = ?'; params.push(status); }
    if (search) { whereClauses += ' AND t.taskTitle LIKE ?'; params.push(`%${search}%`); }

    const sql = `
         SELECT
            t.taskId, t.taskTitle, t.plannedEndDate as dueDate, t.recStatus as status,
            creator.userName as assignedByName,
            reviewer.userName as reviewerName
        FROM tasks t
        JOIN taskAssignments ta ON t.taskId = ta.taskId
        LEFT JOIN userManagementClone.userCredentials creator ON t.createdBy = creator.userId
        LEFT JOIN userManagementClone.userCredentials reviewer ON ta.managerId = reviewer.userId
        WHERE ${whereClauses}
        -- ✅ FIX: Grouping for safety and consistency
        GROUP BY t.taskId, creator.userName, reviewer.userName
        ORDER BY t.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(t.taskId) as total FROM tasks t JOIN taskAssignments ta ON t.taskId = ta.taskId WHERE ${whereClauses}`;
    
    const [rows] = await this.db.query(sql, [...params, limit, offset]) as [RowDataPacket[], any];
    const [countResult] = await this.db.query(countSql, params) as [RowDataPacket[], any];
    
    return { tasks: rows, total: countResult[0]?.total || 0 };
}

// For Managers (shows who the task is ASSIGNED TO)
async findTasksByReviewer(userId: string, queryDto: TaskQueryDto): Promise<{ tasks: RowDataPacket[], total: number }> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdOn', sortOrder = 'DESC' } = queryDto;
    const offset = (page - 1) * limit;
    
    let whereClauses = "ta.managerId = ? AND t.dataStatus = 'A'";
    const params: any[] = [userId];

    if (status) { whereClauses += ' AND t.recStatus = ?'; params.push(status); }
    if (search) { whereClauses += ' AND t.taskTitle LIKE ?'; params.push(`%${search}%`); }

    const sql = `
       SELECT
            t.taskId, t.taskTitle, t.plannedEndDate as dueDate, t.recStatus as status,
            -- ✅ FIX: Concatenate all assignee names
            GROUP_CONCAT(assignee.userName SEPARATOR ', ') as assignedToName,
            creator.userName as assignedByName
        FROM tasks t
        JOIN taskAssignments ta ON t.taskId = ta.taskId
        LEFT JOIN userManagementClone.userCredentials assignee ON ta.assignedTo = assignee.userId
        LEFT JOIN userManagementClone.userCredentials creator ON t.createdBy = creator.userId
        WHERE ${whereClauses}
        -- ✅ FIX: Group by task ID
        GROUP BY t.taskId, creator.userName
        ORDER BY t.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(t.taskId) as total FROM tasks t JOIN taskAssignments ta ON t.taskId = ta.taskId WHERE ${whereClauses}`;
    
    const [rows] = await this.db.query(sql, [...params, limit, offset]) as [RowDataPacket[], any];
    const [countResult] = await this.db.query(countSql, params) as [RowDataPacket[], any];
    
    return { tasks: rows, total: countResult[0]?.total || 0 };
}
      

 async findTaskDetailsById(taskId: string): Promise<TaskDetails | null> {
    const sqlQuery = `
        SELECT
            t.taskId, t.taskTitle, t.taskDescription, t.recStatus as status,
            t.plannedStartDate as startDate, t.plannedStartTime as startTime,
            t.plannedEndDate as endDate, t.plannedEndTime as endTime,
            t.proofOfCompletion as isRequiresProof, t.important as isImportant, t.mandatory as isMandatory,
            creator.userName as assignedByName,
            reviewer.userName as reviewerName,
            (SELECT COUNT(DISTINCT ta_count.assignedTo) FROM taskAssignments ta_count WHERE ta_count.taskId = t.taskId) as assignedToCount,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('url', att.fileUrl, 'fileName', att.fileName, 'uploadedBy', uploader.userName, 'uploaderRole', uploader.role)
            ) FROM taskAttachments att JOIN userManagementClone.userCredentials uploader ON att.createdBy = uploader.userId WHERE att.taskId = t.taskId) AS proofs,
            (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('commentId', c.recordId, 'commentText', c.commentText, 'commenterName', commenter.userName, 'commentedOn', c.createdOn)
            ) FROM taskComments c JOIN userManagementClone.userCredentials commenter ON c.userId = commenter.userId WHERE c.taskId = t.taskId) AS comments
        FROM 
            tasks t
        LEFT JOIN 
            userManagementClone.userCredentials creator ON t.createdBy = creator.userId
        LEFT JOIN 
            userManagementClone.userCredentials reviewer ON t.reviewBy = reviewer.userId
        WHERE 
            t.taskId = ? AND t.dataStatus = 'A'
        ORDER BY t.recSeq DESC 
        LIMIT 1;
    `;

    const [[row]] = await this.db.query(sqlQuery, [taskId]) as [RowDataPacket[], any];
    console.log('Data LEAVING Repository:', row);

    if (!row) {
        return null;
    }

    // ✅ ADD THIS BLOCK to convert buffers and handle nulls before returning
   return {
        ...row,
        isRequiresProof: Boolean(row.isRequiresProof?.[0]),
        isImportant: Boolean(row.isImportant?.[0]),
        isMandatory: Boolean(row.isMandatory?.[0]),
        proofs: row.proofs || [],
        comments: row.comments || [],
    } as unknown as TaskDetails;
 }

async findAndCategorizeTasksForUser(userId: string): Promise<any[]> {
    await this.updateOverdueTasks();

    const sqlQuery = `
        SELECT
            t.taskId,
            t.taskTitle,
            t.taskDescription,
            t.proofOfCompletion AS isRequiresProof,
            t.important AS isImportant,
            t.mandatory AS isMandatory,
            t.plannedEndDate AS endDate,
            t.plannedEndTime AS endTime,
            t.recStatus,
            CASE
                WHEN t.recStatus = 'O' THEN 'Overdue'
                WHEN t.recStatus = 'C' THEN 'Completed'
                WHEN t.recStatus = 'I' THEN 'In Review'
                WHEN t.plannedEndDate = CURDATE() THEN 'Due Today'
                ELSE 'Pending'
            END AS category,
            IF(COUNT(tas.attachmentId) = 0, JSON_ARRAY(), JSON_ARRAYAGG(
                JSON_OBJECT('url', tas.fileUrl)
            )) AS attachments
        FROM
            taskClone.tasks t
        INNER JOIN
            taskClone.taskAssignments ta ON t.taskId = ta.taskId
        LEFT JOIN 
            taskClone.taskAttachments tas ON t.taskId = tas.taskId
        WHERE
            ta.assignedTo = ? AND t.dataStatus = 'A'
        GROUP BY
            t.taskId 
        ORDER BY
            t.important DESC, t.recStatus, t.plannedEndDate ASC, t.plannedEndTime ASC;
    `;

    const [rows] = await this.db.query<any[]>(sqlQuery, [userId]);


    const transformedRows = rows.map(row => {
       const importantBool = Boolean(row.isImportant[0]);
       const proofOfCompletionBool = Boolean(row.isRequiresProof[0]);
       const mandatoryBool = Boolean(row.isMandatory[0]);

        return {
            ...row,
            isImportant: importantBool,
            isRequiresProof: proofOfCompletionBool,
            isMandatory: mandatoryBool,
        };
    });

    return transformedRows;
}
async findCategorizedTasksForReviewer(userId: string): Promise<any[]> {
    const sqlQuery = `
        SELECT
            t.taskId,
            t.taskTitle,
            t.important AS isImportant,
            CASE
                
                WHEN t.recStatus = 'Done' THEN 'Completed'
                WHEN t.recStatus = 'In Review' THEN 'In Review'
                WHEN CONCAT(t.plannedEndDate, ' ', COALESCE(t.plannedEndTime, '23:59:59')) < NOW() THEN 'Overdue'
                WHEN t.plannedEndDate = CURDATE() THEN 'Due Today'
                ELSE 'Pending'
            END AS category
        FROM
            tasks t
        INNER JOIN
            taskAssignments ta ON t.taskId = ta.taskId
        WHERE
           
            ta.managerId = ? 
            AND t.dataStatus = 'A' 
             AND t.recStatus = 'I'
        GROUP BY
            t.taskId 
        ORDER BY
            t.important DESC, t.plannedEndDate ASC;
    `;
const [rows] = await this.db.query(sqlQuery, [userId]) as [RowDataPacket[], any];
    return rows;
}
async findSimpleTaskById(taskId: string, userId: string): Promise<any> {
    const sql = `
        SELECT t.proofOfCompletion AS isRequiresProof, ta.managerId 
        FROM taskClone.tasks t
        JOIN taskClone.taskAssignments ta ON t.taskId = ta.taskId
        WHERE t.taskId = ? AND ta.assignedTo = ? AND t.dataStatus = 'A';
    `;
    const [[row]] = await this.db.query<any[]>(sql, [taskId, userId]);
    if (row) {
        row.isRequiresProof = Boolean(row.isRequiresProof[0]);
    }
    return row;
}

async addComment(taskId: string, userId: string, commentText: string): Promise<void> {
    const commentId = require('crypto').randomUUID();
    const sql = `
        INSERT INTO taskClone.taskComments (recordId, taskId, userId, commentText) 
        VALUES (?, ?, ?, ?);
    `;
    await this.db.query(sql, [commentId, taskId, userId, commentText]);
}


async addAttachment(taskId: string, fileUrl: string, fileName: string, userId: string): Promise<void> {
    const attachmentId = require('crypto').randomUUID(); 
    const sql = `
        INSERT INTO taskAttachments (
            attachmentId, taskId, fileURL, fileName, createdBy
        ) VALUES (?, ?, ?, ?, ?);
    `;
    await this.db.query(sql, [attachmentId, taskId, fileUrl, fileName, userId]);
}

async updateTaskStatus(taskId: string, newStatus: 'I' | 'C' | 'D' | 'P'): Promise<void> {
    const sql = `UPDATE tasks SET recStatus = ? WHERE taskId = ? AND dataStatus = 'A' ORDER BY recSeq DESC LIMIT 1;`;
    await this.db.query(sql, [newStatus, taskId]);
}
async findTaskForReview(taskId: string, managerId: string): Promise<any> {
    const sql = `
        SELECT t.*
        FROM tasks t
        JOIN taskAssignments ta ON t.taskId = ta.taskId
        WHERE t.taskId = ? 
          AND ta.reviewerId = ? 
          AND t.recStatus = 'I' -- 'I' for In Review
          AND t.dataStatus = 'A'
        LIMIT 1;
    `;
    const [rows] = await this.db.query<RowDataPacket[]>(sql, [taskId, managerId]);
const row = rows[0];
}
}