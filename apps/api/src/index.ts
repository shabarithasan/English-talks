import { createApp } from "./app.js";
import { config, databaseEnabled } from "./config.js";
import { ensureSeedData } from "./lib/bootstrap.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

async function start() {
  if (databaseEnabled) {
    await prisma.$connect();
    await ensureSeedData();
  } else {
    console.log("English Talks API starting in stateless demo mode");
  }

  app.listen(config.API_PORT, () => {
    console.log(`English Talks API listening on http://localhost:${config.API_PORT}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start API", error);
  await prisma.$disconnect();
  process.exit(1);
});
