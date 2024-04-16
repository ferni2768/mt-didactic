import React, { useState, useEffect } from 'react';

function StudentResults({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [score, setScore] = useState();

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        const loggedInScore = JSON.parse(sessionStorage.getItem('loggedInScore'));
        setStudent(loggedInStudent);
        setScore(loggedInScore);
    }, []);

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('loggedInClassCode');
        sessionStorage.removeItem('loggedInStudent');
        sessionStorage.removeItem('loggedInScore');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <h1>Student Results</h1>
            <p>ID: {student.id}</p>
            <p>Name: {student.name}</p>
            <p>Score: {score}</p>
            <button onClick={handleReset}>Reset</button>
        </div>
    );
}

export default StudentResults;
