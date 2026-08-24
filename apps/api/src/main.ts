import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression = require("compression");
import cookieParser = require("cookie-parser");
import helmet from "helmet";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { AppModule } from "./app.module";
import { assertRuntimeEnvironment } from "./config/runtime-environment";

for (const path of [join(process.cwd(), ".env"), join(process.cwd(), "..", "..", ".env")]) {
  try { loadEnvFile(path); } catch {}
}

async function bootstrap() {
  const environment = assertRuntimeEnvironment();
  const logger = new Logger("RuntimeEnvironment");
  for (const warning of environment.warnings) logger.warn(warning);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(cookieParser());
  app.useStaticAssets(process.env.MEDIA_ROOT ? join(process.cwd(), process.env.MEDIA_ROOT) : join(process.cwd(), "uploads"), { prefix: "/uploads/", maxAge: 31_536_000_000, immutable: true });

  const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));

  const swaggerEnabled = process.env.SWAGGER_ENABLED === "true" || process.env.NODE_ENV !== "production";
  if (swaggerEnabled) {
    const swagger = new DocumentBuilder().setTitle("Yasawi Startup API").setDescription("Публичное API и административная CMS Yasawi Startup").setVersion("2.0").addCookieAuth("yasawi_access").build();
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger), { swaggerOptions: { persistAuthorization: true } });
  }

  await app.listen(Number(process.env.PORT) || 4000, "0.0.0.0");
}

void bootstrap();
