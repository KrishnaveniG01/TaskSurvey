import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { taskDB } from 'src/database/taskDB'; // Adjust path if needed
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TaskHandoverRepository {
  constructor(private readonly db: taskDB) {}

  async createHandoverRequests(taskIds: string[], employeeId: string): Promise<void> {
    const now = new Date();
    const values = taskIds.map(taskId => [
      uuidv4(),
      taskId,
      employeeId,
      'Pending',
      now,
    ]);

    const sql = `
        INSERT INTO taskHandovers 
            (handoverId, taskId, originalEmployeeId, requestStatus, requestedOn) 
        VALUES ?
    `;
    await this.db.query(sql, [values]);
  }

  async findPending(): Promise<any[]> {
    const sql = `
        SELECT h.*, t.taskTitle, u.userName as originalEmployeeName
        FROM taskHandovers h
        JOIN tasks t ON h.taskId = t.taskId
        JOIN userManagementClone.userCredentials u ON h.originalEmployeeId = u.userId
        WHERE h.requestStatus = 'Pending'
        ORDER BY h.requestedOn ASC;
    `;
    const [rows] = await this.db.query(sql) as [RowDataPacket[] , any];
    return rows;
  }

  async findById(handoverId: string): Promise<any> {
    const sql = `SELECT * FROM taskHandovers WHERE handoverId = ?`;
    const [[row]] = await this.db.query(sql, [handoverId]) as [RowDataPacket[], any];
    return row;
  }

  async updateStatus(
    handoverId: string, 
    status: 'Approved' | 'Rejected', 
    adminId: string, 
    newEmployeeId?: string
  ): Promise<void> {
    const sql = `
        UPDATE taskHandovers 
        SET 
            requestStatus = ?, 
            actionedBy = ?, 
            actionedOn = NOW(),
            newEmployeeId = ?
        WHERE handoverId = ?;
    `;
    await this.db.query(sql, [status, adminId, newEmployeeId || null, handoverId]);
  }
}