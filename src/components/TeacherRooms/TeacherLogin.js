import React, { useState, useEffect } from 'react';
import Background from '../../visualComponents/Background';

function TeacherLogin({ navigate, classCode }) {
    const [password, setPassword] = useState('password');
    const [inputClassCode, setInputClassCode] = useState(classCode);


    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    const handleCreateClass = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/teacher/authenticate', { // Teacher authenticates
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: inputClassCode, password }),
            });

            if (response.ok) {
                sessionStorage.setItem('isAuthenticated', true);
                sessionStorage.setItem('createdClassCode', inputClassCode);
                navigate(`/teacher/${inputClassCode}`);

                // After successful login, set the class phase to 1
                const phaseResponse = await fetch(`http://localhost:3001/class/${inputClassCode}/setPhase`, { // Set the class phase to 1
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phase: 1 }),
                });

                if (!phaseResponse.ok) {
                    console.error('Error setting class phase:', phaseResponse.statusText);
                    alert('Error occurred while setting class phase');
                }
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
        <Background>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className="inside-card col-span-full md:col-span-2 lg:col-span-3">
                    <div class="form-container">
                        <h1 className="text-2xl font-bold text-center">Teacher Login</h1>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div className="flex justify-center relative">
                                <input
                                    id="classCode"
                                    type="text"
                                    placeholder=""
                                    value={inputClassCode}
                                    onChange={(e) => setInputClassCode(e.target.value)}
                                    className="mt-8 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                />
                                <span className='text-2xl text-gray-300 bg-white absolute left-3 top-11 px-1
                                transition duration-200 input-text pointer-events-none'>Class code</span>
                            </div>

                            <div className="flex justify-center relative">
                                <input
                                    id="password"
                                    type="password"
                                    placeholder=""
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-3 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                />
                                <span className='text-2xl text-gray-300 bg-white absolute left-4 top-6 px-1
                                transition duration-200 input-text pointer-events-none'>Password</span>
                            </div>
                            <div>
                                <button type="submit" class="animated-button p-2 text-center mt-4">
                                    <div class="animated-button-bg"></div>
                                    <div class="animated-button-text">
                                        Login
                                    </div>
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div >
        </Background >
    );
}

export default TeacherLogin;
