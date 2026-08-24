import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AdminAuthGuard } from "./admin-auth.guard";
import { LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { CurrentAdmin } from "./current-admin.decorator";
import type { AuthenticatedAdmin } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto.email, dto.password, { ip: request.ip, userAgent: request.headers["user-agent"] });
    setAuthCookies(response, result.accessToken, result.refreshToken, result.refreshExpiresAt);
    return { admin: result.admin };
  }

  @Post("refresh")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.refresh(request.cookies?.yasawi_refresh as string | undefined);
    response.cookie("yasawi_access", result.accessToken, accessCookie());
    return { admin: result.admin };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.yasawi_refresh as string | undefined);
    response.clearCookie("yasawi_access", { ...cookieBase(), path: "/api" });
    response.clearCookie("yasawi_refresh", { ...cookieBase(), path: "/api/auth" });
    return { success: true };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: AuthenticatedAdmin) { return { admin }; }
}

function setAuthCookies(response: Response, accessToken: string, refreshToken: string, refreshExpiresAt: Date) {
  response.cookie("yasawi_access", accessToken, accessCookie());
  response.cookie("yasawi_refresh", refreshToken, { ...cookieBase(), path: "/api/auth", expires: refreshExpiresAt });
}
function cookieBase() { return { httpOnly: true, secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true", sameSite: "lax" as const }; }
function accessCookie() { return { ...cookieBase(), path: "/api", maxAge: 15 * 60 * 1000 }; }
