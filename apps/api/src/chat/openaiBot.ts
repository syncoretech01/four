/**
 * OpenAI-powered chat: a bounded tool loop over the shared tool executor,
 * streaming deltas to the session's socket room. Falls back to the
 * deterministic bot upstream when the key is absent or a call fails.
 */
import OpenAI from "openai";
import { config } from "../config.js";
import type { SessionContext } from "../plugins/session.js";
import { CHAT_SYSTEM_PROMPT, TOOL_DEFS, executeTool, type ToolOutcome } from "./tools.js";
import type { BotReply, BotStep } from "./fallbackBot.js";

let client: OpenAI | null = null;

export function hasOpenAI(): boolean {
  return Boolean(config.OPENAI_API_KEY);
}

function getClient(): OpenAI {
  client ??= new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return client;
}

const MAX_TOOL_ROUNDS = 6;

export interface StreamHooks {
  onDelta?: (delta: string) => void;
  onTool?: (name: string, label: string, state: "running" | "done" | "error") => void;
}

export async function openaiReply(
  ctx: SessionContext,
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
  hooks: StreamHooks = {},
): Promise<BotReply> {
  const openai = getClient();
  const steps: BotStep[] = [];

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-12),
    { role: "user", content: message },
  ];
  const tools: OpenAI.ChatCompletionTool[] = TOOL_DEFS.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters as Record<string, unknown> },
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages,
      tools,
      stream: true,
    });

    let content = "";
    const toolCalls = new Map<number, { id: string; name: string; args: string }>();
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        hooks.onDelta?.(delta.content);
      }
      for (const tc of delta.tool_calls ?? []) {
        const entry = toolCalls.get(tc.index) ?? { id: "", name: "", args: "" };
        if (tc.id) entry.id = tc.id;
        if (tc.function?.name) entry.name += tc.function.name;
        if (tc.function?.arguments) entry.args += tc.function.arguments;
        toolCalls.set(tc.index, entry);
      }
    }

    if (toolCalls.size === 0) {
      return { content: content || "Sorry, say that again?", steps };
    }

    const calls = [...toolCalls.values()];
    messages.push({
      role: "assistant",
      content: content || null,
      tool_calls: calls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.args } })),
    });

    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.args || "{}") as Record<string, unknown>;
      } catch {
        /* leave empty */
      }
      hooks.onTool?.(call.name, call.name, "running");
      let outcome: ToolOutcome;
      try {
        outcome = await executeTool(ctx, call.name, args);
        hooks.onTool?.(call.name, outcome.label, "done");
      } catch (e) {
        outcome = { result: { error: e instanceof Error ? e.message : "tool failed" }, label: `${call.name} failed` };
        hooks.onTool?.(call.name, outcome.label, "error");
      }
      steps.push({ toolName: call.name, outcome });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(outcome.result) });
    }
  }

  return { content: "That took too many steps - could you say it more simply?", steps };
}
