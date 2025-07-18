// db.js
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
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_check DATETIME,
      status TEXT DEFAULT 'unknown',
      response_time INTEGER DEFAULT 0,
      UNIQUE(user_id, url)
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      language TEXT DEFAULT 'en'
    );
  `);
}

export async function addURL(userId, name, url) {
    const db = await dbPromise;
    await db.run(`INSERT OR IGNORE INTO urls (user_id, name, url) VALUES (?, ?, ?)`, [userId, name, url]);
}

export async function removeURL(userId, name) {
    const db = await dbPromise;
    await db.run(`DELETE FROM urls WHERE user_id = ? AND name = ?`, [userId, name]);
}

export async function getUserURLs(userId) {
    const db = await dbPromise;
    return await db.all(`SELECT name, url, status, response_time, last_check, active FROM urls WHERE user_id = ?`, [userId]);
}

export async function getAllURLs() {
    const db = await dbPromise;
    return await db.all(`SELECT DISTINCT user_id, name, url FROM urls WHERE active = 1`);
}

export async function updateURLStatus(url, status, responseTime = 0) {
    const db = await dbPromise;
    await db.run(`UPDATE urls SET status = ?, response_time = ?, last_check = CURRENT_TIMESTAMP WHERE url = ?`, [status, responseTime, url]);
}

export async function getUserStats(userId) {
    const db = await dbPromise;
    return await db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up,
            SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down,
            AVG(response_time) as avg_response_time
        FROM urls WHERE user_id = ? AND active = 1
    `, [userId]);
}

export async function setUserLanguage(userId, language) {
    const db = await dbPromise;
    await db.run(`INSERT OR REPLACE INTO user_settings (user_id, language) VALUES (?, ?)`, [userId, language]);
}

export async function getUserLanguage(userId) {
    const db = await dbPromise;
    const result = await db.get(`SELECT language FROM user_settings WHERE user_id = ?`, [userId]);
    return result?.language || 'en';
}

export async function toggleURLActive(userId, name) {
    const db = await dbPromise;
    await db.run(`UPDATE urls SET active = NOT active WHERE user_id = ? AND name = ?`, [userId, name]);
}