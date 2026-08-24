import { Module } from "@nestjs/common";
import { ContentController } from "./content.controller";
import { NewsService } from "./news.service";
import { TeamService } from "./team.service";
import { CohortStatsService } from "./cohort-stats.service";

@Module({ controllers: [ContentController], providers: [NewsService, TeamService, CohortStatsService], exports: [NewsService, TeamService, CohortStatsService] })
export class ContentModule {}
