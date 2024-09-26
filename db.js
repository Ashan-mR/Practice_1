const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Specify the path to the SQLite database file (e.g., './database/employee.db')
const dbPath = path.resolve(__dirname, 'database', 'employee.db');
console.log(dbPath);

// Initialize the database connection to a file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create Employee and EmployeeContact tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Employee (
            id TEXT PRIMARY KEY,
            firstname TEXT NOT NULL,
            lastname TEXT NOT NULL,
            dob TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS EmployeeContact (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId TEXT NOT NULL,
            phoneNumbers TEXT NOT NULL,
            addresses TEXT NOT NULL,
            FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE
        )
    `);
});

module.exports = db;
