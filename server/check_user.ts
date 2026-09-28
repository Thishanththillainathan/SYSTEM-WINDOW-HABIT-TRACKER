import { query } from './postgres';

async function checkUser() {
  const email = '25ee005@skcet.ac.in';
  const res = await query('SELECT id, email, status, role FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  console.log('Rows found:', res.rows);
  const delRes = await query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  console.log('Deleted count:', delRes.rowCount);
  const checkAfter = await query('SELECT id, email, status FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  console.log('Rows after delete:', checkAfter.rows);
}

checkUser().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
