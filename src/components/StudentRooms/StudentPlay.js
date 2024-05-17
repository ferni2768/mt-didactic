import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import PlayWordSelector from './playComponents/playWordSelector';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';

function StudentPlay({ navigate, classCode }) {
    const maxIterations = 5; // Maximum training times

    const [iteration, setIteration] = useState(() => {
        // To keep track of the training iterations
        const storedIteration = sessionStorage.getItem('iteration');
        const parsedIteration = storedIteration ? parseInt(storedIteration, 10) : 0;
        return parsedIteration;
    });

    const [matrix, setMatrix] = useState(null);
    const [, setScore] = useState();
    const [student, setStudent] = useState({});
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase
    const { isTransitioning, isEntering } = useContext(TransitionContext);
    const [words, setWords] = useState([]); // State to store the words and labels [word, label]
    const [ExternalCurrentWordIndex, setExternalCurrentWordIndex] = useState(0); // State to track/modify the current word index
    const [ExternalCurrentWordIndexChange, setExternalCurrentWordIndexChange] = useState(1); // State to track/modify the current word index
    const [isTraining, setIsTraining] = useState(false);
    const [isTurningIn, setIsTurningIn] = useState(false);
    // const [isMatrixLoading, setIsMatrixLoading] = useState(true); // To fix synchronous issues
    const scrollbarRef = useRef(null);

    const { t } = useTranslation();

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
            scrollbar.track.xAxis.element.remove();
            return () => scrollbar.destroy();
        }
    }, []);

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        setStudent(loggedInStudent);

        const checkClassPhase = async () => {
            try {
                const response = await fetch(`${global.BASE_URL}/class/${sessionStorage.getItem('loggedInClassCode')}/phase`);
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
            await fetch(`${global.BASE_URL}/student/${student.id}/updateScore`, {
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
            await fetch(`${global.BASE_URL}/student/${student.id}/setProgress`, {
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
        sessionStorage.removeItem('mistakes');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    useEffect(() => {
        // Retrieve the loggedInStudent object from sessionStorage
        const loggedInStudentString = sessionStorage.getItem('loggedInStudent');
        const loggedInScoreString = sessionStorage.getItem('loggedInScore');

        if (loggedInStudentString) {
            const loggedInStudent = JSON.parse(loggedInStudentString);
            const loggedInScore = loggedInScoreString ? JSON.parse(loggedInScoreString) : null;

            // Set the student and score state
            setStudent(loggedInStudent);
            setScore(loggedInScore);

            // Fetch the matrix data using the model name from loggedInStudent
            const fetchAndSetMatrix = async () => {
                const modelName = loggedInStudent.model;
                await fetchModelMatrix(modelName, setMatrix);
            };

            (async () => {
                await fetchAndSetMatrix();
            })();
        } else {
            console.log('No loggedInStudent found in sessionStorage.');
        }
    }, [iteration]); // Re-run the effect every iteration


    const fetchModelMatrix = async (modelName, setMatrix) => {
        try {
            const response = await fetch(`${global.BASE_URL}/models/${modelName}/matrix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const matrix = data;

            setMatrix(matrix);

        } catch (error) {
            console.error('Failed to fetch model matrix:', error);
        }
    };


    if (classPhase === 0) {
        handleReset();
    }


    return (
        <div>
            <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-1">
                    <div className='col-span-2'>
                        <h1 className='hidden lg:block'>{t('studentPlay')}</h1>
                        {/* {matrix && matrix.map((row, rowIndex) => (
                            <div key={rowIndex}>
                                {row.map((value, colIndex) => (
                                    <span key={colIndex}>{value} </span>
                                ))}
                            </div>
                        ))} */}
                        <div className='h-full'>
                            <PlayWordSelector updateScore={updateScore} setProgress={setProgress} setWords={setWords}
                                ExternalCurrentWordIndex={ExternalCurrentWordIndex} ExternalCurrentWordIndexChange={ExternalCurrentWordIndexChange}
                                setExternalIsTraining={setIsTraining} maxIterations={maxIterations} iteration={iteration} setIteration={setIteration}
                                classCode={classCode} navigate={navigate} matrix={matrix} isTurningIn={isTurningIn} setIsTurningIn={setIsTurningIn} />
                        </div>
                    </div>
                    <div>
                        <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7">
                            <div className='contain'>
                                <div className='inside-card-2-header justify-center text-white'> {/* Header */}
                                    <div className={isTraining ? "progress out" : "progress entering"}>
                                        {iteration >= maxIterations ? `${maxIterations}/${maxIterations}` : `${iteration + 1}/${maxIterations}`}
                                    </div>
                                    <div className={`info-button ${isTraining ? 'hidden' : ''}`}>
                                        i
                                        <div className="tooltip bottom left">
                                            {t('info-word-list-1')}
                                            <div className='pt-1.5'></div>
                                            {t('info-word-list-2')}
                                        </div>
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
                                                <div className="animated-word-bg md:pl-52 lg:pl-0"></div>
                                                <div className="animated-word-text">
                                                    {word} {label !== "" && `(${label})`}
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
