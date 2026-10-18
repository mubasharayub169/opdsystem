// ============================================================
// Admin User Create Script
// Run: node scripts/create-admin.js
// ============================================================

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  CREATE ADMIN USER');
  console.log('═══════════════════════════════════════');
  console.log('');

  const name     = await ask('Admin Name     : ');
  const username = await ask('Username       : ');
  const password = await ask('Password       : ');

  rl.close();

  console.log('');
  console.log('⏳ Creating admin...');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const hash = await bcrypt.hash(password, 10);

  await conn.query(
    `INSERT INTO admins (name, username, password_hash) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       name = VALUES(name),
       password_hash = VALUES(password_hash)`,
    [name, username, hash]
  );

  await conn.end();

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  ✅ ADMIN CREATED SUCCESSFULLY');
  console.log('═══════════════════════════════════════');
  console.log(`  Name     : ${name}`);
  console.log(`  Username : ${username}`);
  console.log(`  Password : ${password}`);
  console.log('═══════════════════════════════════════');
  console.log('');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});