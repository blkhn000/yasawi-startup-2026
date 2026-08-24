import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{14,}$/;
const strongPasswordMessage = "Пароль должен содержать минимум 14 символов, строчную и заглавную буквы, цифру и специальный символ";

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  password: string;
}

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(strongPassword, { message: strongPasswordMessage })
  password: string;

  @IsOptional()
  @IsIn(["admin", "editor"])
  role?: "admin" | "editor";
}

export class UpdateAdminDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsIn(["admin", "editor"]) role?: "admin" | "editor";
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @Matches(strongPassword, { message: strongPasswordMessage }) password?: string;
}
