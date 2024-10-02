import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import PlayWordSelector from './playComponents/playWordSelector';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';
import { getFromSessionStorage } from '../../utils/storageUtils';

function StudentPlay({ navigate, classCode }) {
    const maxIterations = 5; // Maximum training times

    const [iteration, setIteration] = useState(() => {
        // To keep track of the training iterations
        const storedIteration = getFromSessionStorage('iteration');
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
    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);

    const { t } = useTranslation();

    Scrollbar.use(OverscrollPlugin);


    const initializeScrollbar = (ref) => {
        if (ref.current) {
            const scrollbar = Scrollbar.init(ref.current, {
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
    };

    useEffect(() => initializeScrollbar(scrollbarRef), []);
    useEffect(() => initializeScrollbar(scrollbarRef2), []);

    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current, scrollbarRef2.current].forEach(ref => {
                if (ref) ref.style.pointerEvents = state;
            });
        };

        window.addEventListener('keydown', handleKeyEvents);
        window.addEventListener('keyup', handleKeyEvents);

        return () => {
            window.removeEventListener('keydown', handleKeyEvents);
            window.removeEventListener('keyup', handleKeyEvents);
        };
    }, []);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(getFromSessionStorage('loggedInStudent'));
        setStudent(loggedInStudent);

        const checkClassPhase = async () => {
            try {
                const response = await fetch(`${global.BASE_URL}/class/${getFromSessionStorage('loggedInClassCode')}/phase`, {
                    headers: {
                        'bypass-tunnel-reminder': 'any-value-you-want'
                    }
                });

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
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'any-value-you-want'
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
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'any-value-you-want'
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
        sessionStorage.removeItem('iterationData');
        navigate('/student');
        window.location.reload(); // Reload the page to reset the state
    };


    if (classPhase === 0) {
        handleReset();
    }


    return (
        <div className="overflowY-container" ref={scrollbarRef2}>
            <div className="overflowY-container-inside">
                <div>
                    <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-1">
                            <div className='col-span-2'>
                                <h1 className='hidden lg:block' style={{ fontWeight: '600' }}>{t('studentPlay')}</h1>
                                {/* {matrix && matrix.map((row, rowIndex) => (
                                    <div key={rowIndex}>
                                        {row.map((value, colIndex) => (
                                            <span key={colIndex}>{value} </span>
                                        ))}
                                        <br />
                                    </div>
                                ))}

                                {matrix && (
                                    <div className='text-custom_black font-bold'>
                                        {`${matrix[0][0] + matrix[1][1] + matrix[2][2]}`}
                                    </div>
                                )} */}

                                <div className='h-full'>
                                    <PlayWordSelector updateScore={updateScore} setProgress={setProgress} setWords={setWords}
                                        ExternalCurrentWordIndex={ExternalCurrentWordIndex} ExternalCurrentWordIndexChange={ExternalCurrentWordIndexChange}
                                        setExternalIsTraining={setIsTraining} maxIterations={maxIterations} iteration={iteration} setIteration={setIteration}
                                        classCode={classCode} navigate={navigate} matrix={matrix} setMatrix={setMatrix} isTurningIn={isTurningIn}
                                        setIsTurningIn={setIsTurningIn} setStudent={setStudent} setScore={setScore} />
                                </div>

                            </div>
                            <div>
                                <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7 mt-4 lg:mt-0">
                                    <div className='contain'>
                                        <div className='inside-card-2-header justify-center text-white'> {/* Header */}
                                            <div className={isTraining ? "progress out" : "progress entering"}>
                                                {iteration >= maxIterations ? `${maxIterations}/${maxIterations}` : `${iteration + 1}/${maxIterations}`}
                                            </div>
                                            <div className={`info-button ${isTraining ? 'hidden' : ''}`}>
                                                i
                                                <div className="tooltip bottom left">
                                                    <div style={{ fontWeight: '400' }}>{t('info-word-list-1')}</div>
                                                    <div className='pt-2'></div>
                                                    <div style={{ fontWeight: '400' }}>{t('info-word-list-2')}</div>
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
                                                        <div className="animated-word-text" style={{ fontWeight: '500' }}>
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
            </div>
        </div>
    );
}

export default StudentPlay;
