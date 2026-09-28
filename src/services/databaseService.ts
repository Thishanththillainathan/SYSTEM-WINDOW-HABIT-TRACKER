import { PersonalDatabaseData, ChangeHistoryRecord, ChangeHistoryMonthlyStats } from '../types';

export interface ChangeHistoryResponse {
  logs: ChangeHistoryRecord[];
  totalCount: number;
  activeMonth: string;
  monthlyStats: ChangeHistoryMonthlyStats;
}

export async function fetchPersonalDatabase(): Promise<PersonalDatabaseData | null> {
  try {
    const res = await fetch('/api/user/personal-database');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching personal database:', err);
    return null;
  }
}

export async function fetchChangeHistory(params?: {
  month?: string;
  date?: string;
  actionType?: string;
  entityType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ChangeHistoryResponse | null> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.set('month', params.month);
    if (params?.date) queryParams.set('date', params.date);
    if (params?.actionType) queryParams.set('actionType', params.actionType);
    if (params?.entityType) queryParams.set('entityType', params.entityType);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));

    const res = await fetch(`/api/user/change-history?${queryParams.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching change history:', err);
    return null;
  }
}

export async function recordUserChange(options: {
  actionType: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/user/record-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.ok;
  } catch (err) {
    console.error('Error recording user change:', err);
    return false;
  }
}

export async function fetchUserActivityLogs(): Promise<Array<{
  id: string;
  userId: string;
  action: string;
  summary: string;
  detailsJson?: string;
  createdAt: string;
}> | null> {
  try {
    const res = await fetch('/api/user/user-activity-logs');
    if (!res.ok) return null;
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('Error fetching user activity logs:', err);
    return null;
  }
}

export const databaseService = {
  fetchPersonalDatabase,
  fetchChangeHistory,
  fetchUserActivityLogs,
  recordUserChange,
};

