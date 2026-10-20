import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { Resend } from "resend";
import { getDailyBrief } from "@/lib/daily-brief";
import { renderBriefEmail } from "@/lib/daily-brief/email";
import { connectToDatabase } from "@/lib/db/mongoose";
import { EmailLogModel } from "@/lib/db/email-log";

// 背景工作（抓資料 + OpenAI + 寄信 + 存檔）可執行的最長秒數，部署平台會依此設定上限
export const maxDuration = 300;

// Resend 預設寄件人與固定收件人
const FROM = "每日晨報 <onboarding@resend.dev>";
const TO = "huijinsung@gmail.com";

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason));

// 檢查 Authorization: Bearer <CRON_SECRET>，用 timingSafeEqual 避免時序攻擊
function isAuthorized(request: Request, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function sendDailyBriefEmail() {
  const brief = await getDailyBrief();
  const { subject, html, text } = renderBriefEmail(brief);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({ from: FROM, to: TO, subject, html, text });
  if (error) console.error("[send-email] 寄信失敗：", error.message);

  // 不論寄信成功或失敗都存一筆紀錄
  try {
    await connectToDatabase();
    const log = await EmailLogModel.create({
      from: FROM,
      to: TO,
      subject,
      status: error ? "failed" : "sent",
      resendId: data?.id,
      error: error?.message,
      brief,
      html,
      text,
    });
    console.log(`[send-email] 完成，status=${log.status} resendId=${data?.id} logId=${log.id}`);
  } catch (e) {
    console.error("[send-email] 存入資料庫失敗：", errorMessage(e));
  }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "伺服器未設定 CRON_SECRET" }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 先回應讓 cron-job.org 不會逾時，寄信與存檔在回應送出後於背景執行
  after(async () => {
    try {
      await sendDailyBriefEmail();
    } catch (e) {
      console.error("[send-email] 背景工作失敗：", errorMessage(e));
    }
  });

  return Response.json({ ok: true, message: "已排入背景寄信", to: TO });
}
