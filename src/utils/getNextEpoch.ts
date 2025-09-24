import cron from "node-cron";
import moment, { Moment } from "moment-timezone";

const EPOCH_START: Moment = moment.tz("2025-09-24 09:40:40", "Asia/Jakarta").utc();
const EPOCH_LENGTH = 1152 * 1000; // 19 menit 12 detik (ms)

export function getNextEpochDate(): Moment {
  const now = moment.utc();
  const diff = now.valueOf() - EPOCH_START.valueOf();

  const passed = Math.floor(diff / EPOCH_LENGTH);
  const nextEpoch = EPOCH_START.clone().add((passed + 1) * EPOCH_LENGTH, "ms");
  return nextEpoch;
}