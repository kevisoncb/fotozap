import "dotenv/config";
import { loadEnv } from "./config/env.js";

async function main() {
  const env = loadEnv();
  console.info(
    JSON.stringify({
      msg: "worker_started",
      concurrency: env.IMAGE_WORKER_CONCURRENCY,
      imageProvider: env.IMAGE_PROVIDER,
      note: "BullMQ consumers will be wired in Fase 6",
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
