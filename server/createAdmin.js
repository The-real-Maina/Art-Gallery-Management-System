
require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  let db;

  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n===== ARTISAN GALLERY ADMIN SETUP =====\n');

    const fullName = await ask('Administrator full name: ');
    const email = await ask('Administrator email: ');
    const password = await ask('Administrator password: ');

    if (!fullName.trim() || !email.trim() || password.length < 8) {
      console.log('\nInvalid details. Password must be at least 8 characters.');
      return;
    }

    const [roles] = await db.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['Administrator']
    );

    if (roles.length === 0) {
      console.log('\nAdministrator role not found.');
      return;
    }

    const [existingUsers] = await db.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      console.log('\nAn account with this email already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users (full_name, email, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [
        fullName.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        roles[0].role_id
      ]
    );

    console.log('\nAdministrator account created successfully!');
    console.log('Email:', email.trim().toLowerCase());
    console.log('Role: Administrator');

  } catch (error) {
    console.error('\nSetup failed:', error.message);
  } finally {
    rl.close();

    if (db) {
      await db.end();
    }
  }
}

createAdmin();
