import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';

function StudentResults({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [score, setScore] = useState();
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);
    const scrollbarRef3 = useRef(null);
    const scrollbarRef4 = useRef(null);

    const [matrix, setMatrix] = useState(null);
    const [matrixLoaded, setMatrixLoaded] = useState(false); // State to track if the matrix is loaded
    const mistakes = JSON.parse(sessionStorage.getItem('mistakes')) || [];
    const sum = matrix && matrix.length > 0 ? matrix[0][0] + matrix[1][1] + matrix[2][2] : null;

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
    useEffect(() => initializeScrollbar(scrollbarRef3), []);
    useEffect(() => initializeScrollbar(scrollbarRef4), []);


    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current, scrollbarRef2.current, scrollbarRef3.current, scrollbarRef4.current].forEach(ref => {
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
                await fetchMatrixUntilClose(modelName, loggedInScore, setMatrix);
                setMatrixLoaded(true);
            };

            fetchAndSetMatrix();
        } else {
            console.log('No loggedInStudent found in sessionStorage.');
        }
    }, []); // Empty dependency array ensures this runs only once after the initial render

    const fetchMatrixUntilClose = async (modelName, score, setMatrix) => {
        let matrix = null;
        let diagonalSum = 0;

        do {
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
                matrix = data;
                diagonalSum = calculateDiagonalSum(matrix);

            } catch (error) {
                console.error('Failed to fetch model matrix:', error);
                break;
            }
        } while (Math.abs(diagonalSum - score) > 1.01);

        setMatrix(matrix);
    };

    const calculateDiagonalSum = (matrix) => {
        return matrix[0][0] + matrix[1][1] + matrix[2][2];
    };

    // Function to map labels to inline styles
    const getStyleForLabel = (label) => {
        switch (label) {
            case 'D':
                return { color: '#cfb838', fontWeight: 500 };
            case 'H':
                return { color: '#127edd', fontWeight: 500 };
            case 'G':
                return { color: '#ee1212', fontWeight: 500 };
            default:
                return { color: '#1c1c1c', fontWeight: 500 };
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

    if (classPhase === 0) {
        handleReset();
    }


    return (
        <div class="overflowY-container" ref={scrollbarRef4}>
            <div className="overflowY-container-inside">
                <div>
                    <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:h-80 gap-4'>
                            <div className="lg:col-span-1 col-span-full gap-4 max-w-17">
                                <h1>{t('studentResults')}</h1>

                                <div className='hidden podium-student lg:flex justify-center items-center text-center'>
                                    <div className='top-bar-student py-8'>
                                        <div>
                                            {student.name} <br />
                                            {score}%
                                        </div>
                                    </div>
                                </div>
                                <div className='block lg:hidden'>
                                    {student.name} <br />
                                    {score}%
                                </div>
                            </div>

                            <div className='col-span-full lg:col-span-2 lg:pl-7'>
                                <div className='contain hidden md:grid lg:grid grid-rows-3 grid-cols-2'>
                                    <div className='inside-card-2-header text-white'> {/* Header */}
                                        <div>{t('AIResults')}</div>
                                    </div>

                                    <div className="inside-card-2 p-7 lg:p-6 md:p-6 lg:pt-14 md:pt-14 pt-14 col-span-full grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 md:grid-rows-3 lg:grid-rows-3 grid-rows-0 justify-center">

                                        <div className={`contain-results md:ml-2 lg:ml-2 ml-0 mt-5 col-span-1 row-span-2 ${matrixLoaded ? 'matrix-loaded' : ''}`}>
                                            <div className='inside-card-results-header text-white'> {/* Header */}
                                                <div></div>
                                                <div className='matrix-bold-diphthong'>{t('d')}</div>
                                                <div className='matrix-bold-hiatus'>{t('h')}</div>
                                                <div className='matrix-bold-general'>{t('g')}</div>
                                            </div>

                                            <div className='inside-card-results-header-side text-white'> {/* Side header */}
                                                <div></div>
                                                <div className='matrix-bold-diphthong'>{t('d')}</div>
                                                <div className='matrix-bold-hiatus'>{t('h')}</div>
                                                <div className='matrix-bold-general'>{t('g')}</div>
                                            </div>

                                            <div className="inside-card-matrix pt-9 pl-14 pb-2 pr-7">
                                                <div className="matrix">
                                                    {matrix && matrix.map((row, rowIndex) => (
                                                        <div key={rowIndex} className="matrix-row">
                                                            {row.map((value, colIndex) => (
                                                                <span key={colIndex} className="matrix-item top">{value}</span>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='block md:hidden lg:hidden self-center pt-4 text-center'>
                                            <div className='text-2xl pb-2 text-custom_black' style={{ fontWeight: 640 }}>{t('globalAccuracy')} </div>
                                            <div className='text-custom_black'> {sum !== null ? `${matrix[0][0]} + ${matrix[1][1]} + ${matrix[2][2]} = ${sum}` : 'loading...'} </div>
                                        </div>

                                        <div className='col-span-1 row-span-3'>
                                            <div className='contain-mistakes pl-2'>
                                                <div className='inside-card-mistakes-header mt-5 text-white'> {/* Header */}
                                                    {mistakes.length} {mistakes.length === 1 ? t('mistake') : t('mistakes')}

                                                    <div className="info-button mt-5 mr-2">
                                                        i
                                                        <div className="tooltip bottom left">
                                                            <div style={{ fontWeight: '400' }}>{t('info-errors')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='inside-card-mistakes p-7 pt-12 mt-5' ref={scrollbarRef}>
                                                    <div className='mistakes pt-1'>
                                                        {mistakes.map(([word, mistakenLabel, correctLabel], index) => (
                                                            <div key={index}>
                                                                <a>{word}: </a>
                                                                <a style={getStyleForLabel(correctLabel)}>{correctLabel}</a>
                                                                <a>, no </a>
                                                                <a style={getStyleForLabel(mistakenLabel)}>{mistakenLabel}</a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='hidden md:block lg:block self-center row-span-2 col-span-1 text-center'>
                                            <div className='allow-info-overflow'>
                                                <div className="info-button mr-4">
                                                    i
                                                    <div className="tooltip top right">
                                                        <div className="text-xl text-">{t('info-columns-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-columns-2')}</div>
                                                        <div className='pt-1.5'></div>
                                                        <div className="text-xl">{t('info-rows-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-rows-2')}</div>

                                                        <div className='pt-7'></div>
                                                        <div className="text-xl">{t('info-result-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-result-2')}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='lg:pr-0 lg:pl-3 md:pr-8 lg:mr-10 lg:mt-3 md:mt-3 mt-8 '>
                                                <div className='text-2xl pb-2 text-custom_black' style={{ fontWeight: 640 }}>{t('globalAccuracy')}</div>
                                                <div className='text-custom_black'> {sum !== null ? `${matrix[0][0]} + ${matrix[1][1]} + ${matrix[2][2]} = ${sum}` : t('loading')} </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/*For small screens*/}
                                <div className='contain grid md:hidden lg:hidden'>
                                    <div className='inside-card-2-header text-white'> {/* Header */}
                                        <div>{t('AIResultsShort')}</div>
                                    </div>

                                    <div ref={scrollbarRef2} className="inside-card-2 lg:pt-14 md:pt-14 pt-14 pl-5 pb-5 justify-center">

                                        <div className={`contain-results md:ml-2 lg:ml-2 ml-0 mt-5 col-span-1 row-span-2 ${matrixLoaded ? 'matrix-loaded' : ''}`}>
                                            <div className='inside-card-results-header text-white'> {/* Header */}
                                                <div></div>
                                                <div className='matrix-bold-diphthong'>{t('d')}</div>
                                                <div className='matrix-bold-hiatus'>{t('h')}</div>
                                                <div className='matrix-bold-general'>{t('g')}</div>
                                            </div>

                                            <div className='inside-card-results-header-side text-white'> {/* Side header */}
                                                <div></div>
                                                <div className='matrix-bold-diphthong'>{t('d')}</div>
                                                <div className='matrix-bold-hiatus'>{t('h')}</div>
                                                <div className='matrix-bold-general'>{t('g')}</div>
                                            </div>

                                            <div className="inside-card-matrix pt-9 pl-14 pb-2 pr-7">
                                                <div className="matrix">
                                                    {matrix && matrix.map((row, rowIndex) => (
                                                        <div key={rowIndex} className="matrix-row">
                                                            {row.map((value, colIndex) => (
                                                                <span key={colIndex} className="matrix-item top">{value}</span>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>

                                        <div className='self-center pt-1 pb-2 text-center pr-8'>
                                            <div className='allow-info-overflow mr-16'>
                                                <div className="info-button mr-3">
                                                    i
                                                    <div className="tooltip top">
                                                        <div className="text-xl">{t('info-columns-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-columns-2')}</div>
                                                        <div className='pt-1.5'></div>
                                                        <div className="text-xl">{t('info-rows-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-rows-2')}</div>

                                                        <div className='pt-7'></div>
                                                        <div className="text-xl">{t('info-result-1')}</div>
                                                        <div style={{ fontWeight: '400' }}>{t('info-result-2')}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='lg:pr-0 lg:pl-3 md:pr-8 lg:mr-10 lg:mt-3 md:mt-3 mt-8 '>
                                                <div className='text-2xl pb-0 text-custom_black' style={{ fontWeight: 640 }}>{t('globalAccuracy')}</div>
                                                <div className='text-custom_black'> {sum !== null ? `${matrix[0][0]} + ${matrix[1][1]} + ${matrix[2][2]} = ${sum}` : t('loading')} </div>
                                            </div>
                                        </div>

                                        <div className='contain-mistakes-slim'>
                                            <div className='inside-card-mistakes-header mt-4 text-white'> {/* Header */}
                                                {mistakes.length} {mistakes.length === 1 ? t('mistake') : t('mistakes')}

                                                <div className="info-button mt-4 mr-4">
                                                    i
                                                    <div className="tooltip bottom left">
                                                        <div style={{ fontWeight: '400' }}>{t('info-errors')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='inside-card-mistakes-slim p-7 pt-12 mt-5' ref={scrollbarRef3} >
                                                <div className='mistakes pt-1'>
                                                    {mistakes.map(([word, mistakenLabel, correctLabel], index) => (
                                                        <div key={index}>
                                                            <a>{word}: </a>
                                                            <a style={getStyleForLabel(correctLabel)}>{correctLabel}</a>
                                                            <a>{t('no')}</a>
                                                            <a style={getStyleForLabel(mistakenLabel)}>{mistakenLabel}</a>
                                                        </div>
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
        </div>
    );
}

export default StudentResults;
