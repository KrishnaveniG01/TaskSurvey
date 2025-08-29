import { Injectable, Inject } from "@nestjs/common";
import { RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";
import { TaskQueryDto } from "../tasks/dto/query-task.dto";

@Injectable()
export class TaskAssignmentRepository {
    constructor(
        @Inject('TASK_DB_CONNECTION') private readonly db: Pool,
        @Inject('AUTH_DB_CONNECTION') private readonly authDbConnection: Pool
    ){}

    async create(data: any): Promise<void> {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        await this.db.query(`INSERT INTO taskAssignments (${columns}) VALUES (${placeholders})`, values);
    }

    async bulkCreate(assignments: any[]): Promise<void> {
        if(assignments.length === 0) return;
        const sql = `INSERT INTO taskAssignments (
            assignmentId, taskId, assignedTo, assignedBy, managerId, 
            plannedStartDate, plannedEndDate, 
            assignedOn, recStatus, dataStatus, recSeq, orgId, 
            createdOn, modifiedOn, createdBy, modifiedBy
        ) VALUES ?
    `;
      const values = assignments.map(a => [
        a.assignmentId, a.taskId, a.userId, a.assignedBy, a.managerId,
        a.plannedStartDate, a.plannedEndDate,
        a.assignedOn, a.recStatus, a.dataStatus, a.recSeq, a.orgId,
        a.createdOn, a.modifiedOn, a.createdBy, a.modifiedBy
    ]);
        await this.db.query(sql, [values]);
    }
    
    async findByTaskId(taskId: string) : Promise<RowDataPacket[]> {
       
        const [rows] = await this.db.query('SELECT * FROM taskAssignments WHERE taskId = ? AND dataStatus = ?', [taskId, 'A']) as [RowDataPacket[], any];
        return rows;
    }
async findByUserId(userId: string, queryDto: TaskQueryDto): Promise<{ tasks: RowDataPacket[], total: number }> {
        const page = Number(queryDto.page) || 1;
        const limit = Number(queryDto.limit) || 10;
        const { status, search, sortBy = 't.plannedEndDate', sortOrder = 'DESC' } = queryDto;
        const offset = (page - 1) * limit;
        const params: any[] = [userId];
        let whereClauses = "a.userId = ? AND a.dataStatus = 'A' AND t.dataStatus = 'A'";
        if (status) { whereClauses += ' AND a.recStatus = ?'; params.push(status); }
        if (search) { whereClauses += ' AND t.taskTitle LIKE ?'; params.push(`%${search}%`); }
        const taskQuery = `SELECT t.taskId, t.taskTitle, t.plannedEndDate as dueDate, a.assignedBy, t.reviewBy, a.recStatus as status, 'Assignee' as role FROM taskAssignments a JOIN tasks t ON a.taskId = t.taskId WHERE ${whereClauses} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        
        const [taskRowsResult] = await this.db.query(taskQuery, [...params, limit, offset]);
        const taskRows = Array.isArray(taskRowsResult) ? taskRowsResult as RowDataPacket[] : [];

        const userIdsToFetch = new Set<string>();
        taskRows.forEach((row: any) => {
            if (row.assignedBy) userIdsToFetch.add(row.assignedBy);
            if (row.reviewBy) userIdsToFetch.add(row.reviewBy);
        });

        const userIds = Array.from(userIdsToFetch);
        let userNamesMap = new Map<string, string>();
        if (userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            const userQuery = `SELECT userId, userName FROM userCredentials WHERE userId IN (${placeholders})`;
            const [userRowsResult] = await this.authDbConnection.query(userQuery, userIds);
            const userRows = Array.isArray(userRowsResult) ? userRowsResult as RowDataPacket[] : [];
            userRows.forEach((user: any) => { userNamesMap.set(user.userId, user.userName); });
        }

        const finalTasks = taskRows.map((task: any) => ({ ...task, assignedByName: userNamesMap.get(task.assignedBy) || 'N/A', reviewerName: userNamesMap.get(task.reviewBy) || 'N/A' }));
        
        const countSql = `SELECT COUNT(a.assignmentId) as total FROM taskAssignments a JOIN tasks t ON a.taskId = t.taskId WHERE ${whereClauses}`;
        const [countResult] = await this.db.query(countSql, params) as [RowDataPacket[], any];
        const total = countResult[0]?.total || 0;
        return { tasks: finalTasks as RowDataPacket[], total };
    }
    async findById(assignmentId: string, recSeq:number) : Promise<RowDataPacket | null> {
       
        const [rows] = await this.db.query('SELECT * FROM taskAssignments WHERE assignmentId = ? AND recSeq = ? AND dataStatus = ?', [assignmentId, recSeq, 'A']) as [RowDataPacket[], any];
        return rows[0] || null;
    }

    async update(assignmentId: string, recSeq: number, updateData : any): Promise<void> {
        const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), assignmentId, recSeq];
        await this.db.query(`UPDATE taskAssignments SET ${updates} WHERE assignmentId = ? AND recSeq = ?`, values);
    }

    async softdelete(assignmentId: string, recSeq: number): Promise<void> {
        await this.db.query('UPDATE taskAssignments SET dataStatus = ?, modifiedOn = CURRENT_TIMESTAMP() WHERE assignmentId = ? AND recSeq = ?', ['I', assignmentId, recSeq]);
    }
    // Add this new method to your TaskAssignmentRepository class

/**
 * Reassigns all assignments for a given task to a new employee.
 * @param taskId The ID of the task.
 * @param newEmployeeId The ID of the new employee.
 */
async reassignTask(taskId: string, newEmployeeId: string): Promise<void> {
    const sql = `
        UPDATE taskAssignments 
        SET assignedTo = ? 
        WHERE taskId = ?;
    `;
    await this.db.query(sql, [newEmployeeId, taskId]);
}
}

