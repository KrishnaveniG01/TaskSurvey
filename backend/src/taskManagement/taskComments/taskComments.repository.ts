import { Injectable } from '@nestjs/common';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { taskDB } from 'src/database/taskDB';


@Injectable()
export class TaskCommentRepository {
  constructor(private readonly db: taskDB) {}

  async create(data: any): Promise<void> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    await this.db.query(
      `INSERT INTO taskComments (${columns}) VALUES (${placeholders})`,
      values
    );
  }

  async findByTaskId(taskId: string): Promise<RowDataPacket[]> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskComments WHERE taskId = ? AND recStatus = ? ORDER BY createdOn ASC',
      [taskId, 'A']
    );
    return rows as RowDataPacket[];
  }

  async findById(commentId: string, recSeq: number): Promise<RowDataPacket | null> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskComments WHERE commentId = ? AND recSeq = ? AND recStatus = ?',
      [commentId, recSeq, 'A']
    );
    return rows[0] || null;
  }

  async update(commentId: string, recSeq: number, updateData: any): Promise<void> {
    const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), commentId, recSeq];
    await this.db.query(
      `UPDATE taskComments SET ${updates}, modifiedOn = CURRENT_TIMESTAMP() WHERE commentId = ? AND recSeq = ?`,
      values
    );
  }

  async delete(commentId: string, recSeq: number): Promise<void> {
    await this.db.query(
      'UPDATE taskComments SET recStatus = ?, modifiedOn = CURRENT_TIMESTAMP() WHERE commentId = ? AND recSeq = ?',
      ['I', commentId, recSeq]
    );
  }

  async list(): Promise<RowDataPacket[]> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskComments WHERE recStatus = ? ORDER BY createdOn DESC',
      ['A']
    );
    return rows as RowDataPacket[];
  }
}
