import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function StudentView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();
    const [classCode, setClassCode] = useState('');
    const [name, setName] = useState('student1');
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const loggedInClassCode = localStorage.getItem('loggedInStudentClassCode');
        if (loggedInClassCode) {
            setClassCode(loggedInClassCode);
            // For simplicity, return a dummy student object
            setStudent({ id: 1, name: 'student1', score: 0 });
            navigate(`/student/${loggedInClassCode}`);
        }

        if (urlClassCode) {
            setClassCode(urlClassCode);
        }
    }, [urlClassCode, navigate]);

    const handleJoin = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`http://localhost:3001/class/${classCode}/exists`);
            if (response.ok) {
                const data = await response.json();
                setStudent(data);
                localStorage.setItem('loggedInStudentClassCode', classCode);
                navigate(`/student/${classCode}`);
            } else {
                alert('Class code does not exist');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while joining');
        }
    };

    const handleReset = () => {
        localStorage.removeItem('loggedInStudentClassCode');
        setStudent(null);
        navigate('/student');
        window.location.reload(); // Reload the page to reset the state
    };

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

    if (!student) {
        return (
            <div>
                <h1>Student Join</h1>
                <form onSubmit={handleJoin}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <br />
                    <label>
                        Class Code:
                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                        />
                    </label>
                    <br /> <br />
                    <button type="submit">Join</button>
                </form>
            </div>
        );
    }

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

export default StudentView;
