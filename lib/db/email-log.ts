import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// 每次寄信（成功或失敗）都會存一筆，包含當次的晨報資料與信件內容
const emailLogSchema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    resendId: { type: String },
    error: { type: String },
    brief: {
      date: { type: String, required: true },
      weather: { type: Schema.Types.Mixed },
      stock: { type: Schema.Types.Mixed },
      news: { type: Schema.Types.Mixed },
      summary: { type: Schema.Types.Mixed },
      errors: { type: Schema.Types.Mixed },
    },
    html: { type: String },
    text: { type: String },
  },
  { timestamps: true },
);

export type EmailLog = InferSchemaType<typeof emailLogSchema>;

export const EmailLogModel: Model<EmailLog> =
  (models.EmailLog as Model<EmailLog>) ?? model<EmailLog>("EmailLog", emailLogSchema);
