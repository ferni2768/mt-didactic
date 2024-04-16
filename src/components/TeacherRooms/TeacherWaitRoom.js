import React, { useState, useEffect } from 'react';

function TeacherWaitRoom({ navigate, classCode }) {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('http://localhost:3001/student');
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents(); // Fetch students initially
        const intervalId = setInterval(fetchStudents, 3000); // Reload students every 3 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleLogout = () => {
        // Reset the session
        sessionStorage.removeItem('createdClassCode');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isFinished');
        navigate('/teacher/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    const seeResults = () => {
        sessionStorage.setItem('isFinished', true);
        navigate(`/teacher/${classCode}/results`);
    };

    return (
        <div>
            <h1>Teacher View</h1>
            <p>This is the teacher view page.</p>
            <h2>List of Students:</h2>
            <ul>
                {students.map(student => (
                    <li key={student.id}>
                        ID: {student.id} ||
                        name: {student.name}
                    </li>
                ))}
            </ul>
            <button onClick={handleLogout}>Reset</button>
            <button onClick={seeResults}>See Results</button>
        </div>
    );
}

export default TeacherWaitRoom;
