import React, { useEffect, useState, useRef } from 'react';
import useDataFetcher from './dataFetcher'; // To fetch the data from the csv files
import { useTranslation } from 'react-i18next';
import { getFromSessionStorage, saveToSessionStorage } from '../../../utils/storageUtils';

function PlayWordSelector({ updateScore, setProgress, setWords, ExternalCurrentWordIndex, ExternalCurrentWordIndexChange,
    setExternalIsTraining, maxIterations, iteration, setIteration, navigate, matrix, setMatrix, isTurningIn, setIsTurningIn, classCode,
    setStudent, setScore }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0); // To keep track of the current word index
    const [isTraining, setIsTraining] = useState(false);
    const [buttonWait, setButtonWait] = useState(true);
    const [textOpacity, setTextOpacity] = useState(1);

    const trainingTimes = 3; // Number of times the model gets trained every iteration

    const [selectedModel,] = useState(() => {
        // Get the name of the model that the student is going to train
        const loggedInStudent = getFromSessionStorage('loggedInStudent');
        return loggedInStudent ? JSON.parse(loggedInStudent).model : '';
    });

    const [newAnswer, setNewAnswer] = useState([]); // To store the input answers
    const [newWords, setNewWords] = useState(false); // To trigger the new batch of words
    const [trainingData, setTrainingData] = useState([]);
    const [forceCheckMatrix, setForceCheckMatrix] = useState(false);
    const { selectedElements, processTrainingDataMatrix } = useDataFetcher();

    const [animationClass, setAnimationClass] = useState(''); // To trigger the transition animation between words
    const [isAnimating, setIsAnimating] = useState(false);
    const [periods, setPeriods] = useState(3); // Periods in training text

    const shrinkButton = useRef(null);
    const shrinkSpace = useRef(null);

    const [newBatch, setNewBatch] = useState(() => {
        // To store the new batch of recommended words
        const storedNewBatch = getFromSessionStorage('newBatch');
        return storedNewBatch ? JSON.parse(storedNewBatch) : [];
    });

    // Function to calculate accuracy for a category
    function calculateCategoryAccuracy(matrix, categoryIndex) {

        if (matrix.length < 2) return 0;

        let totalPredictions = 0;

        for (let i = 0; i < 3; i++) {
            totalPredictions += matrix[categoryIndex][i];
        }

        if (totalPredictions === 0) return 0;

        let result = (matrix[categoryIndex][categoryIndex] / totalPredictions);

        if (result > 0.95) result = 1.1;

        return result;
    }

    // Function to actual percentage accuracy for a category
    function calculateCategoryScore(matrix, categoryIndex) {

        if (matrix.length < 2) return 0;

        let totalPredictions = 0;

        for (let i = 0; i < 3; i++) {
            totalPredictions += matrix[categoryIndex][i];
        }

        if (totalPredictions === 0) return 0;

        let result = (matrix[categoryIndex][categoryIndex] / totalPredictions);

        return Math.ceil(result * 100);
    }

    // Calculate accuracy for each category, providing a default value of 0 if matrix is not available
    const diphthongAccuracy = calculateCategoryAccuracy(matrix || [], 0);
    const hiatusAccuracy = calculateCategoryAccuracy(matrix || [], 1);
    const generalAccuracy = calculateCategoryAccuracy(matrix || [], 2);

    // Map accuracy to constant values, rounding to the nearest integer
    const diphthongScore = Math.round((diphthongAccuracy || 0) * 100);
    const hiatusScore = Math.round((hiatusAccuracy || 0) * 100);
    const generalScore = Math.round((generalAccuracy || 0) * 100);

    const { t } = useTranslation();


    useEffect(() => {
        if (currentWordIndex > 10 || parseInt(getFromSessionStorage('iteration'), 10) >= maxIterations) {
            setIsTurningIn(true);
        } else {
            setIsTurningIn(false);
        }
    }, [currentWordIndex]);

    useEffect(() => {
        // Retrieve the loggedInStudent object from sessionStorage
        const loggedInStudentString = getFromSessionStorage('loggedInStudent');
        const loggedInScoreString = getFromSessionStorage('loggedInScore');

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
        const fetchMatrix = async () => {
            try {
                const response = await fetch(`${global.BASE_URL}/models/${modelName}/matrix`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
            } catch (error) {
                // Silently handle the error by returning null
            }
            return null;
        };

        let matrix = null;
        while (matrix === null) {
            matrix = await fetchMatrix();
        }

        setMatrix(matrix);
    };

    // Effect to update the opacity of the buttons text when isTurningIn changes
    useEffect(() => {
        let timeoutId;
        if (isTurningIn) {
            timeoutId = setTimeout(() => {
                setTextOpacity(0);
            }, 270);
        } else {
            setTextOpacity(1);
        }

        return () => {
            clearTimeout(timeoutId);
        };
    }, [isTurningIn]);

    // Save the iteration and newBatch to sessionStorage
    useEffect(() => {
        saveToSessionStorage('iteration', iteration);
    }, [iteration]);

    useEffect(() => {
        saveToSessionStorage('newBatch', JSON.stringify(newBatch));
    }, [newBatch]);

    useEffect(() => {
        if (isTurningIn) {
            setButtonWait(true);
            setTimeout(() => {
                setButtonWait(false);
            }, 500);
        }
    }, [isTurningIn]);

    useEffect(() => {
        const updateWidth = () => {
            if (shrinkButton.current && shrinkSpace.current) {
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

                const heightInPixels = shrinkSpace.current.offsetHeight;
                const heightInRem = heightInPixels / rootFontSize;

                const widthInPixels = shrinkSpace.current.offsetWidth;
                const widthInRem = widthInPixels / rootFontSize;

                if (!isTurningIn) {

                    shrinkButton.current.style.setProperty('--initial-height', `${heightInRem}rem`);
                    shrinkButton.current.style.setProperty('--initial-width', `${widthInRem}rem`);
                }
            }
        };

        // Call the function initially to set the height
        updateWidth();

        // Add event listeners for resize and zoom level changes
        window.addEventListener('resize', updateWidth);
        // Listen for changes in devicePixelRatio to detect zoom level changes
        window.addEventListener('resize', updateWidth);

        // Cleanup function to remove event listeners
        return () => {
            window.removeEventListener('resize', updateWidth);
            window.removeEventListener('resize', updateWidth);
        };
    }, [shrinkButton, shrinkSpace, isTurningIn, newBatch]);

    useEffect(() => {
        let intervalId;

        const checkMatrix = () => {
            if (matrix !== null && Array.isArray(matrix) && matrix.every(row => Array.isArray(row))) {
                clearInterval(intervalId);

                if (parseInt(getFromSessionStorage('iteration'), 10) >= maxIterations) {
                    setProgress(100);
                    setExternalIsTraining(true);
                    setIsTraining(false);
                    setIsTurningIn(true);
                    setCurrentWordIndex(12);
                    return;
                }

                if (!newWords && (!getFromSessionStorage('newBatch') || JSON.parse(getFromSessionStorage('newBatch')).length === 0)) {
                    setNewBatch(selectedElements);
                }

                if (newWords) {
                    const updatedNewBatch = processTrainingDataMatrix(matrix);
                    setNewBatch(updatedNewBatch); // Set new batch of words

                    setCurrentWordIndex(0);
                    setProgress((iteration) * (100 / maxIterations)); // Update the student's progress for each iteration
                    setIsTraining(false);
                    setIsTurningIn(false);

                    setExternalIsTraining(false);
                    setNewWords(false);
                }
                setForceCheckMatrix(true);
            }
        };

        if (matrix === null) {
            intervalId = setInterval(checkMatrix, 1000);
        } else {
            checkMatrix();
        }

        return () => clearInterval(intervalId);
    }, [matrix, forceCheckMatrix]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (forceCheckMatrix === false) setForceCheckMatrix(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (iteration < maxIterations) {
            handleExternalClick();
        }
    }, [ExternalCurrentWordIndexChange]);

    useEffect(() => {
        setNewAnswer(newBatch.map(([word, label]) => [word, '']));
    }, [newBatch]);

    useEffect(() => {
        setWords(newAnswer);
    }, [newAnswer]);

    useEffect(() => {
        if (!isTraining) {
            return; // Exit early if not in training mode
        }

        const intervalId = setInterval(() => {
            setPeriods((prevPeriods) => (prevPeriods < 3 ? prevPeriods + 1 : 1));
        }, 1000); // Update every second

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [isTraining]); // Depend on isTraining to reset the interval if it changes

    useEffect(() => {
        if (iteration === maxIterations) {
            // Get the results from the matrix
            const results = {
                diphthong: calculateCategoryScore(matrix, 0),
                hiatus: calculateCategoryScore(matrix, 1),
                general: calculateCategoryScore(matrix, 2)
            };

            updateSessionStorageWithResultsAndErrors(results, []);
        }
    }, [matrix]);

    useEffect(() => {
        // Verify if the iterationData key exists in sessionStorage
        const existingData = getFromSessionStorage('iterationData');
        if (!existingData) {
            saveToSessionStorage('iterationData', JSON.stringify({}));
        }
    }, []);

    const handleAnswerSubmit = async (newAnswer) => {
        if (!isTurningIn || buttonWait) return;

        if (iteration == maxIterations) {
            navigate(`/student/${getFromSessionStorage('loggedInClassCode')}/results`); // Redirect to the results page
            return;
        }
        else {
            setIsTraining(true);
            setExternalIsTraining(true);
        }

        // Transform the newAnswer array into an object with the desired structure
        const answersObj = newAnswer.reduce((acc, combo) => {
            // Check if the combo has both elements (word and label) and the word is not an empty string
            if (combo[0].trim() !== '' && combo[1] !== '') {
                acc[combo[0]] = combo[1]; // Use the word as the key and the label as the value
            }
            return acc;
        }, {});

        const url = `${global.BASE_URL}/models/${selectedModel}/train`;
        const config = {
            method: 'post',
            body: JSON.stringify({ answers: answersObj, maxIterations: trainingTimes }),
            headers: { 'Content-Type': 'application/json' }
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error Status: ${response.status}`);
            }
            const data = await response.json();

            // Transform the data to the desired format
            const transformedData = data.map(item => [item[1], item[2]]);

            // Update the trainingData state with the transformed data
            setTrainingData(transformedData);

            await handleTestModel([selectedModel]);

            // Get the results from the matrix
            const results = {
                diphthong: calculateCategoryScore(matrix, 0),
                hiatus: calculateCategoryScore(matrix, 1),
                general: calculateCategoryScore(matrix, 2)
            };

            const newMistakes = await updateMistakes();
            updateSessionStorageWithResultsAndErrors(results, newMistakes);

            if (iteration + 1 != maxIterations) {
                setNewWords(true);
            } else {
                setProgress(100);
                setIsTraining(false);
                setIsTurningIn(true);
                setCurrentWordIndex(12);
            }

            setIteration(iteration + 1);

        } catch (error) {
            console.error('Error:', error);
            alert(t('errorTraining')); // Show an alert to the user
            window.location.reload(); // Reload the page
        }
    };

    const updateSessionStorageWithResultsAndErrors = (results, newMistakes) => {
        const iterationKey = `iteration${iteration + 1}`;
        const existingData = JSON.parse(getFromSessionStorage('iterationData'));
        existingData[iterationKey] = {
            results: results,
            errors: newMistakes.reduce((acc, mistake) => {
                acc[mistake[0]] = mistake.slice(1);
                return acc;
            }, {})
        };
        saveToSessionStorage('iterationData', JSON.stringify(existingData));
    };

    const handleTestModel = async (selectedModelNames) => {
        try {
            const response = await fetch(`${global.BASE_URL}/models/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model_names: selectedModelNames }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const processedData = data.map((modelResult) => ({
                model: modelResult.model,
                accuracy: modelResult.accuracy,
                loss: modelResult.loss,
            }));

            if (processedData.length > 0) {
                if (iteration + 1 === maxIterations) {
                    updateScore(processedData[0].accuracy.toFixed(2)); // Upload the score to the database
                    saveToSessionStorage('loggedInScore', processedData[0].accuracy.toFixed(2)); // Update the score in sessionStorage
                }
            }
        } catch (error) {
            console.error('Failed to fetch model evaluation results:', error);
        }
    };

    const updateMistakes = async () => {
        // Find mistakes by comparing newAnswer with newBatch, ignoring case
        const newMistakes = newBatch.map(([word, correctLabel], index) => {
            const [, inputLabel] = newAnswer[index];
            if (inputLabel.toUpperCase() !== correctLabel.toUpperCase()) {
                return [word, inputLabel.toUpperCase(), correctLabel.toUpperCase()];
            }
            return null;
        }).filter(mistake => mistake !== null); // Filter out null values (no mistakes)

        // Retrieve the current mistakes from session storage, if any
        const currentMistakes = getFromSessionStorage('mistakes') ? JSON.parse(getFromSessionStorage('mistakes')) : [];
        const updatedMistakes = [...currentMistakes, ...newMistakes];
        saveToSessionStorage('mistakes', JSON.stringify(updatedMistakes));

        // Upload the mistakes to the database
        const classCode = getFromSessionStorage('loggedInClassCode');
        const response = await fetch(`${global.BASE_URL}/update-errors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mistakes: newMistakes, classCode }), // Send only newMistakes to the server
        });

        if (!response.ok) {
            console.error('Failed to update errors in the database');
        }

        // Return the new mistakes
        return newMistakes;
    };

    // Function to find the next non-set word index
    const findNextNonSetWordIndex = (updatedNewAnswer) => {
        for (let i = 0; i < updatedNewAnswer.length; i++) {
            if (updatedNewAnswer[i][1] === '') {
                return i;
            }
        }
        return 11; // Return 0 if no non-set word is found
    };

    const handleButtonClick = (label) => {
        if (isTurningIn || isTraining) {
            return;
        }
        // Disable buttons to prevent further interaction
        setIsAnimating(true);

        // Add the class for the old word animation
        setAnimationClass('move-old' + (label === 'H' ? ' hiatus' : label === 'D' ? ' diphthong' : label === 'G' ? ' general' : ''));

        // Delay the update to match the transition duration
        setTimeout(() => {
            const updatedNewAnswer = [...newAnswer];
            updatedNewAnswer[currentWordIndex] = [newBatch[currentWordIndex][0], label];

            setCurrentWordIndex(findNextNonSetWordIndex(updatedNewAnswer));

            if (currentWordIndex != 11) {
                setNewAnswer(updatedNewAnswer);
            }

            // Add the class for the new word animation
            setAnimationClass('move-new');
            setIsAnimating(false);
        }, 270); // 270ms is the duration of the transition
    };

    const handleExternalClick = () => {
        // Disable buttons to prevent further interaction
        setIsAnimating(true);

        // Add the class for the old word animation
        setAnimationClass('move-old nothing');

        // Delay the update to match the transition duration
        setTimeout(() => {
            setCurrentWordIndex(ExternalCurrentWordIndex);
            // Add the class for the new word animation
            setAnimationClass('move-new');
            setIsAnimating(false);
        }, 270);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'W' || event.key === 'w') {
                if (isTraining || iteration >= maxIterations) return;
                if (currentWordIndex === 11) {
                    handleAnswerSubmit(newAnswer);
                    return;
                }
                const [, label] = newBatch[currentWordIndex];
                handleButtonClick(label.toUpperCase());
            } else if (event.key === 'D' || event.key === 'd') {
                handleButtonClick('D');
            }
            else if (event.key === 'H' || event.key === 'h') {
                handleButtonClick('H');
            }
            else if (event.key === 'G' || event.key === 'g') {
                handleButtonClick('G');
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [newBatch, currentWordIndex, handleButtonClick]);


    return (
        <div className='h-full'>
            <div>
                {newBatch[0] && (
                    <div className='grid lg:grid-rows-5 grid-rows-2'>
                        <div className='hidden lg:block lg:row-span-1'></div>

                        <div className='row-span-2 allow-info-overflow'>

                            <div className={`info-button ${currentWordIndex > 10 ? 'hidden' : ''}`}>
                                i
                                <div className='block lg:hidden'>
                                    <div className="tooltip bottom left">
                                        <div style={{ fontWeight: '400' }}>{t('info-play')}</div>
                                    </div>
                                </div>

                                <div className='hidden lg:block'>
                                    <div className="tooltip top left">
                                        <div style={{ fontWeight: '400' }}>{t('info-play')}</div>
                                    </div>
                                </div>
                            </div>

                            <h1 className={`text-center ${isTraining ? 'trainingIn' : 'trainingOut'}`} style={{ position: 'absolute' }}>
                                {t('training')}{'.'.repeat(periods)}
                            </h1>

                            <div className={`grid grid-rows-2 grid-cols-3 ${isTraining ? 'buttonsOut' : 'buttonsIn'}`} style={{ position: 'relative' }}>
                                <div className='col-span-full justify-center word-container'>
                                    <div className="word-container align-text-bottom">
                                        <div className='hidden md:block lg:hidden text-3xl opacity-0 h-0'> aaaaaaaaaaaaaaaaaaaaaaaaa</div>
                                        <div className='block md:hidden lg:hidden text-3xl opacity-0 h-0'> aaaaaaaaaa</div>
                                        {currentWordIndex === 11 ? (
                                            <h1 className={`word ${animationClass}`}>
                                                <div className='hidden md:block lg:block'>{t('train?')} </div>
                                                <div className='block md:hidden lg:hidden'>{t('trainShort?')} </div>
                                            </h1>
                                        ) : currentWordIndex === 12 ? (
                                            <h1 className={`word ${animationClass}`}>
                                                <div className='hidden md:block lg:block'>{t('turnIn?')} </div>
                                                <div className='block md:hidden lg:hidden'>{t('turnInShort?')} </div>
                                            </h1>
                                        ) : (
                                            <h1 className={`word ${animationClass}`}>{newBatch[currentWordIndex][0]}</h1>
                                        )}

                                    </div>
                                </div>

                                <div ref={shrinkSpace} className='grid grid-cols-3 col-span-3 justify-center w-full mt-0 lg:mt-4'>

                                    <div ref={shrinkButton} onClick={() => handleAnswerSubmit(newAnswer)} className={`grid mb-5 lg:mb-0 grid-cols-3 col-span-3 turnInContainer ${isTurningIn ? 'buttonsShrink' : 'buttonsShrink2'}`} style={{ maxHeight: '3.25rem' }}>

                                        <div className={`animated-button-text ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`} disabled={isTurningIn || isTraining} style={{ position: 'absolute', justifySelf: 'center', alignSelf: 'center' }}>
                                            {currentWordIndex === 11 && t('okTrain')}
                                            {currentWordIndex === 12 && t('okTurnIn')}
                                        </div>

                                        <div className={`animated-button-bg ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`}></div>

                                        <button onClick={() => handleButtonClick('D')} disabled={isAnimating || isTurningIn} className={`animated-button-diphthong p-2 text-center`}>
                                            <div className={`animated-button-bg-diphthong ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('diphthong')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('d')}
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('H')} disabled={isAnimating} className={`animated-button-hiatus p-2 text-center`}>
                                            <div className={`animated-button-bg-hiatus ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('hiatus')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('h')}
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('G')} disabled={isAnimating || isTurningIn} className={`animated-button-general p-2 text-center`}>
                                            <div className={`animated-button-bg-general ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('general')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`} style={{ opacity: textOpacity }}>
                                                {t('g')}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`block lg:row-span-2 ${isTurningIn && !isTraining ? 'buttonsOut' : 'buttonsIn'}`}>
                            <div className="flex row-span-2 justify-center lg:mt-12">
                                <div className="type-score-bar-container diphthong">
                                    <div className='type-score-bar-text-white'>{t('d')}</div>
                                    <div className="type-score-bar diphthong" style={{ height: `${diphthongScore}%` }}></div>
                                    <div className="type-score-bar hide" style={{ height: diphthongScore > 95 ? "0%" : `${100 - diphthongScore}%` }}>
                                        <div className='type-score-bar-text-black'>{t('d')}</div>
                                    </div>
                                </div>


                                <div className="type-score-bar-container hiatus">
                                    <div className='type-score-bar-text-white'>{t('h')}</div>
                                    <div className="type-score-bar hiatus" style={{ height: `${hiatusScore}%` }}></div>
                                    <div className="type-score-bar hide" style={{ height: hiatusScore > 95 ? "0%" : `${100 - hiatusScore}%` }}>
                                        <div className='type-score-bar-text-black'>{t('h')}</div>
                                    </div>
                                </div>


                                <div className="type-score-bar-container general">
                                    <div className='type-score-bar-text-white'>{t('g')}</div>
                                    <div className="type-score-bar general" style={{ height: `${generalScore}%` }}></div>
                                    <div className="type-score-bar hide" style={{ height: generalScore > 95 ? "0%" : `${100 - generalScore}%` }}>
                                        <div className='type-score-bar-text-black'>{t('g')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

export default PlayWordSelector;