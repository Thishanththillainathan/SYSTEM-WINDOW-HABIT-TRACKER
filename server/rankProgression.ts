import { query } from './postgres';
import { logChange } from './changeLogger';

export interface RankChallengeRecord {
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
    status: string;
    completedAt?: string;
    evaluatedAt: string;
  }>;
}

export function getCleanRank(rankStr?: string): string {
  if (!rankStr) return 'E';
  const clean = rankStr.toUpperCase().replace('-RANK', '').trim();
  return ['E', 'D', 'C', 'B', 'A', 'S'].includes(clean) ? clean : 'E';
}

export function getNextRank(currentRankStr?: string): string | null {
  const clean = getCleanRank(currentRankStr);
  const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
  const idx = ranks.indexOf(clean);
  if (idx === -1 || idx >= ranks.length - 1) return null;
  return ranks[idx + 1];
}

export function calculatePromotionDate(startDateStr: string, missedDays: number, baseDays: number = 90): string {
  try {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) {
      const now = new Date();
      return new Date(now.getTime() + (baseDays + missedDays) * 86400000).toISOString().split('T')[0];
    }
    const target = new Date(start.getTime() + (baseDays + missedDays) * 86400000);
    return target.toISOString().split('T')[0];
  } catch {
    return 'N/A';
  }
}

export async function evaluateAndGetRankChallenge(userId: string): Promise<RankChallengeRecord | null> {
  // 1. Fetch User Record
  const userRes = await query('SELECT id, username, rank, level FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  if (!user) return null;

  const currentRankClean = getCleanRank(user.rank);

  // If S-Rank, user is at MAX RANK
  if (currentRankClean === 'S') {
    return {
      id: `max-rank-s-${userId}`,
      userId,
      currentRank: 'S',
      targetRank: 'MAX RANK',
      startDate: user.created_at || new Date().toISOString().split('T')[0],
      baseRequiredDays: 90,
      completedDays: 90,
      missedDays: 0,
      promotionDelayDays: 0,
      adjustedRequiredDays: 90,
      originalPromotionDate: 'MAX RANK REACHED',
      currentPromotionDate: 'MAX RANK REACHED',
      status: 'MAX_RANK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      daysHistory: [],
    };
  }

  const targetRankClean = getNextRank(currentRankClean);
  if (!targetRankClean) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Fetch Active Challenge
  let challengeRes = await query(
    'SELECT * FROM rank_challenges WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
    [userId, 'IN_PROGRESS']
  );

  let challenge = challengeRes.rows[0];

  // If no active challenge exists, initialize one
  if (!challenge) {
    const challengeId = `rc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const originalPromoDate = calculatePromotionDate(todayStr, 0, 90);

    await query(
      `INSERT INTO rank_challenges 
       (id, user_id, current_rank, target_rank, start_date, base_required_days, completed_days, missed_days, promotion_delay_days, adjusted_required_days, original_promotion_date, current_promotion_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        challengeId,
        userId,
        currentRankClean,
        targetRankClean,
        todayStr,
        90,
        0,
        0,
        0,
        90,
        originalPromoDate,
        originalPromoDate,
        'IN_PROGRESS',
      ]
    );

    await logChange({
      userId,
      actionType: 'RANK_CHALLENGE_STARTED',
      entityType: 'RPG',
      entityId: challengeId,
      description: `Started 90-day rank challenge: ${currentRankClean}-RANK → ${targetRankClean}-RANK`,
      newValue: JSON.stringify({ currentRank: currentRankClean, targetRank: targetRankClean, startDate: todayStr }),
    });

    challengeRes = await query('SELECT * FROM rank_challenges WHERE id = $1', [challengeId]);
    challenge = challengeRes.rows[0];
  }

  const challengeId = challenge.id;
  const startDateStr = challenge.start_date;

  // 3. Fetch User Schedule & Habit Data for Evaluation
  const [tasksRes, habitsRes, completionsRes, evalDaysRes] = await Promise.all([
    query('SELECT * FROM schedule_tasks WHERE user_id = $1', [userId]),
    query('SELECT * FROM habits WHERE user_id = $1 AND is_active = true', [userId]),
    query('SELECT * FROM habit_completions WHERE user_id = $1', [userId]),
    query('SELECT * FROM rank_challenge_days WHERE challenge_id = $1', [challengeId]),
  ]);

  const existingEvaluatedDates = new Map<string, any>();
  evalDaysRes.rows.forEach((r: any) => {
    existingEvaluatedDates.set(r.scheduled_date, r);
  });

  // Calculate list of dates from startDateStr to todayStr
  const datesToEvaluate: string[] = [];
  const curr = new Date(startDateStr);
  const todayDateObj = new Date(todayStr);

  while (curr <= todayDateObj) {
    datesToEvaluate.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  // Evaluate each date
  for (const dateStr of datesToEvaluate) {
    const isPastDate = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    // Check tasks & habits scheduled on this date
    const tasksOnDate = tasksRes.rows.filter((t: any) => t.task_date === dateStr);
    const hasHabits = habitsRes.rows.length > 0;
    const hasTasks = tasksOnDate.length > 0;

    const isScheduledDay = hasTasks || hasHabits;

    if (!isScheduledDay) {
      // Rest Day
      if (!existingEvaluatedDates.has(dateStr)) {
        const dayId = `rcd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await query(
          `INSERT INTO rank_challenge_days (id, challenge_id, user_id, scheduled_date, status)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (challenge_id, scheduled_date) DO NOTHING`,
          [dayId, challengeId, userId, dateStr, 'REST_DAY']
        );
      }
      continue;
    }

    // Evaluate Completion for Scheduled Day
    const allTasksCompleted = tasksOnDate.length > 0 ? tasksOnDate.every((t: any) => t.is_completed) : true;
    const completionsOnDate = completionsRes.rows.filter(
      (c: any) => c.completion_date === dateStr || (c.completed_at && c.completed_at.toString().includes(dateStr))
    );
    const habitsCompleted = habitsRes.rows.length > 0 ? completionsOnDate.some((c: any) => c.completed) : true;

    const isFullyCompleted = allTasksCompleted && habitsCompleted;

    const existingEval = existingEvaluatedDates.get(dateStr);

    if (isPastDate) {
      // Past day evaluation
      if (!existingEval) {
        const dayId = `rcd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const finalStatus = isFullyCompleted ? 'COMPLETED' : 'MISSED';

        await query(
          `INSERT INTO rank_challenge_days (id, challenge_id, user_id, scheduled_date, status, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (challenge_id, scheduled_date) DO NOTHING`,
          [
            dayId,
            challengeId,
            userId,
            dateStr,
            finalStatus,
            isFullyCompleted ? new Date().toISOString() : null,
          ]
        );

        if (finalStatus === 'COMPLETED') {
          await logChange({
            userId,
            actionType: 'SCHEDULE_DAY_COMPLETED',
            entityType: 'RPG',
            entityId: challengeId,
            description: `Scheduled day ${dateStr} completed for rank challenge`,
          });
        } else {
          await logChange({
            userId,
            actionType: 'SCHEDULE_DAY_MISSED',
            entityType: 'RPG',
            entityId: challengeId,
            description: `Scheduled day ${dateStr} missed! Added +1 day promotion delay`,
            oldValue: 'PENDING',
            newValue: 'MISSED (+1 DAY DELAY)',
          });

          await logChange({
            userId,
            actionType: 'PROMOTION_DELAY_ADDED',
            entityType: 'RPG',
            entityId: challengeId,
            description: `+1 Day promotion delay applied for missed date ${dateStr}`,
          });
        }
      }
    } else if (isToday) {
      // Today evaluation
      if (isFullyCompleted) {
        if (!existingEval || existingEval.status !== 'COMPLETED') {
          const dayId = existingEval ? existingEval.id : `rcd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          if (existingEval) {
            await query(
              'UPDATE rank_challenge_days SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
              ['COMPLETED', dayId]
            );
          } else {
            await query(
              `INSERT INTO rank_challenge_days (id, challenge_id, user_id, scheduled_date, status, completed_at)
               VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) ON CONFLICT (challenge_id, scheduled_date) DO NOTHING`,
              [dayId, challengeId, userId, dateStr, 'COMPLETED']
            );
          }

          await logChange({
            userId,
            actionType: 'SCHEDULE_DAY_COMPLETED',
            entityType: 'RPG',
            entityId: challengeId,
            description: `Scheduled day ${dateStr} completed today`,
          });
        }
      } else {
        // Still pending today
        if (!existingEval) {
          const dayId = `rcd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await query(
            `INSERT INTO rank_challenge_days (id, challenge_id, user_id, scheduled_date, status)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (challenge_id, scheduled_date) DO NOTHING`,
            [dayId, challengeId, userId, dateStr, 'PENDING']
          );
        }
      }
    }
  }

  // 4. Recalculate Challenge Metrics
  const updatedDaysRes = await query('SELECT * FROM rank_challenge_days WHERE challenge_id = $1', [challengeId]);
  const allEvalDays = updatedDaysRes.rows;

  const completedCount = allEvalDays.filter((r: any) => r.status === 'COMPLETED').length;
  const missedCount = allEvalDays.filter((r: any) => r.status === 'MISSED').length;

  const promotionDelayDays = missedCount; // EXACT RULE: 1 missed day = 1 day promotion delay
  const adjustedRequiredDays = 90 + missedCount;
  const currentPromoDate = calculatePromotionDate(startDateStr, missedCount, 90);

  // Check if promotion date changed and log
  if (challenge.current_promotion_date !== currentPromoDate) {
    await logChange({
      userId,
      actionType: 'PROMOTION_DATE_CHANGED',
      entityType: 'RPG',
      entityId: challengeId,
      description: `Promotion date updated to ${currentPromoDate} (${missedCount} missed days)`,
      oldValue: challenge.current_promotion_date,
      newValue: currentPromoDate,
    });
  }

  let finalStatus = 'IN_PROGRESS';
  let isPromoted = false;

  // 5. Check Rank Promotion Eligibility
  if (completedCount >= adjustedRequiredDays) {
    finalStatus = 'COMPLETED';
    isPromoted = true;

    await query(
      'UPDATE rank_challenges SET status = $1, completed_at = CURRENT_TIMESTAMP, completed_days = $2, missed_days = $3, promotion_delay_days = $4, adjusted_required_days = $5, current_promotion_date = $6 WHERE id = $7',
      [finalStatus, completedCount, missedCount, promotionDelayDays, adjustedRequiredDays, currentPromoDate, challengeId]
    );

    // Update User Rank
    await query('UPDATE users SET rank = $1 WHERE id = $2', [targetRankClean, userId]);

    await logChange({
      userId,
      actionType: 'RANK_PROMOTED',
      entityType: 'RPG',
      entityId: challengeId,
      description: `Rank Promoted! ${currentRankClean}-RANK → ${targetRankClean}-RANK after completing ${completedCount} scheduled days`,
      oldValue: `${currentRankClean}-RANK`,
      newValue: `${targetRankClean}-RANK`,
    });

    // Start Next Rank Challenge if available
    const nextTargetRank = getNextRank(targetRankClean);
    if (nextTargetRank) {
      const nextChallengeId = `rc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nextPromoDate = calculatePromotionDate(todayStr, 0, 90);

      await query(
        `INSERT INTO rank_challenges 
         (id, user_id, current_rank, target_rank, start_date, base_required_days, completed_days, missed_days, promotion_delay_days, adjusted_required_days, original_promotion_date, current_promotion_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          nextChallengeId,
          userId,
          targetRankClean,
          nextTargetRank,
          todayStr,
          90,
          0,
          0,
          0,
          90,
          nextPromoDate,
          nextPromoDate,
          'IN_PROGRESS',
        ]
      );

      await logChange({
        userId,
        actionType: 'RANK_CHALLENGE_STARTED',
        entityType: 'RPG',
        entityId: nextChallengeId,
        description: `Started new 90-day rank challenge: ${targetRankClean}-RANK → ${nextTargetRank}-RANK`,
      });
    }

    // Recursively return updated challenge state
    return await evaluateAndGetRankChallenge(userId);
  }

  // 6. Update Active Challenge with Latest Metrics
  await query(
    `UPDATE rank_challenges 
     SET completed_days = $1, missed_days = $2, promotion_delay_days = $3, adjusted_required_days = $4, current_promotion_date = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [completedCount, missedCount, promotionDelayDays, adjustedRequiredDays, currentPromoDate, challengeId]
  );

  return {
    id: challengeId,
    userId,
    currentRank: challenge.current_rank,
    targetRank: challenge.target_rank,
    startDate: challenge.start_date,
    baseRequiredDays: challenge.base_required_days || 90,
    completedDays: completedCount,
    missedDays: missedCount,
    promotionDelayDays,
    adjustedRequiredDays,
    originalPromotionDate: challenge.original_promotion_date,
    currentPromotionDate: currentPromoDate,
    status: finalStatus,
    completedAt: challenge.completed_at,
    createdAt: challenge.created_at,
    updatedAt: challenge.updated_at,
    daysHistory: allEvalDays.map((r: any) => ({
      id: r.id,
      challengeId: r.challenge_id,
      scheduledDate: r.scheduled_date,
      status: r.status,
      completedAt: r.completed_at,
      evaluatedAt: r.evaluated_at,
    })),
  };
}
