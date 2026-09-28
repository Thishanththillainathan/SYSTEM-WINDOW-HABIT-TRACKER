import { query } from './postgres';

export interface LogChangeOptions {
  userId: string;
  actionType: string; // e.g. HABIT_CREATED, HABIT_COMPLETED, TASK_CREATED, PROFILE_UPDATED, XP_UPDATED, SUBSCRIPTION_STARTED
  entityType: string; // e.g. HABIT, TASK, PROFILE, RPG, SUBSCRIPTION
  entityId?: string | null;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logChange(options: LogChangeOptions): Promise<void> {
  try {
    const id = `chg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await query(`
      INSERT INTO change_history (
        id, user_id, action_type, entity_type, entity_id, description, old_value, new_value, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      id,
      options.userId,
      options.actionType,
      options.entityType,
      options.entityId || null,
      options.description,
      options.oldValue || null,
      options.newValue || null,
    ]);
  } catch (err) {
    console.error('Error recording change history:', err);
  }
}
