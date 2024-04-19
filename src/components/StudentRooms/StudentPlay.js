import React, { useState, useEffect } from 'react';
import PlayWordSelector from './playComponents/playWordSelector';

function StudentPlay({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        setStudent(loggedInStudent);

        const checkClassPhase = async () => {
            try {
                const response = await fetch(`http://localhost:3001/class/${classCode}/phase`);
                if (response.ok) {
                    const data = await response.json();
                    setClassPhase(data.phase);
                } else {
                    console.error('Error fetching class phase:', response.statusText);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        // Initial check
        checkClassPhase();

        // Set up an interval to check the class phase every second
        const intervalId = setInterval(checkClassPhase, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [classCode]);

    const updateScore = async (score) => {
        // Multiply the percentage score by 100 to get the actual score
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

    if (classPhase === 2) {
        return <div>The class already finished</div>;
    }

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
                <button onClick={handleReset}>Reset</button>
                <br /> <br />
                <PlayWordSelector updateScore={updateScore} setProgress={setProgress} />
            </div>
        </div>
    );
}

export default StudentPlay;
