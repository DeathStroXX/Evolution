import { col } from "@/lib/db";
import type {
  Event,
  Profile,
  Registration,
  Referral,
  PointsEntry,
  RewardRule,
} from "@/lib/types";

export const events = () => col<Event>("events");
export const profiles = () => col<Profile>("profiles");
export const registrations = () => col<Registration>("registrations");
export const referrals = () => col<Referral>("referrals");
export const pointsLedger = () => col<PointsEntry>("points_ledger");
export const rewardRules = () => col<RewardRule>("reward_rules");
