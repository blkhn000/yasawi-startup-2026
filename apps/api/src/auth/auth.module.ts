import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminRoleGuard } from "./admin-role.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard, AdminRoleGuard],
  exports: [JwtModule, AuthService, AdminAuthGuard, AdminRoleGuard],
})
export class AuthModule {}
