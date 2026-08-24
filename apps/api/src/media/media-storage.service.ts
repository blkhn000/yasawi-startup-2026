import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp = require("sharp");

@Injectable()
export class MediaStorageService {
  private readonly root = process.env.MEDIA_ROOT ? join(process.cwd(), process.env.MEDIA_ROOT) : join(process.cwd(), "uploads");
  private readonly bucket = process.env.S3_BUCKET;
  private readonly s3 = this.bucket ? new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" } : undefined,
  }) : null;

  status() {
    return {
      service: "storage" as const,
      configured: true,
      mode: this.s3 ? "s3" as const : "local" as const,
      bucket: this.s3 ? this.bucket : null,
      publicUrl: process.env.S3_PUBLIC_URL || process.env.PUBLIC_API_URL || null,
    };
  }

  async verify() {
    try {
      if (this.s3 && this.bucket) await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      else {
        await mkdir(this.root, { recursive: true });
        await access(this.root, constants.R_OK | constants.W_OK);
      }
      return { ...this.status(), reachable: true };
    } catch {
      throw new ServiceUnavailableException(this.s3 ? "Не удалось подключиться к S3-хранилищу" : "Локальная папка медиа недоступна для записи");
    }
  }

  async save(file: Express.Multer.File) {
    if (!/^image\/(jpeg|png|webp|avif)$/i.test(file.mimetype)) throw new BadRequestException("Разрешены изображения JPEG, PNG, WebP и AVIF");
    const image = sharp(file.buffer, { failOn: "error" }).rotate();
    const metadata = await image.metadata();
    if ((metadata.width ?? 0) > 8000 || (metadata.height ?? 0) > 8000) throw new BadRequestException("Изображение слишком большое");
    const { data: output, info } = await image.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toBuffer({ resolveWithObject: true });
    const date = new Date();
    const key = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

    try {
      if (this.s3 && this.bucket) {
        await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: output, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
      } else {
        const path = join(this.root, ...key.split("/"));
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, output);
      }
    } catch {
      throw new ServiceUnavailableException("Не удалось сохранить изображение в медиахранилище");
    }

    const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "") ?? `${(process.env.PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/uploads`;
    return { key, url: `${publicBase}/${key}`, size: output.byteLength, width: info.width, height: info.height, mimeType: "image/webp" };
  }

  async remove(key: string) {
    if (!/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/i.test(key)) throw new BadRequestException("Некорректный ключ медиафайла");
    if (this.s3 && this.bucket) await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    else await unlink(join(this.root, ...key.split("/"))).catch(() => undefined);
  }
}
