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

// Parse JSON requests
app.use(express.json());

// API endpoint for teacher authentication
app.post('/teacher/authenticate', (req, res) => {
    const { code, password } = req.body;
    const query = 'SELECT * FROM class WHERE code = ? AND password = ?';
    db.query(query, [code, password], (err, result) => {
        if (err) {
            console.error('Error authenticating teacher:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length === 1) {
                res.status(200).json({ message: 'Authentication successful' });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }
    });
});

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

// API endpoint to fetch a specific student by ID
app.get('/student/:id', (req, res) => {
    const studentId = req.params.id || 1; // Set default student ID to 1 if no ID is provided
    const query = 'SELECT * FROM student WHERE id = ?';
    db.query(query, [studentId], (err, result) => {
        if (err) {
            console.error('Error fetching student:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length === 0) {
                res.status(404).json({ error: 'Student not found' });
            } else {
                res.json(result[0]);
            }
        }
    });
});

// API endpoint to check if a class exists
app.get('/class/:code/exists', (req, res) => {
    const classCode = req.params.code;
    const query = 'SELECT * FROM class WHERE code = ?';
    db.query(query, [classCode], (err, result) => {
        if (err) {
            console.error('Error checking class existence:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length === 1) {
                // For simplicity, return a dummy student object
                res.json({ id: 1, name: 'student1' });
            } else {
                res.status(404).json({ error: 'Class code does not exist' });
            }
        }
    });
});

// API endpoint to update a student's score
app.put('/student/:id/updateScore', (req, res) => {
    const studentId = req.params.id;
    const newScore = req.body.score;

    const query = 'UPDATE student SET score = ? WHERE id = ?';
    db.query(query, [newScore, studentId], (err, result) => {
        if (err) {
            console.error('Error updating student score:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json({ message: 'Score updated successfully' });
        }
    });
});

// API endpoint to update a student's progress
app.put('/student/:id/setProgress', (req, res) => {
    const studentId = req.params.id;
    const progress = req.body.progress;

    const query = 'UPDATE student SET progress = ? WHERE id = ?';
    db.query(query, [progress, studentId], (err, result) => {
        if (err) {
            console.error('Error updating student progress:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json({ message: 'Progress updated successfully' });
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
