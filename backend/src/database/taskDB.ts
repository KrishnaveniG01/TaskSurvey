import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class taskDB implements OnModuleDestroy {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
     host: process.env.TASK_DB_HOST || 'labs.ckzb0kiwakdk.us-east-1.rds.amazonaws.com',
     user: process.env.TASK_DB_USER || 'admin',
     port: parseInt(process.env.TASK_DB_PORT || '3306', 10),
     password: process.env.TASK_DB_PASSWORD || 'qcb_4HHXm]sfspgQ],Dn]w',
     database: process.env.TASK_DB_NAME || 'taskClone',
     waitForConnections: true,
     connectionLimit: 10,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
  
  async query<T extends mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.ResultSetHeader>(
    sql: string,
    params?: any[]
  ): Promise<[T, mysql.FieldPacket[]]> {
    return this.pool.query<T>(sql, params);
  }

   async getConnection() {
    // This gets a single connection from the pool for a transaction
    return this.pool.getConnection();
  }
}
