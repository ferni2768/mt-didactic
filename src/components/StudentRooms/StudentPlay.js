import React, { useState, useEffect } from 'react';
import PlayWordSelector from './playComponents/playWordSelector';

function StudentPlay({ navigate, classCode }) {
    const [student, setStudent] = useState({});


    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        setStudent(loggedInStudent);
    }, []);


    const updateScore = async (score) => {
        // Multiply the percetage score by 100 to get the actual score
        const updatedScore = score * 100;
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: updatedScore }) // Updated score to database
            });
            sessionStorage.setItem('loggedInScore', updatedScore); // Updated score to session storage
            navigate(`/student/${classCode}/results`);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const setProgress = async (progress) => {
        try {
            await fetch(`http://localhost:3001/student/${student.id}/setProgress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ progress: progress }) // Updated progress to database
            });


        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

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
            <h1>Student View</h1>
            <p>This is the student view page.</p>
            <div>
                <h2>My Details:</h2>
                <div>ID: {student.id}</div>
                <div>Name: {student.name}</div>
                <div>Score: 0</div>
                <br />
                {student.score !== 1000 && (
                    <button onClick={updateScore}>Update Score</button>
                )}
                {student.score === 1000 && (
                    <p>Score Updated</p>
                )}
                <button onClick={handleReset}>Reset</button>
                <br /> <br />
                <PlayWordSelector updateScore={updateScore} setProgress={setProgress} />
            </div>
        </div>
    );
}

export default StudentPlay;
