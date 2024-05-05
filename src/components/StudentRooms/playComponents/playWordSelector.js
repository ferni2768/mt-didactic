import React, { useEffect, useState, useRef } from 'react';
import useDataFetcher from './dataFetcher'; // To fetch the data from the csv files
import { useTranslation } from 'react-i18next';

function PlayWordSelector({ updateScore, setProgress, setWords, ExternalCurrentWordIndex, ExternalCurrentWordIndexChange,
    setExternalIsTraining, maxIterations, iteration, setIteration, navigate, matrix, classCode }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0); // To keep track of the current word index
    const [isTurningIn, setIsTurningIn] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [buttonWait, setButtonWait] = useState(true);

    const trainingIterations = 5; // Number of iterations to train the model

    const [selectedModel,] = useState(() => {
        // Get the name of the model that the student is going to train
        const loggedInStudent = sessionStorage.getItem('loggedInStudent');
        return loggedInStudent ? JSON.parse(loggedInStudent).model : '';
    });

    const [newAnswer, setNewAnswer] = useState([]); // To store the input answers
    const [newWords, setNewWords] = useState(false); // To trigger the new batch of words
    const [trainingData, setTrainingData] = useState([]);
    const { selectedElements, processTrainingData, processTrainingDataMatrix } = useDataFetcher();

    const [animationClass, setAnimationClass] = useState(''); // To trigger the transition animation between words
    const [isAnimating, setIsAnimating] = useState(false);
    const [periods, setPeriods] = useState(3); // Periods in training text

    const shrinkButton = useRef(null);
    const shrinkSpace = useRef(null);

    const [newBatch, setNewBatch] = useState(() => {
        // To store the new batch of recommended words
        const storedNewBatch = sessionStorage.getItem('newBatch');
        return storedNewBatch ? JSON.parse(storedNewBatch) : [];
    });

    const { t } = useTranslation();


    useEffect(() => {
        if (currentWordIndex > 10 || parseInt(sessionStorage.getItem('iteration'), 10) >= maxIterations) {
            setIsTurningIn(true);
        } else {
            setIsTurningIn(false);
        }
    }, [currentWordIndex]);

    // Save the iteration and newBatch to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('iteration', iteration);
    }, [iteration]);

    useEffect(() => {
        sessionStorage.setItem('newBatch', JSON.stringify(newBatch));
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
        if (parseInt(sessionStorage.getItem('iteration'), 10) >= maxIterations) {
            setProgress(100);
            setExternalIsTraining(true);
            setIsTraining(false);
            setIsTurningIn(true);
            setCurrentWordIndex(12);
            return;
        }

        if (!newWords && (!sessionStorage.getItem('newBatch') || JSON.parse(sessionStorage.getItem('newBatch')).length === 0)) {
            setNewBatch(selectedElements);
        }

        if (newWords) {
            const updatedNewBatch = processTrainingDataMatrix(matrix);
            setNewBatch(updatedNewBatch); // Set new batch of words
            setCurrentWordIndex(0);
            setNewWords(false);
        }
    }, [matrix]);

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


    const handleAnswerSubmit = async (newAnswer) => {
        if (!isTurningIn || buttonWait) return;

        if (iteration == maxIterations) {
            navigate(`/student/${sessionStorage.getItem('loggedInClassCode')}/results`); // Redirect to the results page
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

        console.log(answersObj);

        const url = `${global.BASE_URL}/models/${selectedModel}/train`;
        const config = {
            method: 'post',
            body: JSON.stringify({ answers: answersObj, maxIterations: maxIterations }),
            headers: { 'Content-Type': 'application/json' }
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // Transform the data to the desired format
            const transformedData = data.map(item => [item[1], item[2]]);

            // Update the trainingData state with the transformed data
            setTrainingData(transformedData);

            await handleTestModel([selectedModel]);

            // Update the session storage with the mistakes
            updateMistakesInSessionStorage();

            if (iteration + 1 != maxIterations) {
                setProgress((iteration + 1) * (100 / maxIterations)); // Update the student's progress for each iteration
                setNewWords(true);
                setIsTraining(false);
                setIsTurningIn(false);
                setCurrentWordIndex(0);
                setExternalIsTraining(false);
            } else {
                setProgress(100);
                setIsTraining(false);
                setIsTurningIn(true);
                setCurrentWordIndex(12);
            }

            setIteration(iteration + 1);

        } catch (error) {
            console.error('Error:', error);
        }
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
                    sessionStorage.setItem('loggedInScore', processedData[0].accuracy.toFixed(2)); // Update the score in sessionStorage
                }
            }
        } catch (error) {
            console.error('Failed to fetch model evaluation results:', error);
        }
    };

    const updateMistakesInSessionStorage = () => {
        // Retrieve the current mistakes from session storage, if any
        const currentMistakes = sessionStorage.getItem('mistakes') ? JSON.parse(sessionStorage.getItem('mistakes')) : [];

        // Find mistakes by comparing newAnswer with newBatch, ignoring case
        const newMistakes = newBatch.map(([word, correctLabel], index) => {
            const [, inputLabel] = newAnswer[index];
            // Convert both labels to lowercase before comparing
            if (inputLabel.toUpperCase() !== correctLabel.toUpperCase()) {
                // Convert both labels to lowercase before adding to mistakes
                return [word, inputLabel.toUpperCase(), correctLabel.toUpperCase()];
            }
            return null; // No mistake for this word
        }).filter(mistake => mistake !== null); // Filter out null values (no mistakes)

        // Combine the current mistakes with the new mistakes
        const updatedMistakes = [...currentMistakes, ...newMistakes];

        // Update the session storage with the updated mistakes array
        sessionStorage.setItem('mistakes', JSON.stringify(updatedMistakes));
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
                        <div className='row-span-2'>
                            <h1 className={`text-center ${isTraining ? 'trainingIn' : 'trainingOut'}`} style={{ position: 'absolute' }}>
                                {t('training')}{'.'.repeat(periods)}
                            </h1>
                            <div className={`grid grid-rows-2 grid-cols-3 ${isTraining ? 'buttonsOut' : 'buttonsIn'}`} style={{ position: 'relative' }}>
                                <div className='col-span-full justify-center word-container'>
                                    <div className="word-container">
                                        {currentWordIndex === 11 ? (
                                            <h1 className={`word ${animationClass}`}> {t('train?')} </h1>
                                        ) : currentWordIndex === 12 ? (
                                            <h1 className={`word ${animationClass}`}> {t('turnIn?')} </h1>
                                        ) : (
                                            <h1 className={`word ${animationClass}`}>{newBatch[currentWordIndex][0]}</h1>
                                        )}

                                    </div>
                                </div>

                                <div ref={shrinkSpace} className='grid grid-cols-3 col-span-3 justify-center mt-4 w-full'>

                                    <div ref={shrinkButton} onClick={() => handleAnswerSubmit(newAnswer)} className={`grid mb-5 lg:mb-0 grid-cols-3 col-span-3 turnInContainer ${isTurningIn ? 'buttonsShrink' : 'buttonsShrink2'}`} style={{ maxHeight: '3.5rem' }}>

                                        <div className={`animated-button-text ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`} disabled={isTurningIn || isTraining} style={{ position: 'absolute', justifySelf: 'center', alignSelf: 'center' }}>
                                            {currentWordIndex === 11 && t('okTrain')}
                                            {currentWordIndex === 12 && t('okTurnIn')}
                                        </div>

                                        <div className={`animated-button-bg ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`}></div>

                                        <button onClick={() => handleButtonClick('D')} disabled={isAnimating || isTurningIn} className={`animated-button-diphthong p-2 text-center`}>
                                            <div className={`animated-button-bg-diphthong ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('diphthong')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('d')}
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('H')} disabled={isAnimating} className={`animated-button-hiatus p-2 text-center`}>
                                            <div className={`animated-button-bg-hiatus ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('hiatus')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('h')}
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('G')} disabled={isAnimating || isTurningIn} className={`animated-button-general p-2 text-center`}>
                                            <div className={`animated-button-bg-general  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('general')}
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                {t('g')}
                                            </div>
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='hidden lg:block lg:row-span-1'></div>
                    </div>
                )}
            </div>
        </div >
    );
}

export default PlayWordSelector;