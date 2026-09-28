import { query, pool, initPostgresDb } from './postgres';

export { query, pool, initPostgresDb as initDb };
export const db = { query, pool };
