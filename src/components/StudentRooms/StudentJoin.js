import React, { useState, useEffect, useContext, useRef } from 'react';

import { TransitionContext } from '../../visualComponents/TransitionContext';

function StudentJoin({ navigate, classCode }) {
    const [name, setName] = useState('student1');
    const [inputClassCode, setInputClassCode] = useState(classCode);
    const [wantsToJoin, setWantsToJoin] = useState(false);
    const { isTransitioning, isEntering } = useContext(TransitionContext);

    const shrinkCard = useRef(null);

    useEffect(() => {
        const updateHeight = () => {
            if (shrinkCard.current) {
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

                const heightInPixels = shrinkCard.current.offsetHeight;
                const heightInRem = heightInPixels / rootFontSize;

                const widthInPixels = shrinkCard.current.offsetWidth;
                const widthInRem = widthInPixels / rootFontSize;

                shrinkCard.current.style.setProperty('--initial-height', `${heightInRem}rem`);
                shrinkCard.current.style.setProperty('--initial-width', `${widthInRem}rem`);
            }
        };

        // Call the function initially to set the height
        updateHeight();

        // Add event listeners for resize and zoom level changes
        window.addEventListener('resize', updateHeight);
        // Listen for changes in devicePixelRatio to detect zoom level changes
        window.addEventListener('resize', updateHeight);

        // Cleanup function to remove event listeners
        return () => {
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
        };
    }, [shrinkCard, wantsToJoin]);


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
                            sessionStorage.setItem('classStarted', true);
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
            const response = await fetch(`http://localhost:3001/class/${inputClassCode}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            // Directly parse the JSON response
            const data = await response.json();

            // Check if the response contains an error
            if (data.error) {
                // Handle different types of errors
                switch (data.error) {
                    case 'Class code does not exist':
                        alert('The class code does not exist. Please check and try again.');
                        break;
                    case 'Student with that name already exists in the class':
                        alert('A student with that name already exists in the class. Please choose a different name.');
                        break;
                    case 'Failed to create model':
                        alert('Failed to create model. Please try again.');
                        break;
                    default:
                        alert('An error occurred while joining the class.');
                }
                return; // Exit the function if there's an error
            }

            // If there's no error, proceed as before
            sessionStorage.setItem('loggedInStudent', JSON.stringify(data));
            setWantsToJoin(true); // Set wantsToJoin to true to start polling for the class phase
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while joining the class.');
        }
    };


    return (
        <div>
            <div ref={shrinkCard} className={`inside-login-card ${wantsToJoin ? 'shrink' : ''} ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className="form-container">

                    {wantsToJoin && <p className={`waiting ${wantsToJoin ? 'form-animated-2' : ''}`} style={{ position: 'absolute' }}>Waiting...</p>}

                    <h1 className={`text-2xl font-bold text-center ${wantsToJoin ? 'form-animated' : ''}`}>Student Join</h1>

                    <div className={`${wantsToJoin ? 'form-animated' : ''}`}>
                        <form onSubmit={handleJoin} className="space-y-4">

                            <div className="flex justify-center relative">
                                <input
                                    id="name"
                                    type="text"
                                    placeholder=""
                                    value={name}
                                    disabled={wantsToJoin}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-8 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                />
                                <span className='text-2xl text-gray-300 bg-white absolute left-5 top-11 px-1
                                transition duration-200 input-text pointer-events-none'>Name</span>
                            </div>
                            <div className="flex justify-center relative">
                                <input
                                    id="classCode"
                                    type="text"
                                    placeholder=""
                                    value={inputClassCode}
                                    disabled={wantsToJoin}
                                    onChange={(e) => setInputClassCode(e.target.value)}
                                    className="mt-3 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                />
                                <span className='text-2xl text-gray-300 bg-white absolute left-3 top-6 px-1
                                transition duration-200 input-text pointer-events-none'>Class code</span>
                            </div>
                            <div>
                                <button type="submit" className="animated-button p-2 text-center mt-4" disabled={wantsToJoin}>
                                    <div className="animated-button-bg"></div>
                                    <div className="animated-button-text">
                                        Join
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default StudentJoin;
