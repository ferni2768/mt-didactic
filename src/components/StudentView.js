import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function StudentView() {
    const [student, setStudent] = useState(null);
    const { studentId = 1 } = useParams(); // Default student ID is 1 if not provided in the URL

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await fetch(`http://localhost:3001/student/${studentId}`);
                const data = await response.json();
                setStudent(data);
            } catch (error) {
                console.error('Error fetching student:', error);
            }
        };

        // Fetch student details initially
        fetchStudent();
    }, [studentId]); // Fetch student details whenever the student ID changes

    const updateScore = async () => {
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: 1000 })
            });
            // Update the state to reflect the change in score
            setStudent(prevStudent => ({ ...prevStudent, score: 1000 }));
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    return (
        <div>
            <h1>Student View</h1>
            <p>This is the student view page.</p>
            {student && (
                <div>
                    <h2>My Details:</h2>
                    <p>ID: {student.id}</p>
                    <p>Name: {student.name}</p>
                    <p>Score: {student.score}</p>
                    {student.score !== 1000 && (
                        <button onClick={updateScore}>Update Score</button>
                    )}
                    {student.score === 1000 && (
                        <p>Score Updated</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentView;
