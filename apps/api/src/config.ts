import { z } from "zod";
import { DEFAULT_TAX_RATE_CARD, DEFAULT_TAX_RATE_COD } from "@four/shared";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  /** Secret for HMAC order-confirm tokens and admin session signing. */
  APP_SECRET: z.string().min(16).default("dev-secret-change-me-please"),
  ADMIN_PASSWORD: z.string().min(4).default("four-admin"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime"),
  OPENAI_REALTIME_VOICE: z.string().default("marin"),

  POS_PROVIDER: z.enum(["console", "webhook", "foodics"]).default("console"),
  POS_WEBHOOK_URL: z.string().optional(),
  POS_WEBHOOK_TOKEN: z.string().optional(),
  FOODICS_API_TOKEN: z.string().optional(),
  FOODICS_BRANCH_ID: z.string().optional(),

  TAX_RATE_COD: z.coerce.number().min(0).max(1).default(DEFAULT_TAX_RATE_COD),
  TAX_RATE_CARD: z.coerce.number().min(0).max(1).default(DEFAULT_TAX_RATE_CARD),
});

export const config = envSchema.parse(process.env);
export const isProd = config.NODE_ENV === "production";
