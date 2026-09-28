import { query } from './postgres';

async function listUsers() {
  const res = await query('SELECT id, email, status, role FROM users');
  console.log('Total users in Neon PostgreSQL:', res.rows.length);
  console.log('Users list:', res.rows);
}

listUsers().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
