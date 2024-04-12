const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // Import the cors middleware

const app = express();
const port = 3001;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tfg_db'
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1); // Exit the process if unable to connect
    }
    console.log('Connected to MySQL database');
});

// Enable CORS for all routes
app.use(cors());

// API endpoint to fetch list of students
app.get('/student', (req, res) => {
    const query = 'SELECT * FROM student';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(result);
        }
    });
});

// Close MySQL connection when Node.js process exits
process.on('SIGINT', () => {
    db.end(err => {
        if (err) {
            console.error('Error closing MySQL connection:', err);
            process.exit(1);
        }
        console.log('MySQL connection closed');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
