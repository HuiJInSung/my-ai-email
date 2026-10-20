import { connection, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EmailLogModel } from "@/lib/db/email-log";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

// 讀取寄信紀錄，新的在前；?limit= 可調整筆數（預設 30，最多 100）
export async function GET(request: NextRequest) {
  await connection();

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    await connectToDatabase();
    const logs = await EmailLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-html -text -__v")
      .lean();

    const emails = logs.map(({ _id, ...rest }) => ({ id: String(_id), ...rest }));
    return Response.json({ ok: true, emails });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
