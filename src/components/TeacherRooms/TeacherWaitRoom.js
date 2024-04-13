import React, { useState, useEffect } from 'react';

function TeacherWaitRoom({ classCode, setIsAuthenticated, navigate }) {
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
        localStorage.removeItem('loggedInClassCode');
        navigate('/teacher');
        window.location.reload();
    };

    return (
        <div>
            <h1>Teacher View</h1>
            <p>This is the teacher view page.</p>
            <h2>List of Students:</h2>
            <ul>
                {students.map(student => (
                    <li key={student.id}>
                        ID: {student.ID} ||
                        name: {student.name} ||
                        score: {student.score}
                    </li>
                ))}
            </ul>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default TeacherWaitRoom;
