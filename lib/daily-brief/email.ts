// 把每日晨報轉成 email 用的 HTML（table 排版 + inline style，相容各家信箱）與純文字版
import type { DailyBrief } from ".";

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft JhengHei',Arial,sans-serif";

function section(title: string, body: string) {
  return `
    <tr>
      <td style="padding:0 24px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;">
          <tr>
            <td style="padding:20px;">
              <h2 style="margin:0 0 12px;font-size:17px;color:#18181b;">${title}</h2>
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

const paragraph = (text: string) => `<p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#52525b;">${escapeHtml(text)}</p>`;
const errorText = (text: string) => `<p style="margin:0;font-size:14px;color:#dc2626;">資料取得失敗：${escapeHtml(text)}</p>`;

function statsTable(stats: [string, string][]) {
  const cells = stats
    .map(
      ([label, value]) => `
        <td width="25%" style="padding:4px 0;vertical-align:top;">
          <div style="font-size:12px;color:#71717a;">${escapeHtml(label)}</div>
          <div style="font-size:15px;font-weight:600;color:#18181b;">${escapeHtml(value)}</div>
        </td>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>${cells}</tr></table>`;
}

export function renderBriefEmail(brief: DailyBrief): { subject: string; html: string; text: string } {
  const { date, weather, stock, news, summary, errors } = brief;
  const subject = `每日晨報｜${date}`;

  const encouragement = errors.summary
    ? errorText(errors.summary)
    : summary
      ? `<p style="margin:0;font-size:18px;font-weight:600;color:#18181b;">${escapeHtml(summary.greeting)}</p>${paragraph(summary.encouragement)}`
      : "";

  const weatherBody = errors.weather
    ? errorText(errors.weather)
    : weather
      ? `<p style="margin:0;font-size:28px;font-weight:700;color:#18181b;">${escapeHtml(weather.currentTemperature)}°C
           <span style="font-size:14px;font-weight:400;color:#52525b;">${escapeHtml(weather.location)}・${escapeHtml(weather.description)}</span></p>
         ${statsTable([
           ["最高 / 最低", `${weather.maxTemperature}° / ${weather.minTemperature}°`],
           ["體感溫度", `${weather.apparentTemperature}°C`],
           ["濕度", `${weather.humidity}%`],
           ["降雨機率", `${weather.precipitationProbability}%`],
         ])}
         ${summary ? paragraph(summary.weatherSummary) : ""}`
      : "";

  // 台股慣例：漲紅跌綠
  const changeColor = stock && stock.change > 0 ? "#dc2626" : stock && stock.change < 0 ? "#16a34a" : "#71717a";
  const changeSign = stock && stock.change > 0 ? "▲" : stock && stock.change < 0 ? "▼" : "－";
  const stockBody = errors.stock
    ? errorText(errors.stock)
    : stock
      ? `<p style="margin:0;font-size:28px;font-weight:700;color:#18181b;">${escapeHtml(stock.close.toLocaleString())}
           <span style="font-size:15px;font-weight:600;color:${changeColor};">${changeSign} ${escapeHtml(Math.abs(stock.change))}</span>
           <span style="font-size:13px;font-weight:400;color:#71717a;">${escapeHtml(stock.stockNo)}・${escapeHtml(stock.date)}</span></p>
         ${statsTable([
           ["開盤", stock.open.toLocaleString()],
           ["最高", stock.high.toLocaleString()],
           ["最低", stock.low.toLocaleString()],
           ["成交量（張）", Math.round(stock.volume / 1000).toLocaleString()],
         ])}
         ${summary ? paragraph(summary.stockSummary) : ""}`
      : "";

  const highlightsBody =
    summary && summary.newsHighlights.length > 0
      ? `<ul style="margin:0;padding-left:20px;font-size:14px;line-height:22px;color:#27272a;">${summary.newsHighlights
          .map((h) => `<li style="margin-bottom:6px;">${escapeHtml(h)}</li>`)
          .join("")}</ul>`
      : "";

  const newsBody = errors.news
    ? errorText(errors.news)
    : news
      ? news.items
          .map(
            (item) => `
          <div style="padding:10px 0;border-top:1px solid #f4f4f5;">
            <a href="${escapeHtml(item.link)}" style="font-size:15px;font-weight:600;color:#2563eb;text-decoration:none;">${escapeHtml(item.title)}</a>
            <p style="margin:4px 0 0;font-size:13px;line-height:20px;color:#71717a;">${escapeHtml(item.snippet)}</p>
          </div>`,
          )
          .join("")
      : "";

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
          <tr>
            <td style="padding:28px 24px 20px;">
              <h1 style="margin:0;font-size:24px;color:#18181b;">每日晨報</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#71717a;">${escapeHtml(date)}</p>
            </td>
          </tr>
          ${section("💪 給你的鼓勵", encouragement)}
          ${section("🌤️ 今日天氣", weatherBody)}
          ${section("📈 台積電股價", stockBody)}
          ${highlightsBody ? section("✨ AI 新聞重點", highlightsBody) : ""}
          ${section(`📰 科技新聞${news ? `（${escapeHtml(news.source)}）` : ""}`, newsBody)}
          <tr>
            <td style="padding:0 24px 24px;font-size:12px;color:#a1a1aa;text-align:center;">此信由 my-ai-email 自動產生</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `每日晨報 ${date}`,
    "",
    summary ? `${summary.greeting}\n${summary.encouragement}` : "",
    "",
    "【今日天氣】",
    weather
      ? `${weather.location} ${weather.description} ${weather.currentTemperature}°C（${weather.minTemperature}°~${weather.maxTemperature}°，降雨 ${weather.precipitationProbability}%）`
      : `無法取得：${errors.weather ?? ""}`,
    summary?.weatherSummary ?? "",
    "",
    "【台積電股價】",
    stock ? `${stock.date} 收盤 ${stock.close}（${changeSign}${Math.abs(stock.change)}）` : `無法取得：${errors.stock ?? ""}`,
    summary?.stockSummary ?? "",
    "",
    "【AI 新聞重點】",
    ...(summary?.newsHighlights.map((h) => `- ${h}`) ?? []),
    "",
    "【科技新聞】",
    ...(news?.items.map((item) => `- ${item.title}\n  ${item.link}`) ?? [`無法取得：${errors.news ?? ""}`]),
  ].join("\n");

  return { subject, html, text };
}
