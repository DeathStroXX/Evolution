export interface Profile {
  _id: string;
  name?: string;
  email?: string;
  interests: string[];
  createdAt: Date;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  startsAt?: Date;
  location?: string;
  sourceUrl?: string;
  imageUrl?: string;
  coverImage?: string;
  tags: string[];
  organizerId?: string;
  seatLimit?: number;
  clicks?: number;
  pitchEmailSent?: boolean;
  pointsRuleId?: string;
  createdAt: Date;
}

export interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  referralCode?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
}

export interface Referral {
  _id: string;
  eventId: string;
  referrerId: string;
  code: string;
  platform?: string;
  clicks: number;
  createdAt: Date;
}

export interface PointsEntry {
  _id: string;
  userId: string;
  eventId: string;
  reason: "share" | "signup" | "checkin";
  points: number;
  /** Share platform (whatsapp, telegram, ...) — set for `reason: "share"` entries. */
  platform?: string;
  dedupeKey: string;
  createdAt: Date;
}

export interface RewardRule {
  _id: string /* = eventId */;
  mode: "signup" | "checkin";
  threshold: number;
  rewardLabel: string;
}
