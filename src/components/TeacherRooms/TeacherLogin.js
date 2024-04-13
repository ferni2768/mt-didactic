import React, { useState } from 'react';

function TeacherLogin({ setIsAuthenticated, navigate, classCode, setClassCode }) {
    const [password, setPassword] = useState('');

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

export default TeacherLogin;
