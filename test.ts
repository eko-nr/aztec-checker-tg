import cron from "node-cron";
import moment, { Moment } from "moment-timezone";

const EPOCH_START: Moment = moment.tz("2025-09-24 09:40:45", "Asia/Jakarta").utc();
const EPOCH_LENGTH = 1152 * 1000; // 19 menit 12 detik (ms)

function getNextEpochDate(): Moment {
  const now = moment.utc();
  const diff = now.valueOf() - EPOCH_START.valueOf();

  const passed = Math.floor(diff / EPOCH_LENGTH);
  const nextEpoch = EPOCH_START.clone().add((passed + 1) * EPOCH_LENGTH, "ms");
  return nextEpoch;
}

function scheduleNextEpoch(): void {
  const nextEpoch = getNextEpochDate();

  const local = nextEpoch.clone().tz("Asia/Jakarta");
  const sec = local.seconds();
  const min = local.minutes();
  const hour = local.hours();

  const cronExp = `${sec} ${min} ${hour} * * *`;

  console.log(
    "Scheduling epoch at (Jakarta):",
    local.format("YYYY-MM-DD HH:mm:ss Z"),
    "cron:",
    cronExp
  );

  const task = cron.schedule(
    cronExp,
    () => {
      const nowJakarta = moment().tz("Asia/Jakarta");
      console.log("🔥 Epoch triggered at:", nowJakarta.format("YYYY-MM-DD HH:mm:ss Z"));

      task.stop();
      scheduleNextEpoch();
    },
    {
      timezone: "Asia/Jakarta",
    }
  );
}

scheduleNextEpoch();

// ✅ Preview epoch berikutnya
function previewNextEpochs(count = 5): void {
  let next = getNextEpochDate();
  console.log("\nPreview Epoch Schedule (Asia/Jakarta):");
  for (let i = 0; i < count; i++) {
    console.log(
      `Epoch ${i + 1}:`,
      next.clone().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss Z")
    );
    next.add(EPOCH_LENGTH, "ms");
  }
}

previewNextEpochs();
