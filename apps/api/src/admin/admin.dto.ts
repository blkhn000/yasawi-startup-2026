import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsObject, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class ContextStatDto {
  @IsString() @MaxLength(50) value: string;
  @IsString() @MaxLength(100) label: string;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
  @IsOptional() @IsIn(["manual", "currentCohort", "totalParticipants", "incubationWeeks", "startupCount"]) source?: "manual" | "currentCohort" | "totalParticipants" | "incubationWeeks" | "startupCount";
}

export class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(999) currentCohort?: number;
  @IsOptional() @IsInt() @Min(0) totalParticipants?: number;
  @IsOptional() @IsInt() @Min(1) @Max(52) incubationWeeks?: number;
  @IsOptional() @IsIn(["open", "soon", "closed", "completed"]) nextCohortStatus?: "open" | "soon" | "closed" | "completed";
  @IsOptional() @IsString() @MaxLength(200) nextCohortDate?: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) responseDays?: number;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() @MinLength(5) @MaxLength(50) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(300) whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(300) instagram?: string;
  @IsOptional() @IsString() @MaxLength(300) telegram?: string;
  @IsOptional() @IsString() @MaxLength(300) youtube?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ContextStatDto) contextStats?: ContextStatDto[];
  @IsOptional() @IsIn(["kk", "ru", "en", "tr"]) defaultLocale?: "kk" | "ru" | "en" | "tr";
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(200) heroEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(200) heroTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) heroOutline?: string;
  @IsOptional() @IsString() @MaxLength(1000) heroDescription?: string;
}

export class UpdateApplicationDto {
  @IsIn(["new", "reviewing", "interview", "accepted", "rejected"])
  status: "new" | "reviewing" | "interview" | "accepted" | "rejected";
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsString() assignedToId?: string | null;
}

export class CreateProjectDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug: string;
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsString() @MinLength(10) @MaxLength(2000) summary: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsArray() @IsString({ each: true }) tags: string[];
  @IsString() stage: string;
  @IsOptional() @IsInt() @Min(1) @Max(9) trlLevel?: number | null;
  @IsOptional() @IsString() cohortLabel?: string;
  @IsOptional() @IsString() cohortId?: string;
  @IsOptional() @IsString() accent?: string;
  @IsOptional() @IsString() secondary?: string;
  @IsOptional() @IsString() glyph?: string;
  @IsOptional() @IsString() visual?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string | null;
  @IsOptional() @IsUrl({ require_protocol: true }) demoUrl?: string | null;
  @IsOptional() @IsUrl({ require_protocol: true }) presentationUrl?: string | null;
  @IsOptional() @IsUrl({ require_protocol: true }) socialUrl?: string | null;
  @IsOptional() @IsArray() team?: unknown[];
  @IsOptional() @IsArray() metrics?: unknown[];
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsIn(["draft", "published", "archived"]) status?: "draft" | "published" | "archived";
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateProjectDto extends CreateProjectDto {
  @IsOptional() declare slug: string;
  @IsOptional() declare name: string;
  @IsOptional() declare summary: string;
  @IsOptional() declare tags: string[];
  @IsOptional() declare stage: string;
}

export class CreateProgramDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug: string;
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsString() duration: string;
  @IsOptional() @IsInt() @Min(1) @Max(104) durationWeeks?: number;
  @IsOptional() @IsString() @MaxLength(100) price?: string;
  @IsOptional() @IsInt() @Min(1) @Max(52) runsPerYear?: number;
  @IsOptional() @IsString() @MaxLength(50) equity?: string;
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsIn(["open", "soon", "closed", "completed"]) status?: "open" | "soon" | "closed" | "completed";
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number | null;
  @IsOptional() @IsDateString() applicationDeadline?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @IsArray() requirements?: unknown[];
  @IsOptional() @IsArray() stages?: unknown[];
  @IsOptional() @IsArray() outcomes?: unknown[];
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateProgramDto extends CreateProgramDto {
  @IsOptional() declare slug: string;
  @IsOptional() declare title: string;
  @IsOptional() declare duration: string;
}

export class ItCourseDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug: string;
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(1000) shortDescription?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsString() @MaxLength(200) dateLabel?: string;
  @IsOptional() @IsString() @MaxLength(100) format?: string;
  @IsOptional() @IsString() @MaxLength(100) duration?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) includes?: string[];
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(2000) imageUrl?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateItCourseDto extends ItCourseDto {
  @IsOptional() declare slug: string;
  @IsOptional() declare title: string;
}

export class CreateCohortDto {
  @IsString() programId: string;
  @IsInt() @Min(1) number: number;
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsIn(["open", "soon", "closed", "completed"]) status?: "open" | "soon" | "closed" | "completed";
  @IsOptional() @IsInt() @Min(1) capacity?: number | null;
  @IsOptional() @IsDateString() applicationDeadline?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateCohortDto extends CreateCohortDto {
  @IsOptional() declare programId: string;
  @IsOptional() declare number: number;
  @IsOptional() declare title: string;
}

export class PartnerDto {
  @IsString() @MinLength(2) name: string;
  @IsString() logoUrl: string;
  @IsOptional() @IsUrl({ require_protocol: true }) websiteUrl?: string | null;
  @IsOptional() @IsString() alt?: string;
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdatePartnerDto extends PartnerDto {
  @IsOptional() declare name: string;
  @IsOptional() declare logoUrl: string;
}

export class PageContentDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) key: string;
  @IsString() page: string;
  @IsObject() content: Record<string, unknown>;
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsString() seoTitle?: string | null;
  @IsOptional() @IsString() seoDescription?: string | null;
  @IsOptional() @IsIn(["draft", "published", "archived"]) status?: "draft" | "published" | "archived";
}

export class UpdatePageContentDto extends PageContentDto {
  @IsOptional() declare key: string;
  @IsOptional() declare page: string;
  @IsOptional() declare content: Record<string, unknown>;
}

export class TeamMemberDto {
  @IsString() name: string;
  @IsString() role: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsString() imageUrl: string;
  @IsOptional() @IsUrl({ require_protocol: true }) profileUrl?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateTeamMemberDto extends TeamMemberDto {
  @IsOptional() declare name: string;
  @IsOptional() declare role: string;
  @IsOptional() declare email: string;
  @IsOptional() declare imageUrl: string;
}

export class NewsItemDto {
  @IsString() title: string;
  @IsOptional() @IsString() summary?: string;
  @IsDateString() eventDate: string;
  @IsString() imageUrl: string;
  @IsUrl({ require_protocol: true }) sourceUrl: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsObject() translations?: Record<string, unknown>;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateNewsItemDto extends NewsItemDto {
  @IsOptional() declare title: string;
  @IsOptional() declare eventDate: string;
  @IsOptional() declare imageUrl: string;
  @IsOptional() declare sourceUrl: string;
}
