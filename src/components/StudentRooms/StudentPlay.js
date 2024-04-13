import React from 'react';

function StudentPlay({ student, setStudent, navigate }) {
    const updateScore = async () => {
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: 1000 })
            });
            setStudent(prevStudent => ({ ...prevStudent, score: 1000 }));
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const handleReset = () => {
        localStorage.removeItem('loggedInStudentClassCode');
        setStudent(null);
        navigate('/student');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <h1>Student View</h1>
            <p>This is the student view page.</p>
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
                <button onClick={handleReset}>Reset</button>
            </div>
        </div>
    );
}

export default StudentPlay;
