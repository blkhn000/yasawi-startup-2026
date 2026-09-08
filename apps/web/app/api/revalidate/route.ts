import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const apiOrigin = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

export async function POST(request: Request) {
  const authResponse = await fetch(`${apiOrigin}/api/auth/me`, {
    cache: "no-store",
    headers: { cookie: request.headers.get("cookie") ?? "" },
  }).catch(() => null);

  if (!authResponse?.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  revalidateTag("public-content");
  return NextResponse.json({ revalidated: true });
}
