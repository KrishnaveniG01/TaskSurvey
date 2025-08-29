import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { authDB } from 'src/database/authDB';
import { registrationDto } from './dto/registrationDto';
import { loginDto } from './dto/loginDto';
import { JwtService } from "@nestjs/jwt";
import { RowDataPacket } from 'mysql2';

@Injectable()
export class AuthService {
    constructor(
       
        private readonly authDbConnection: authDB,
        private jwtService: JwtService
    ) { }

    async registerUser(user: registrationDto) {
        try {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const [rows] = await this.authDbConnection.query<RowDataPacket[]>(
                `SELECT * FROM userCredentials WHERE userHandle = ? AND userName=? AND recStatus = 'A'`,
                [user.email, user.username]
            );

            if (rows.length > 0) {
                throw new BadRequestException('User already exists');
            }

            const userId = uuidv4();
            await this.authDbConnection.query(`INSERT INTO userCredentials ( userID , orgId, recSeq ,recStatus , dataStatus , 
            userHandle, role, userName , userPassword , createdBy , createdOn , 
            modifiedBy , modifiedOn  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
                userId, process.env.orgIdValue, 1, 'A', 'A', user.email, user.role,
                user.username, hashedPassword, userId, new Date(), userId, new Date()
            ]);

            return { message: 'User registered successfully', userId };
        }
        catch (err: any) {
            if (err.code === 'ER_DUP_ENTRY' || err instanceof BadRequestException) {
                throw new BadRequestException('User already exists');
            }
            console.error('Unexpected DB error:', err);
            throw new Error('Something went wrong during registration.');
        }
    }

    async login(enteredCredentials: loginDto) {
        if (!enteredCredentials.email || !enteredCredentials.password) {
            throw new BadRequestException('Please enter credentials');
        }
        
        const [rows] = await this.authDbConnection.query<RowDataPacket[]>(`SELECT * FROM userCredentials WHERE userHandle=? AND dataStatus='A'`, [
            enteredCredentials.email
        ]);

        const user = rows[0];
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(enteredCredentials.password, user.userPassword);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }
         console.log("the email and password is :", isMatch);
        const payload = { userId: user.userID, role: user.role, username: user.userName };
        const token = this.jwtService.sign(payload);
        return { token, payload };
    }

    async getAllEmployees(): Promise<RowDataPacket[]> {
        const [rows] = await this.authDbConnection.query<RowDataPacket[]>(
            `SELECT userId, userName FROM userCredentials WHERE role = 'employee' AND dataStatus = 'A'`
        );
        return rows;
    }

    async getAllManagers(): Promise<RowDataPacket[]> {
        const [rows] = await this.authDbConnection.query<RowDataPacket[]>(
            `SELECT userId, userName FROM userCredentials WHERE role = 'manager' AND dataStatus = 'A'`
        );
        return rows;
    }
}