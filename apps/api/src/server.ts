import { buildApp } from "./app.js";
import { config } from "./config.js";
import { initIO } from "./realtime/io.js";
import { sweepPendingPos } from "./pos/queue.js";

async function main(): Promise<void> {
  const app = await buildApp();
  initIO(app.server);
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`FOUR api on :${config.PORT}`);
  // re-drive any order a restart stranded before it reached the POS
  void sweepPendingPos().catch((e) => app.log.error(e, "pos sweep failed"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
