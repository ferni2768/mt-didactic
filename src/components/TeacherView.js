import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TeacherView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();
    const [classCode, setClassCode] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
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

        const loggedInClassCode = localStorage.getItem('loggedInClassCode');
        if (loggedInClassCode) {
            setClassCode(loggedInClassCode);
            setIsAuthenticated(true);
            // If the teacher is logged in, the URL includes the class code
            if (urlClassCode !== loggedInClassCode) {
                navigate(`/teacher/${loggedInClassCode}`);
            }
        }

        if (urlClassCode) {
            setClassCode(urlClassCode);
        }

        // Fetch students initially
        fetchStudents();

        // Fetch students every 3 seconds
        const intervalId = setInterval(fetchStudents, 3000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [urlClassCode, navigate]); // Run effect only once on component mount

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/teacher/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: classCode, password }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
                // Store the class code in local storage
                localStorage.setItem('loggedInClassCode', classCode);
                // Update the URL to include the class code
                navigate(`/teacher/${classCode}`);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Invalid class code or password');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while logging in');
        }
    };

    const handleLogout = () => {
        // Clear the class code from local storage
        localStorage.removeItem('loggedInClassCode');
        // Redirect to the login page
        navigate('/teacher');
        window.location.reload(); // Reload the page to reset the state
    };

    if (!isAuthenticated) {
        return (
            <div>
                <h1>Teacher Login</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        Class Code:
                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                        />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    <br /> <br />
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }

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

export default TeacherView;
