import { Module } from "@nestjs/common";
import { ApplicationsModule } from "../applications/applications.module";
import { AuthModule } from "../auth/auth.module";
import { ContentModule } from "../content/content.module";
import { MediaModule } from "../media/media.module";
import { AdminController } from "./admin.controller";

@Module({ imports: [ApplicationsModule, AuthModule, ContentModule, MediaModule], controllers: [AdminController] })
export class AdminModule {}
