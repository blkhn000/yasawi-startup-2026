import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import sharp from "sharp";
import { MediaStorageService } from "../src/media/media-storage.service";
import { NotificationsService } from "../src/notifications/notifications.service";

async function run() {
  const previous = {
    MEDIA_ROOT: process.env.MEDIA_ROOT,
    PUBLIC_API_URL: process.env.PUBLIC_API_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    S3_BUCKET: process.env.S3_BUCKET,
  };
  const temporary = await mkdtemp(join(process.cwd(), "integration-test-"));
  assert.ok(resolve(temporary).startsWith(resolve(process.cwd())), "Temporary media path escaped the API workspace");

  try {
    process.env.MEDIA_ROOT = basename(temporary);
    process.env.PUBLIC_API_URL = "http://localhost:4000";
    delete process.env.S3_BUCKET;
    delete process.env.SMTP_HOST;

    const notifications = new NotificationsService({} as never);
    assert.equal(notifications.status().configured, false);
    await assert.rejects(() => notifications.verify(), /SMTP не настроен/);

    const storage = new MediaStorageService();
    assert.equal((await storage.verify()).reachable, true);
    const input = await sharp({ create: { width: 32, height: 20, channels: 3, background: "#5b2a86" } }).png().toBuffer();
    const saved = await storage.save({ buffer: input, mimetype: "image/png" } as Express.Multer.File);
    assert.equal(saved.width, 32);
    assert.equal(saved.height, 20);
    assert.match(saved.url, /\/uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/i);
    const localPath = join(temporary, ...saved.key.split("/"));
    await access(localPath);
    await storage.remove(saved.key);
    await assert.rejects(() => access(localPath));
  } finally {
    Object.assign(process.env, previous);
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key];
    await rm(temporary, { recursive: true, force: true });
  }

  console.log("SMTP and media storage integration contracts passed.");
}

void run();
