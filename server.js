const fetch = require('cross-fetch');
const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // To hash the password

require('dotenv').config();
const { API_URL, BASE_PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./src/config');

const app = express();

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});

// Get a hashed password
// bcrypt.hash('password', 10, function (err, hash) { console.log(hash); });

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
app.use(bodyParser.urlencoded({ extended: true }));


// Log function
const log = (message) => {
    const query = 'INSERT INTO app_logs (message) VALUES (?)';
    db.query(query, [message], (err) => {
        if (err) {
            console.error('Error logging message:', err);
        }
    });
};

app.get('/', (req, res) => {
    res.send('Welcome to the API root');
});


// API endpoint for teacher authentication
app.post('/teacher/authenticate', (req, res) => {
    const { code, password } = req.body;
    const query = 'SELECT * FROM class WHERE code = ?';
    db.query(query, [code], (err, result) => {
        if (err) {
            console.error('Error authenticating teacher:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (result.length === 1) {
                const storedHash = result[0].password;
                bcrypt.compare(password, storedHash, function (err, isMatch) {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        res.status(500).json({ error: 'Internal server error' });
                    } else if (isMatch) {
                        res.status(200).json({ message: 'Authentication successful' });
                        log(`Teacher in ${code} authenticated`);
                    } else {
                        res.status(401).json({ error: 'Invalid credentials' });
                    }
                });
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

// API endpoint to fetch list of students from a specific class
app.get('/students', (req, res) => {
    const classCode = req.query.classCode;
    const query = `SELECT * FROM student WHERE class_code = ?`;
    db.query(query, [classCode], (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.header('Content-Type', 'application/json', 'ngrok-skip-browser-warning'); // Ensure Content-Type header is set
            res.json(result); // Return the result as JSON
        }
    });
});

// API endpoint to fetch list of common errors for a specific class
app.get('/common-errors', (req, res) => {
    // Extract classCode from query parameters
    const classCode = req.query.classCode;

    // Query to get errors sorted by counter in descending order
    const query = `SELECT word, counter FROM errors WHERE class_code = ? ORDER BY counter DESC LIMIT 10`;

    db.query(query, [classCode], (err, result) => {
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

// API endpoint to start a new class
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
            const modelResponse = await fetch(`${API_URL}/models/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'any-value-you-want'
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

        log(`Student ${name} joined class ${classCode} with model ${model}`)

        // Send the newly created student's data
        res.json(newStudentResult[0]);
    } catch (error) {
        console.error('Error in /class/:code/join:', error);
        // A response is sent in case of an error
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to update the errors in the database
app.post('/update-errors', (req, res) => {
    const { mistakes, classCode } = req.body;

    // Combined SQL query to insert or update based on existence
    const combinedQuery = 'INSERT INTO errors (word, counter, class_code) VALUES (?,?,?) ON DUPLICATE KEY UPDATE counter = counter + 1';

    // Use Promise.all to wait for all database operations to complete
    Promise.all(mistakes.map(([word]) =>
        new Promise((resolve, reject) => {
            db.query(combinedQuery, [word, 1, classCode], (error, results) => {
                if (error) {
                    console.error('Error processing mistake:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        })
    )).then(() => {
        // All operations were successful, send success response
        res.status(200).json({ message: 'Errors updated successfully' });
    }).catch((error) => {
        // An error occurred, send error response
        console.error('Failed to update errors:', error);
        res.status(500).json({ error: 'Failed to update errors' });
    });
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
            log(`Student (id: ${studentId}) score updated to ${newScore}%`);
        }
    });
});

// API endpoint to fetch model matrix
app.post('/models/:modelName/matrix', async (req, res) => {
    const modelName = req.params.modelName;
    try {
        const response = await fetch(`${API_URL}/models/${modelName}/matrix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'any-value-you-want'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // Normalize the matrix to percentages and round to integers
        const normalizeMatrix = (matrix) => {
            const total = matrix.flat().reduce((acc, val) => acc + val, 0);
            let roundedMatrix = matrix.map(row => row.map(val => Math.round((val / total) * 100)));

            // Adjust values to ensure sum is exactly 100
            let sum = roundedMatrix.flat().reduce((acc, val) => acc + val, 0);
            let diff = 100 - sum;
            if (diff !== 0) {
                // Find the index of the largest value in the matrix
                let maxIndex = roundedMatrix.flat().reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
                // Adjust the largest value by the difference to ensure sum is 100
                roundedMatrix.flat()[maxIndex] += diff;
            }

            return roundedMatrix;
        };

        const processedMatrix = normalizeMatrix(data);
        res.json(processedMatrix); // Return the processed data to the frontend
    } catch (error) {
        console.error('Failed to fetch and process model matrix:', error);
        res.status(500).json({ error: 'Failed to fetch and process model matrix' });
    }
});

// API endpoint to test models
app.post('/models/test', async (req, res) => {
    const { model_names } = req.body;
    try {
        const response = await fetch(`${API_URL}/models/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'bypass-tunnel-reminder': 'any-value-you-want'
            },
            body: JSON.stringify({ model_names: model_names }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // Process the data to calculate accuracy and loss as percentages
        const processedData = data.map((modelResult) => ({
            model: modelResult.model,
            accuracy: modelResult.metrics.compile_metrics * 100,
            loss: modelResult.metrics.loss * 100,
        }));

        res.json(processedData); // Return the processed data to the frontend
    } catch (error) {
        console.error('Failed to fetch and process model evaluation results:', error);
        res.status(500).json({ error: 'Failed to fetch and process model evaluation results' });
    }
});

// API endpoint to train models
app.post('/models/:modelName/train', async (req, res) => {
    const modelName = req.params.modelName;
    const { answers, maxIterations } = req.body;
    try {
        const url = `${API_URL}/models/${modelName}/train`;
        const config = { method: 'post', body: JSON.stringify(answers), headers: { 'Content-Type': 'application/json' } };

        // Initialize variables to hold the result of the last iteration and count of failed iterations
        let lastResult = [];
        let failedIterationsCount = 0;

        // Loop through the training based on maxIterations from the request body
        for (let i = 0; i < maxIterations; i++) {
            try {
                const response = await fetch(url, config);

                if (!response.ok) {
                    throw new Error(`HTTP error Status: ${response.status}`);
                }
                const data = await response.json();

                // Transform the data to the desired format
                const transformedData = data.map(item => [item[1], item[2]]);

                lastResult = transformedData;
            } catch (error) {
                console.error(`Iteration ${i + 1} failed:`, error);
                failedIterationsCount++;

                // Check if the number of failed iterations has reached or exceeded half of maxIterations
                if (failedIterationsCount >= Math.ceil(maxIterations / 2)) {
                    throw new Error('More than half of the iterations have failed');
                }
            }
        }

        log(`Model ${modelName} was trained`);

        // Response
        res.json(lastResult);
    } catch (error) {
        console.error('Failed to fetch and process model training results:', error);
        res.status(500).json({ error: 'Failed to fetch and process model training results' });
    }
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
            log(`Student (id: ${studentId}) is now ${progress}% done in class`);
        }
    });
});

// API endpoint to restart a class
app.put('/class/:code/restart', async (req, res) => {
    const classCode = req.params.code;
    const newClassCode = `${classCode}_deleted`;

    try {
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Disable foreign key checks
        await new Promise((resolve, reject) => {
            db.query('SET FOREIGN_KEY_CHECKS = 0', (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Update the class phase to 0
        await new Promise((resolve, reject) => {
            const query = 'UPDATE class SET phase = 0 WHERE code = ?';
            db.query(query, [classCode], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (result.affectedRows === 0) {
                        reject(new Error('No class found with the provided code'));
                    } else {
                        resolve(result);
                    }
                }
            });
        });

        // Update the class_code of all students in the class
        await new Promise((resolve, reject) => {
            const query = 'UPDATE student SET class_code = ? WHERE class_code = ?';
            db.query(query, [newClassCode, classCode], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Aggregate errors for the class and move them to CLASSCODE_deleted
        await new Promise((resolve, reject) => {
            const aggregateQuery = `
                INSERT INTO errors (word, counter, class_code)
                SELECT word, SUM(counter),?
                FROM errors
                WHERE class_code = ?
                GROUP BY word
                ON DUPLICATE KEY UPDATE counter = counter + VALUES(counter)
            `;
            db.query(aggregateQuery, [newClassCode, classCode], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Delete original errors for the class
        await new Promise((resolve, reject) => {
            const deleteQuery = 'DELETE FROM errors WHERE class_code = ?';
            db.query(deleteQuery, [classCode], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Re-enable foreign key checks
        await new Promise((resolve, reject) => {
            db.query('SET FOREIGN_KEY_CHECKS = 1', (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        await new Promise((resolve, reject) => {
            db.commit(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const deleteClassUrl = `${API_URL}/class/${classCode}/delete`;
        try {
            const deleteClassResponse = await fetch(deleteClassUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'any-value-you-want'
                },
            });

            if (!deleteClassResponse.ok) {
                throw new Error(`Failed to delete class: ${deleteClassResponse.statusText}`);
            }

        } catch (error) {
            console.error('Error deleting class:', error);
        }

        res.status(200).json({ message: 'Class restarted successfully' });
        log(`Class ${classCode} was restarted by the teacher`);
    } catch (error) {
        await new Promise((resolve, reject) => {
            db.rollback(() => {
                resolve();
            });
        });

        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
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

app.listen(3001, '0.0.0.0', () => {
    console.log('Server listening on port 3001');
});