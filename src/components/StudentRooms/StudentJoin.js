import React, { useState, useEffect } from 'react';

function StudentJoin({ navigate, classCode }) {
    const [name, setName] = useState('student1');
    const [inputClassCode, setInputClassCode] = useState(classCode);
    const [wantsToJoin, setWantsToJoin] = useState(false);


    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    useEffect(() => {
        if (wantsToJoin) {
            const intervalId = setInterval(async () => {
                try {
                    const response = await fetch(`http://localhost:3001/class/${inputClassCode}/phase`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.phase === 1) {
                            clearInterval(intervalId); // Clear the interval when the phase is 1
                            sessionStorage.setItem('loggedInClassCode', inputClassCode);
                            navigate(`/student/${inputClassCode}`);
                        }
                    } else {
                        clearInterval(intervalId); // Clear the interval if the response is not ok
                        alert('Error occurred while checking class phase');
                    }
                } catch (error) {
                    clearInterval(intervalId); // Clear the interval in case of an error
                    console.error('Error:', error);
                    alert('Error occurred while checking class phase');
                }
            }, 1000); // Poll every second

            // Cleanup function to clear the interval when the component unmounts
            return () => clearInterval(intervalId);
        }
    }, [wantsToJoin, inputClassCode, navigate]);

    const handleJoin = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`http://localhost:3001/class/${inputClassCode}/exists`);
            if (response.ok) {
                const data = await response.json();
                // Store the student data in sessionStorage immediately after confirming the class exists
                sessionStorage.setItem('loggedInStudent', JSON.stringify(data));
                setWantsToJoin(true); // Set wantsToJoin to true to start polling for the class phase
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
            {!wantsToJoin ? (
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
            ) : (
                <p>Waiting for the teacher to enter the class...</p>
            )}
        </div>
    );
}

export default StudentJoin;
