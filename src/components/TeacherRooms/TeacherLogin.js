import React, { useState, useEffect } from 'react';

function TeacherLogin({ navigate, classCode }) {
    const [password, setPassword] = useState('password');
    const [inputClassCode, setInputClassCode] = useState(classCode);

    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    const handleCreateClass = async (event) => {
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
                sessionStorage.setItem('isAuthenticated', true);
                sessionStorage.setItem('createdClassCode', classCode);
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
            <form onSubmit={handleCreateClass}>
                <label>
                    Class Code:
                    <input
                        type="text"
                        value={inputClassCode}
                        onChange={(e) => setInputClassCode(e.target.value)}
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
