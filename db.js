import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
    filename: './pingmate.db',
    driver: sqlite3.Database
});

export async function initDB() {
    const db = await dbPromise;
    await db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      url TEXT,
      UNIQUE(user_id, url)
    );
  `);
}

export async function addURL(userId, name, url) {
    const db = await dbPromise;
    await db.run(`INSERT OR IGNORE INTO urls (user_id, name, url) VALUES (?, ?, ?)`, [userId, name, url]);
}

export async function removeURL(userId, url) {
    const db = await dbPromise;
    await db.run(`DELETE FROM urls WHERE user_id = ? AND url = ?`, [userId, url]);
}

export async function getUserURLs(userId) {
    const db = await dbPromise;
    return await db.all(`SELECT name, url FROM urls WHERE user_id = ?`, [userId]);
}

export async function getAllURLs() {
    const db = await dbPromise;
    return await db.all(`SELECT DISTINCT user_id, name, url FROM urls`);
}
