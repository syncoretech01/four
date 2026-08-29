import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { chatSendSchema } from "@four/shared";
import { getChatHistory, runBot } from "../chat/chatService.js";
import { hasOpenAI } from "../chat/openaiBot.js";
import { executeTool, VOICE_SYSTEM_PROMPT, realtimeTools } from "../chat/tools.js";
import { config } from "../config.js";

const toolCallSchema = z.object({
  name: z.string().min(1).max(60),
  args: z.record(z.unknown()).default({}),
});

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.get("/chat/history", async (req) => ({
    messages: await getChatHistory(req.session),
    aiEnabled: hasOpenAI(),
    voiceEnabled: hasOpenAI(),
  }));

  /** HTTP fallback when the socket is unavailable: one-shot reply. */
  app.post(
    "/chat/messages",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req) => {
      const { message } = chatSendSchema.parse(req.body);
      const reply = await runBot(req.session, message, "http");
      return {
        content: reply.content,
        toolCalls: reply.steps.map((s) => ({ name: s.toolName, label: s.outcome.label, state: "done" })),
        navigateTo: reply.steps.find((s) => s.outcome.navigateTo)?.outcome.navigateTo ?? null,
        confirmAction: reply.steps.find((s) => s.outcome.confirmAction)?.outcome.confirmAction ?? null,
      };
    },
  );

  /**
   * Bridge for the Realtime voice client: the model emits a function call in
   * the browser, the browser posts it here, we run it against the same
   * services (so cart events broadcast) and hand the result back.
   */
  app.post(
    "/chat/tool",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req) => {
      const { name, args } = toolCallSchema.parse(req.body);
      const outcome = await executeTool(req.session, name, args);
      return {
        result: outcome.result,
        label: outcome.label,
        navigateTo: outcome.navigateTo ?? null,
        confirmAction: outcome.confirmAction ?? null,
      };
    },
  );

  /**
   * Mint a short-lived Realtime client secret so the browser can open a
   * WebRTC voice call directly to OpenAI; the API key never leaves the
   * server. Session config (instructions, tools, VAD, voice) is baked in.
   */
  app.post(
    "/chat/realtime-token",
    { config: { rateLimit: { max: 12, timeWindow: "1 minute" } } },
    async (_req, reply) => {
      if (!hasOpenAI()) {
        return reply.code(503).send({ error: { code: "VOICE_DISABLED", message: "Voice needs an OpenAI API key." } });
      }
      try {
        const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session: {
              type: "realtime",
              model: config.OPENAI_REALTIME_MODEL,
              instructions: VOICE_SYSTEM_PROMPT,
              tools: realtimeTools(),
              tool_choice: "auto",
              audio: {
                input: {
                  transcription: { model: "whisper-1" },
                  turn_detection: { type: "server_vad", silence_duration_ms: 600 },
                },
                output: { voice: config.OPENAI_REALTIME_VOICE },
              },
            },
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          app.log.error({ status: res.status, detail }, "realtime client_secret mint failed");
          return reply
            .code(502)
            .send({ error: { code: "VOICE_UNAVAILABLE", message: "Could not start a voice session right now." } });
        }
        const data = (await res.json()) as { value?: string; expires_at?: number };
        if (!data.value) {
          return reply
            .code(502)
            .send({ error: { code: "VOICE_UNAVAILABLE", message: "Voice session returned no token." } });
        }
        return { token: data.value, expiresAt: data.expires_at, model: config.OPENAI_REALTIME_MODEL };
      } catch (e) {
        app.log.error(e, "realtime token error");
        return reply
          .code(502)
          .send({ error: { code: "VOICE_UNAVAILABLE", message: "Could not start a voice session right now." } });
      }
    },
  );
}
