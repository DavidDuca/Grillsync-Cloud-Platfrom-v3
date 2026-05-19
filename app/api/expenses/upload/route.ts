import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { uploadDataUrl } from "@/lib/cloudinary";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const a = getAuth(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { dataUrl } = await req.json();
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });
  if (!process.env.CLOUDINARY_CLOUD_NAME) return NextResponse.json({ url: dataUrl, note: "cloudinary not configured" });
  const url = await uploadDataUrl(dataUrl);
  return NextResponse.json({ url });
}
