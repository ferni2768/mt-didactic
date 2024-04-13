import React, { useState, useEffect } from 'react';

function StudentJoin({ setStudent, navigate, classCode }) {
    const [name, setName] = useState('student1');
    const [inputClassCode, setInputClassCode] = useState(classCode);

    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    const handleJoin = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`http://localhost:3001/class/${inputClassCode}/exists`);
            if (response.ok) {
                const data = await response.json();
                setStudent(data);
                localStorage.setItem('loggedInStudentClassCode', inputClassCode);
                navigate(`/student/${inputClassCode}`);
            } else {
                alert('Class code does not exist');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while joining');
        }
    };

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
                        value={inputClassCode}
                        onChange={(e) => setInputClassCode(e.target.value)}
                    />
                </label>
                <br /> <br />
                <button type="submit">Join</button>
            </form>
        </div>
    );
}

export default StudentJoin;
