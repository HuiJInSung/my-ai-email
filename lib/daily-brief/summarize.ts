import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

export type BriefSummary = {
  greeting: string;
  weatherSummary: string;
  stockSummary: string;
  newsHighlights: string[];
  encouragement: string;
};

// 把天氣、股價、新聞丟給 OpenAI，整理成摘要並產生鼓勵的話
export async function summarizeBrief(input: unknown): Promise<BriefSummary> {
  const client = new OpenAI();

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `你是一位溫暖的每日晨報助理，請用繁體中文回覆，並只輸出 JSON，格式如下：
{
  "greeting": "一句早安問候",
  "weatherSummary": "今天天氣重點與穿著或帶傘建議",
  "stockSummary": "台積電最近一個交易日的表現摘要",
  "newsHighlights": ["3 到 5 則最值得關注的台灣國內新聞，每則一句話，語氣客觀中立"],
  "encouragement": "結合以上資訊、真誠具體的鼓勵話語，2 到 3 句"
}
若某項資料缺失（值為 null），請在對應欄位簡短說明資料暫時無法取得。`,
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI 沒有回傳內容");
  return JSON.parse(content) as BriefSummary;
}
