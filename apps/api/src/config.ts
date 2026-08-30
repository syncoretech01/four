import { z } from "zod";
import { DEFAULT_TAX_RATE_CARD, DEFAULT_TAX_RATE_COD } from "@four/shared";

/** Development convenience only; refused at boot in production. */
export const DEV_ADMIN_PIN = "1234";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  /** Secret for HMAC order-confirm tokens and admin session signing. */
  APP_SECRET: z.string().min(16).default("dev-secret-change-me-please"),
  /**
   * Kitchen staff sign in on a tablet, so the credential is a numeric PIN they
   * can type on a numpad. Four digits is only 10,000 combinations, so the login
   * route pairs this with a lockout - see routes/admin.ts.
   */
  ADMIN_PIN: z
    .string()
    .regex(/^\d{4,8}$/, "ADMIN_PIN must be 4-8 digits")
    .default(DEV_ADMIN_PIN),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime"),
  OPENAI_REALTIME_VOICE: z.string().default("marin"),

  POS_PROVIDER: z.enum(["console", "demo", "webhook", "cornpos", "foodics"]).default("console"),
  POS_WEBHOOK_URL: z.string().optional(),
  POS_WEBHOOK_TOKEN: z.string().optional(),
  /** Corn POS order-intake endpoint + key, issued by their integration team. */
  CORNPOS_API_URL: z.string().url().optional(),
  CORNPOS_API_KEY: z.string().optional(),
  /** Our branch id -> Corn POS outlet id, e.g. "fairways-dha6:1,allama-iqbal-town:2,lake-city:3". */
  CORNPOS_BRANCH_MAP: z.string().optional(),
  FOODICS_API_TOKEN: z.string().optional(),
  FOODICS_BRANCH_ID: z.string().optional(),

  /**
   * Online card payments. "none" (default) keeps today's behavior: CARD means
   * the rider brings a card machine. "demo" exercises the full
   * pending-payment -> gateway -> webhook -> confirmed rail with a built-in
   * demo gateway page. "safepay"/"payfast" are the real Pakistani gateways,
   * pending FOUR's merchant account.
   */
  PAYMENT_PROVIDER: z.enum(["none", "demo", "safepay", "payfast"]).default("none"),
  SAFEPAY_API_KEY: z.string().optional(),
  SAFEPAY_SECRET: z.string().optional(),
  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_SECURED_KEY: z.string().optional(),

  /** Customer messaging: order updates + sign-in codes. */
  NOTIFY_PROVIDER: z.enum(["console", "webhook", "whatsapp"]).default("console"),
  NOTIFY_WEBHOOK_URL: z.string().optional(),
  NOTIFY_WEBHOOK_TOKEN: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),

  /** Dev/staging convenience: ignore opening hours. Refused in production. */
  FORCE_OPEN: z.coerce.boolean().default(false),

  TAX_RATE_COD: z.coerce.number().min(0).max(1).default(DEFAULT_TAX_RATE_COD),
  TAX_RATE_CARD: z.coerce.number().min(0).max(1).default(DEFAULT_TAX_RATE_CARD),
});

export const config = envSchema.parse(process.env);
export const isProd = config.NODE_ENV === "production";

// a shipped default PIN is the same as no PIN at all
if (isProd && config.ADMIN_PIN === DEV_ADMIN_PIN) {
  throw new Error("ADMIN_PIN is still the development default - set a real PIN before running in production");
}

if (isProd && config.FORCE_OPEN) {
  throw new Error("FORCE_OPEN must not be set in production - it bypasses opening hours");
}
