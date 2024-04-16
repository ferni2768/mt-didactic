import React, { useState, useEffect } from 'react';

function TeacherResults({ navigate, classCode }) {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('http://localhost:3001/student');
                const data = await response.json();
                // Sort students by score in descending order
                const sortedStudents = data.sort((a, b) => b.score - a.score);
                setStudents(sortedStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, []);

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('createdClassCode');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isFinished');
        navigate('/teacher/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <h1>Results</h1>
            <h2>List of Students Sorted by Score:</h2>
            <ul>
                {students.map(student => (
                    <li key={student.id}>
                        ID: {student.id} ||
                        Name: {student.name} ||
                        Score: {student.score}
                    </li>
                ))}
            </ul>
            <button onClick={handleReset}>Reset</button>
        </div>
    );
}

export default TeacherResults;
