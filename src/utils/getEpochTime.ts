import moment, { Moment } from "moment-timezone";

const timezone = "Asia/Jakarta";
const EPOCH_START: Moment = moment.tz("2025-09-24 09:40:40", timezone).utc();
const EPOCH_LENGTH = 1152 * 1000; // 19 menit 12 detik (ms)

export function getNextEpochDate(): Moment {
  const now = moment.utc();
  const diff = now.valueOf() - EPOCH_START.valueOf();

  const passed = Math.floor(diff / EPOCH_LENGTH);
  const nextEpoch = EPOCH_START.clone().add((passed + 1) * EPOCH_LENGTH, "ms");
  return nextEpoch;
}

function getRealtimeCurrentEpochIndex(): number {
  const now = moment.utc();
  const diff = now.valueOf() - EPOCH_START.valueOf();
  return Math.floor(diff / EPOCH_LENGTH);
}

function getRealtimeCurrentEpochStart(): Moment {
  const idx = getRealtimeCurrentEpochIndex();
  return EPOCH_START.clone().add(idx * EPOCH_LENGTH, "ms");
}

export function epochTimePassed(currentEpoch: number, oldEpoch: number): string {
  const currentRealtimeStartUTC = getRealtimeCurrentEpochStart();
  const now = moment().tz(timezone);

  const labelDelta = oldEpoch - currentEpoch; 
  const oldEpochStartJakarta = currentRealtimeStartUTC
    .clone()
    .add(labelDelta * EPOCH_LENGTH, "ms")
    .tz(timezone);

  const duration = moment.duration(now.diff(oldEpochStartJakarta))
  const days = duration.days();
  const hours = duration.hours();

  return `${oldEpochStartJakarta.format('YYYY MMM DD, HH:mm [GMT]ZZ')} (${days} days ${hours} hours ago)`
}
