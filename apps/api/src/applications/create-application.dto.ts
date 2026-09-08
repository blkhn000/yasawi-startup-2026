import { Transform } from "class-transformer";
import { Equals, IsBoolean, IsEmail, IsIn, IsObject, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";
import { CURRENT_CONSENT_VERSION } from "./legal-consent";

export class CreateApplicationDto {
  @IsIn(["incubation", "acceleration", "it-education"])
  program: "incubation" | "acceleration" | "it-education";

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber("KZ")
  phone: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  idea: string;

  @IsOptional() @IsString() @MaxLength(200) institution?: string;
  @IsOptional() @IsString() @MaxLength(200) faculty?: string;
  @IsOptional() @IsString() @MaxLength(2000) teamInfo?: string;
  @IsOptional() @IsString() @MaxLength(50) cohortId?: string;
  @IsOptional() @IsObject() utm?: Record<string, string>;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsIn(["kk", "ru", "en", "tr"]) locale?: "kk" | "ru" | "en" | "tr";

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  @Equals(true)
  consent: boolean;

  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  @Equals(true)
  authorityConfirmed: boolean;

  @IsString()
  @Equals(CURRENT_CONSENT_VERSION)
  consentVersion: string;
}
