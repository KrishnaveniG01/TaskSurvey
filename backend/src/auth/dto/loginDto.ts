import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class loginDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string; // ✅ Must be named exactly 'email'

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string; // ✅ Must be named exactly 'password'
}