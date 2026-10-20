import { connection } from "next/server";
import { getTaiwanHeadlines } from "@/lib/daily-brief/headlines";

// 即時讀取台灣國內重大新聞
export async function GET() {
  await connection();

  try {
    return Response.json({ ok: true, ...(await getTaiwanHeadlines()) });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
