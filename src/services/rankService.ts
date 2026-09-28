export interface RankChallengeData {
  id: string;
  userId: string;
  currentRank: string;
  targetRank: string;
  startDate: string;
  baseRequiredDays: number;
  completedDays: number;
  missedDays: number;
  promotionDelayDays: number;
  adjustedRequiredDays: number;
  originalPromotionDate: string;
  currentPromotionDate: string;
  status: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  daysHistory?: Array<{
    id: string;
    challengeId: string;
    scheduledDate: string;
    status: 'COMPLETED' | 'MISSED' | 'REST_DAY' | 'PENDING';
    completedAt?: string;
    evaluatedAt: string;
  }>;
}

export async function fetchRankChallenge(): Promise<RankChallengeData | null> {
  try {
    const res = await fetch('/api/user/rank-challenge');
    if (!res.ok) return null;
    const data = await res.json();
    return data.challenge || null;
  } catch (err) {
    console.error('Error fetching rank challenge:', err);
    return null;
  }
}

export async function fetchRankChallengeHistory(): Promise<RankChallengeData[]> {
  try {
    const res = await fetch('/api/user/rank-challenge/history');
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    console.error('Error fetching rank challenge history:', err);
    return [];
  }
}

export const rankService = {
  fetchRankChallenge,
  fetchRankChallengeHistory,
};
