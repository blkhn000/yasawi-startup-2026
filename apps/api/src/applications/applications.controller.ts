import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./create-application.dto";

@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  create(@Body() dto: CreateApplicationDto, @Req() request: Request) {
    return this.applications.create(dto, { ip: request.ip, userAgent: request.headers["user-agent"] });
  }
}
