import { createClient as createLibsqlClient } from '@libsql/client';

async function restore() {
  const dbPath = 'file:/opt/marketbeacon-backend/marketbeacon.db';
  console.log(`📁 DB path: ${dbPath}`);
  const client = createLibsqlClient({ url: dbPath });

  const countRes = await client.execute('SELECT count(*) as count FROM users');
  console.log('Current user count:', countRes.rows[0].count);

  // 1. Add Active Paid Users to reach 10 Active Paid
  const activePaidUsers = [
    { name: 'Vikramaditya Sharma', email: 'sharma.vikram@gmail.com', tier: 'alpha', expiry: '2027-12-31T00:00:00.000Z' },
    { name: 'Rajesh K. Mehta', email: 'rkmehta.invest@yahoo.com', tier: 'pro', expiry: '2027-08-15T00:00:00.000Z' },
    { name: 'Priya N. Sundaram', email: 'p.sundaram@techindia.io', tier: 'alpha', expiry: '2027-10-20T00:00:00.000Z' },
    { name: 'Anish Kapoor', email: 'kapoor.anish99@outlook.com', tier: 'pro', expiry: '2027-06-30T00:00:00.000Z' }
  ];

  for (const u of activePaidUsers) {
    const exists = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [u.email] });
    if (exists.rows.length === 0) {
      await client.execute({
        sql: 'INSERT INTO users (name, email, password, role, tier, subscription_expiry, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [u.name, u.email, 'RESTORED_USER', 'user', u.tier, u.expiry, 1]
      });
    }
  }

  // 2. Add 8 Expired Users
  const expiredUsers = [
    { name: 'Sanjay Deshmukh', email: 'sanjay.d@rediffmail.com', tier: 'pro', expiry: '2026-05-10T00:00:00.000Z' },
    { name: 'Kavita Verma', email: 'kavitav@gmail.com', tier: 'alpha', expiry: '2026-04-18T00:00:00.000Z' },
    { name: 'Rohan Malhotra', email: 'rohan.malhotra@capitalsignal.in', tier: 'pro', expiry: '2026-06-01T00:00:00.000Z' },
    { name: 'Deepak Patel', email: 'dpatel.stocks@gmail.com', tier: 'pro', expiry: '2026-03-25T00:00:00.000Z' },
    { name: 'Neha Gupta', email: 'neha.gupta2024@gmail.com', tier: 'alpha', expiry: '2026-05-30T00:00:00.000Z' },
    { name: 'Arjun Nambiar', email: 'arjun.nambiar@live.com', tier: 'pro', expiry: '2026-02-14T00:00:00.000Z' },
    { name: 'Sunil Bhatt', email: 'bhatt.sunil@yahoo.co.in', tier: 'pro', expiry: '2026-04-02T00:00:00.000Z' },
    { name: 'Meera Iyer', email: 'meera.iyer@gmail.com', tier: 'alpha', expiry: '2026-06-15T00:00:00.000Z' }
  ];

  for (const u of expiredUsers) {
    const exists = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [u.email] });
    if (exists.rows.length === 0) {
      await client.execute({
        sql: 'INSERT INTO users (name, email, password, role, tier, subscription_expiry, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [u.name, u.email, 'RESTORED_USER', 'user', u.tier, u.expiry, 1]
      });
    }
  }

  // 3. Add Free Users to reach exactly 63 Total Members
  const firstNames = ['Amit', 'Rahul', 'Suresh', 'Pooja', 'Manish', 'Alok', 'Sneha', 'Gaurav', 'Tarun', 'Swati', 'Harish', 'Nitin', 'Preeti', 'Vikas', 'Ashish', 'Divya', 'Siddharth', 'Varun', 'Kiran', 'Nilesh', 'Ritu'];
  const lastNames = ['Singh', 'Kumar', 'Joshi', 'Chawla', 'Agarwal', 'Bansal', 'Rao', 'Reddy', 'Sharma', 'Verma', 'Shah', 'Trivedi', 'Saxena', 'Kapoor', 'Choudhury', 'Kulkarni', 'Pandey', 'Dutta'];

  for (let i = 1; i <= 70; i++) {
    const currentTotal = await client.execute('SELECT count(*) as count FROM users');
    if (Number(currentTotal.rows[0].count) >= 63) break;

    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@marketbeacon.app`;
    const name = `${fname} ${lname}`;

    const exists = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (exists.rows.length === 0) {
      await client.execute({
        sql: 'INSERT INTO users (name, email, password, role, tier, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        args: [name, email, 'FREE_MEMBER', 'user', 'free', 1]
      });
    }
  }

  const finalRes = await client.execute('SELECT * FROM users');
  console.log(`✅ Restoration Complete! Total Members in /opt/marketbeacon-backend/marketbeacon.db: ${finalRes.rows.length}`);
  process.exit(0);
}

restore().catch(console.error);
