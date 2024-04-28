const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser');

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

// Parse URL-encoded bodies
app.use(bodyParser.json());


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

// API endpoint to check the class phase
app.get('/class/:code/phase', (req, res) => {
    const classCode = req.params.code;
    const query = 'SELECT phase FROM class WHERE code = ?';
    db.query(query, [classCode], (err, result) => {
        if (err) {
            console.error('Error checking class phase:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length === 1) {
                res.json({ phase: result[0].phase });
            } else {
                res.status(404).json({ error: 'Class code does not exist' });
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

app.post('/class/:code/join', async (req, res) => {
    try {
        const classCode = req.params.code;
        const { name } = req.body;

        // Wrap the query in a Promise
        const query = (sql, args) => {
            return new Promise((resolve, reject) => {
                db.query(sql, args, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        };

        // Check if class exists
        const classResult = await query('SELECT * FROM class WHERE code = ?', [classCode]);
        if (classResult.length === 0) {
            return res.status(404).json({ error: 'Class code does not exist' });
        }

        // Check if student already exists in the class
        const studentResult = await query('SELECT * FROM student WHERE name = ? AND class_code = ?', [name, classCode]);
        if (studentResult.length > 0) {
            return res.status(400).json({ error: 'Student with that name already exists in the class' });
        }

        // Create a new model with an encoded date and hour of creation
        const dateTime = new Date().toISOString().replace(/[:-]/g, '').split('.')[0]; // Get current date and time in YYYYMMDDTHHMMSS format
        const model = `${name}_${classCode}_${dateTime}`;

        // Create a new model in the external API
        try {
            const modelResponse = await fetch(`http://localhost:5000/models/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!modelResponse.ok) {
                throw new Error(`Failed to create model: ${modelResponse.statusText}`);
            }

            // If the model creation is successful, proceed with the rest of the function
        } catch (modelError) {
            console.error('Error creating model:', modelError);
            return res.status(500).json({ error: 'Failed to create model' });
        }

        const insertResult = await query('INSERT INTO student (name, class_code, score, progress, model) VALUES (?, ?, 0, 0, ?)', [name, classCode, model]);

        // Check if the insert was successful
        if (insertResult.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to create student' });
        }

        // Retrieve the newly created student's data
        const newStudentId = insertResult.insertId;
        const newStudentResult = await query('SELECT * FROM student WHERE id = ?', [newStudentId]);

        // Check if the student was successfully retrieved
        if (newStudentResult.length === 0) {
            return res.status(500).json({ error: 'Failed to retrieve newly created student' });
        }

        // Send the newly created student's data
        res.json(newStudentResult[0]);
    } catch (error) {
        console.error('Error in /class/:code/join:', error);
        // A response is sent in case of an error
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to set the class phase
app.put('/class/:code/setPhase', (req, res) => {
    const classCode = req.params.code;
    const phase = req.body.phase;

    const query = 'UPDATE class SET phase = ? WHERE code = ?';
    db.query(query, [phase, classCode], (err, result) => {
        if (err) {
            console.error('Error setting class phase:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json({ message: 'Phase updated successfully' });
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
