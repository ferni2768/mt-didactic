import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import PlayWordSelector from './playComponents/playWordSelector';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

function StudentPlay({ navigate, classCode }) {
    const maxIterations = 5; // Maximum training times

    const [iteration, setIteration] = useState(() => {
        // To keep track of the training iterations
        const storedIteration = sessionStorage.getItem('iteration');
        const parsedIteration = storedIteration ? parseInt(storedIteration, 10) : 0;
        return parsedIteration;
    });

    const [student, setStudent] = useState({});
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase
    const { isTransitioning, isEntering } = useContext(TransitionContext);
    const [words, setWords] = useState([]); // State to store the words and labels [word, label]
    const [ExternalCurrentWordIndex, setExternalCurrentWordIndex] = useState(0); // State to track/modify the current word index
    const [ExternalCurrentWordIndexChange, setExternalCurrentWordIndexChange] = useState(1); // State to track/modify the current word index
    const [isTraining, setIsTraining] = useState(false);
    const scrollbarRef = useRef(null);

    Scrollbar.use(OverscrollPlugin);


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'r' || event.key === 'R') {
                handleReset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
                const response = await fetch(`http://localhost:3001/class/${sessionStorage.getItem('createdClassCode')}/phase`);
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
        const updatedScore = score;
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: updatedScore }) // Updated score to database
            });
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
        sessionStorage.removeItem('iteration');
        sessionStorage.removeItem('newBatch');
        sessionStorage.removeItem('score');
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
                            <PlayWordSelector updateScore={updateScore} setProgress={setProgress} setWords={setWords}
                                ExternalCurrentWordIndex={ExternalCurrentWordIndex} ExternalCurrentWordIndexChange={ExternalCurrentWordIndexChange}
                                setExternalIsTraining={setIsTraining} maxIterations={maxIterations} iteration={iteration} setIteration={setIteration}
                                classCode={classCode} navigate={navigate} />
                        </div>
                    </div>
                    <div>
                        <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7">
                            <div className='contain'>
                                <div className='inside-card-2-header justify-center text-white'> {/* Header */}
                                    <div className={isTraining ? "progress out" : "progress entering"}>
                                        {iteration >= maxIterations ? `${maxIterations}/${maxIterations}` : `${iteration + 1}/${maxIterations}`}
                                    </div>
                                </div>
                                <div className="inside-card-2 p-5 pt-14 mb-0.5" ref={scrollbarRef}>
                                    <div className='grid grid-rows-10'>
                                        {words.map(([word, label], index) => (
                                            <button key={index} className={`animated-word p-0.5 text-center mt-1.5 ${isTraining ? 'out' : 'entering'} ${label === 'H' ? 'hiatus assigned' : label === 'D' ? 'diphthong assigned' : label === 'G' ? 'general assigned' : ''}`}
                                                onClick={() => {
                                                    setExternalCurrentWordIndex(index);
                                                    setExternalCurrentWordIndexChange(ExternalCurrentWordIndexChange * (-1)); // To notify the child component that the current word index has changed
                                                }}>
                                                <div className="animated-word-bg"></div>
                                                <div className="animated-word-text">
                                                    {word}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentPlay;
