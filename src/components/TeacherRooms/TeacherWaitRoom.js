import React, { useState, useEffect, useContext } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';

function TeacherWaitRoom({ navigate, classCode }) {
    const [students, setStudents] = useState([]);
    const { isTransitioning } = useContext(TransitionContext);

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

    const seeResults = async () => {
        try {
            // Set the class phase to 2
            const response = await fetch(`http://localhost:3001/class/${classCode}/setPhase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phase: 2 }),
            });

            if (response.ok) {
                sessionStorage.setItem('isFinished', true);
                navigate(`/teacher/${classCode}/results`);
            } else {
                console.error('Error setting class phase:', response.statusText);
                alert('Error occurred while setting class phase');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while setting class phase');
        }
    };

    // Calculate the number of students with progress of 100%
    const completedStudents = students.filter(student => student.progress === 100).length;
    const totalStudents = students.length;


    return (
        <div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className="col-span-full md:col-span-1 lg:col-span-3">
                    <div className={`inside-card ${isTransitioning ? 'entering' : ''}`}>
                        <div>
                            <h1>List of Students:</h1>
                            <p>{completedStudents}/{totalStudents} students have completed the class</p>
                            <ul>
                                {students.map(student => (
                                    <li key={student.id}>
                                        ID: {student.id} ||
                                        name: {student.name} ||
                                        progress: {student.progress}%
                                    </li>
                                ))}
                            </ul>
                            <br />
                            <button onClick={handleLogout}>Reset</button>
                            <button onClick={seeResults}>See Results</button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default TeacherWaitRoom;
