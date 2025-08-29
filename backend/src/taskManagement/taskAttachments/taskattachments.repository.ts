import { Injectable } from '@nestjs/common';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { taskDB } from 'src/database/taskDB';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class TaskAttachmentRepository {
  constructor(private readonly db: taskDB) {}

  async bulkCreate(attachments: any[]) {
  const values = attachments.map(a => [
    a.attachmentId,                
    a.orgId,
    1,                             
    a.taskId,
    a.fileURL,
    'A',                          
    a.recStatus || 'A',
    a.createdBy,
    new Date(),
    a.modifiedBy || a.createdBy,
    new Date(),
    a.isAttachmentCreationDoc ? 1 : 0,
  ]);

  const sql = `
    INSERT INTO taskAttachments (
      attachmentId, orgId, recSeq, taskId, fileURL,
      dataStatus, recStatus, createdBy, createdOn,
      modifiedBy, modifiedOn, isAttachmentCreationDoc
    ) VALUES ?
  `;

  await this.db.query(sql, [values]);
}
  async findByTaskId(taskId: string): Promise<RowDataPacket[]> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskAttachments WHERE taskId = ? AND dataStatus = ? ORDER BY createdOn ASC',
      [taskId, 'A']
    );
    return rows as RowDataPacket[];
  }

  async findById(attachmentId: string, recSeq: number): Promise<RowDataPacket | null> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskAttachments WHERE attachmentId = ? AND recSeq = ? AND dataStatus = ?',
      [attachmentId, recSeq, 'A']
    );
    return rows[0] || null;
  }

  async update(attachmentId: string, recSeq: number, updateData: any): Promise<void> {
    const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), attachmentId, recSeq];
    await this.db.query(
      `UPDATE taskAttachments SET ${updates}, modifiedOn = CURRENT_TIMESTAMP() WHERE attachmentId = ? AND recSeq = ?`,
      values
    );
  }

  async delete(attachmentId: string, recSeq: number): Promise<void> {
    await this.db.query(
      'UPDATE taskAttachments SET dataStatus = ?, modifiedOn = CURRENT_TIMESTAMP() WHERE attachmentId = ? AND recSeq = ?',
      ['I', attachmentId, recSeq]
    );
  }

  async list(): Promise<RowDataPacket[]> {
    const [rows] = await this.db.query(
      'SELECT * FROM taskAttachments WHERE dataStatus = ? ORDER BY createdOn DESC',
      ['A']
    );
    return rows as RowDataPacket[];
  }
}
