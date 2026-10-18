import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const password = 'doctor123';
  const hash = await bcrypt.hash(password, 10);

  // Set password for all 3 doctors
  const doctors = ['ahmed', 'sana', 'bilal'];

  for (const username of doctors) {
    await conn.query(
      'UPDATE consultants SET password_hash = ? WHERE username = ?',
      [hash, username]
    );
    console.log(`✅ Password "${password}" set for doctor '${username}'`);
  }

  await conn.end();
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log('  Doctor Login Credentials');
  console.log('════════════════════════════════════════════');
  console.log('  ahmed  / doctor123');
  console.log('  sana   / doctor123');
  console.log('  bilal  / doctor123');
  console.log('════════════════════════════════════════════');
}

main().catch(console.error);