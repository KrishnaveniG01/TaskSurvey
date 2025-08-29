import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class authDB implements OnModuleDestroy {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
     host: process.env.AUTH_DB_HOST || 'labs.ckzb0kiwakdk.us-east-1.rds.amazonaws.com',
     user: process.env.AUTH_DB_USER || 'admin',
     port: parseInt(process.env.AUTH_DB_PORT || '3306', 10),
     password: process.env.AUTH_DB_PASSWORD || 'qcb_4HHXm]sfspgQ],Dn]w',
     database: process.env.AUTH_DB_NAME || 'userManagementClone',
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
}