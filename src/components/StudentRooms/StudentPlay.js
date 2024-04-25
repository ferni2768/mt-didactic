import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import PlayWordSelector from './playComponents/playWordSelector';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

function StudentPlay({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase
    const { isTransitioning, isEntering } = useContext(TransitionContext);
    const [words, setWords] = useState([]); // State to store the words and labels [word, label]
    const scrollbarRef = useRef(null);

    Scrollbar.use(OverscrollPlugin);


    useEffect(() => {
        if (scrollbarRef.current) {
            const scrollbar = Scrollbar.init(scrollbarRef.current, {
                damping: 0.1,
                plugins: {
                    overscroll: {
                        enabled: true,
                        maxOverscroll: 50,
                        effect: 'bounce',
                        damping: 0.1
                    }
                }
            });
            return () => scrollbar.destroy();
        }
    }, []);

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        setStudent(loggedInStudent);

        const checkClassPhase = async () => {
            try {
                const response = await fetch(`http://localhost:3001/class/${classCode}/phase`);
                if (response.ok) {
                    const data = await response.json();
                    setClassPhase(data.phase);
                } else {
                    console.error('Error fetching class phase:', response.statusText);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        // Initial check
        checkClassPhase();

        // Set up an interval to check the class phase every second
        const intervalId = setInterval(checkClassPhase, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [classCode]);

    const updateScore = async (score) => {
        // Multiply the percentage score by 100 to get the actual score
        const updatedScore = score * 100;
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: updatedScore }) // Updated score to database
            });
            sessionStorage.setItem('loggedInScore', updatedScore); // Updated score to session storage
            navigate(`/student/${classCode}/results`);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const setProgress = async (progress) => {
        try {
            await fetch(`http://localhost:3001/student/${student.id}/setProgress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ progress: progress }) // Updated progress to database
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('loggedInClassCode');
        sessionStorage.removeItem('loggedInStudent');
        sessionStorage.removeItem('loggedInScore');
        sessionStorage.removeItem('classStarted');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    if (classPhase === 2) {
        return <div>The class already finished</div>;
    }

    return (
        <div>
            <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-1">
                    <div className='col-span-2'>
                        <h1 className='hidden lg:block'>Student Play</h1>
                        <div className='h-full'>
                            <PlayWordSelector updateScore={updateScore} setProgress={setProgress} setWords={setWords} />
                        </div>
                    </div>
                    <div>
                        <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7">
                            <div className="inside-card-2 p-6 pt-4" ref={scrollbarRef}>
                                <div className='grid grid-rows-10'>
                                    {words.map(([word, label], index) => (
                                        <div key={index} className={`animated-word p-1 text-center mt-1.5 ${label === 'H' ? 'hiatus assigned' : label === 'D' ? 'diphthong assigned' : label === 'G' ? 'general assigned' : ''}`}>
                                            <div className="animated-word-bg"></div>
                                            <div className="animated-word-text">
                                                {word}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <button onClick={handleReset}>Reset</button> */}
        </div>
    );
}

export default StudentPlay;
