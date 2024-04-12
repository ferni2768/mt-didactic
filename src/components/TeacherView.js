import React, { useState, useEffect } from 'react';

function TeacherView() {
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

        // Fetch students initially
        fetchStudents();

        // Fetch students every 3 seconds
        const intervalId = setInterval(fetchStudents, 3000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // Run effect only once on component mount

    return (
        <div>
            <h1>Teacher View</h1>
            <p>This is the teacher view page.</p>
            <h2>List of Students:</h2>
            <ul>
                {students.map(student => (
                    <li key={student.id}>{student.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default TeacherView;
