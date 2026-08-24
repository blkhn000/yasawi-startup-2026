import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { DatabaseModule } from "./database/database.module";
import { MediaModule } from "./media/media.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SecurityStartupService } from "./security/security-startup.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    ContentModule,
    ApplicationsModule,
    AdminModule,
    MediaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, SecurityStartupService],
})
export class AppModule {}
