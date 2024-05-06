import React, { useState, useEffect, useContext } from 'react';

import { TransitionContext } from '../../visualComponents/TransitionContext';
import { useTranslation } from 'react-i18next';

function TeacherLogin({ navigate, classCode }) {
    const [password, setPassword] = useState('password');
    const [inputClassCode, setInputClassCode] = useState(classCode);
    const { isTransitioning, isEntering } = useContext(TransitionContext);

    const { t } = useTranslation();


    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    const handleCreateClass = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${global.BASE_URL}/teacher/authenticate`, { // Teacher authenticates
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

                // Check the class phase in case the class already has finished
                const checkPhaseResponse = await fetch(`${global.BASE_URL}/class/${inputClassCode}/phase`);
                if (checkPhaseResponse.ok) {
                    const checkPhaseData = await checkPhaseResponse.json();
                    if (checkPhaseData.phase === 2) {
                        // Go to results directly
                        sessionStorage.setItem('isFinished', true);
                        navigate(`/teacher/${classCode}/results`);
                        return;
                    }
                } else {
                    console.error('Error checking class phase:', checkPhaseResponse.statusText);
                    alert('Error occurred while checking class phase');
                    return; // Exit the function if there's an error checking the phase
                }

                // After successful login and checking the class phase, set the class phase to 1
                const phaseResponse = await fetch(`${global.BASE_URL}/class/${inputClassCode}/setPhase`, { // Set the class phase to 1
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
        <div>
            <div className={`inside-login-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className="form-container">
                    <h1 className="text-2xl font-bold text-center">{t('teacherLogin')}</h1>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                        <div className="flex justify-center relative">
                            <input
                                id="classCode"
                                type="text"
                                placeholder=""
                                value={inputClassCode}
                                onChange={(e) => setInputClassCode(e.target.value)}
                                maxLength={100}
                                className="mt-8 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                            />
                            <span className='text-2xl text-gray-300 bg-white absolute left-3 top-11 px-1
                                transition duration-200 input-text pointer-events-none'>{t('classCode')}</span>
                        </div>

                        <div className="flex justify-center relative">
                            <input
                                id="password"
                                type="password"
                                placeholder=""
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                maxLength={20}
                                className="mt-3 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                            />
                            <span className='text-2xl text-gray-300 bg-white absolute left-4 top-6 px-1
                                transition duration-200 input-text pointer-events-none'>{t('password')}</span>
                        </div>
                        <div>
                            <button type="submit" className="animated-button p-2 text-center mt-4">
                                <div className="animated-button-bg"></div>
                                <div className="animated-button-text">
                                    {t('login')}
                                </div>
                            </button>

                            <div className="text-center text-base pt-2" onClick={() => navigate('/student')}>
                                <span className="text-custom_black opacity-50 hover:text-accent hover:opacity-100 cursor-pointer">{t('imastudent')}</span>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default TeacherLogin;
