/**
 * Chat orchestration: persists history, prefers OpenAI (streaming over the
 * session socket room), falls back to the deterministic bot on any failure,
 * and emits chat:done with navigation + checkout actions for the UI.
 */
import { randomUUID } from "node:crypto";
import { prisma, ChatRole } from "@four/db";
import type { SessionContext } from "../plugins/session.js";
import { emitToSession } from "../realtime/io.js";
import { fallbackReply, type BotReply } from "./fallbackBot.js";
import { hasOpenAI, openaiReply } from "./openaiBot.js";

export async function getChatHistory(ctx: SessionContext) {
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId: ctx.sessionId },
    orderBy: { createdAt: "asc" },
    take: 40,
  });
  return rows.map((r) => ({
    id: r.id,
    role: r.role === ChatRole.USER ? ("user" as const) : ("assistant" as const),
    content: r.content,
    toolCalls: (r.toolCalls as { name: string; label: string }[] | null) ?? [],
  }));
}

export async function runBot(ctx: SessionContext, message: string, messageId: string): Promise<BotReply> {
  if (hasOpenAI()) {
    try {
      const history = (await getChatHistory(ctx)).map((m) => ({ role: m.role, content: m.content }));
      return await openaiReply(ctx, history, message, {
        onDelta: (delta) => emitToSession(ctx.sessionId, "chat:delta", { messageId, delta }),
        onTool: (name, label, state) => emitToSession(ctx.sessionId, "chat:tool", { messageId, name, label, state }),
      });
    } catch (e) {
      console.error("[chat] OpenAI failed, using fallback bot:", e instanceof Error ? e.message : e);
    }
  }
  return fallbackReply(ctx, message);
}

export async function handleChatMessage(ctx: SessionContext, message: string): Promise<void> {
  const messageId = randomUUID();
  await prisma.chatMessage.create({
    data: { sessionId: ctx.sessionId, role: ChatRole.USER, content: message },
  });

  const reply = await runBot(ctx, message, messageId);

  await prisma.chatMessage.create({
    data: {
      sessionId: ctx.sessionId,
      role: ChatRole.ASSISTANT,
      content: reply.content,
      toolCalls: reply.steps.map((s) => ({ name: s.toolName, label: s.outcome.label })),
    },
  });

  emitToSession(ctx.sessionId, "chat:done", {
    messageId,
    content: reply.content,
    navigateTo: reply.steps.find((s) => s.outcome.navigateTo)?.outcome.navigateTo ?? null,
    confirmAction: reply.steps.find((s) => s.outcome.confirmAction)?.outcome.confirmAction ?? null,
  });
}
