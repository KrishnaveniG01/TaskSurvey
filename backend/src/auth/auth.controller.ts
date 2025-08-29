import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/loginDto';
import { registrationDto } from './dto/registrationDto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async userLogin(@Body() dto: loginDto) {
        console.log('Data received in CONTROLLER:', dto);
        return await this.authService.login(dto);
    }

    @Post('register')
    async userRegistration(@Body() dto: registrationDto) {
        return await this.authService.registerUser(dto);
    }

    @Get('roles')
    async getRoles() {
       
        return ['admin', 'manager', 'employee'];
    }

 
    @Get('employees')
    async getAllEmployees() {
        return this.authService.getAllEmployees();
    }

    @Get('managers')
    async getAllManagers() {
        return this.authService.getAllManagers();
    }
}
