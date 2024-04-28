import React, { useEffect, useState, useRef } from 'react';
import useDataFetcher from './database/dataFetcher'; // To fetch the data from the csv files

function PlayWordSelector({ updateScore, setProgress, setWords, ExternalCurrentWordIndex, ExternalCurrentWordIndexChange, setExternalIsTraining }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0); // To keep track of the current word index
    const [selectedModel,] = useState(() => {
        // Get the name of the model that the student is going to train
        const loggedInStudent = sessionStorage.getItem('loggedInStudent');
        return loggedInStudent ? JSON.parse(loggedInStudent).model : '';
    });
    const [iteration, setIteration] = useState(0); // To keep track of the training iterations

    const [newBatch, setNewBatch] = useState([]); // To store the new batch of recommended words
    const [newAnswer, setNewAnswer] = useState([]); // To store the input answers
    const [newWords, setNewWords] = useState(false); // To trigger the new batch of words

    const [trainingData, setTrainingData] = useState([]);
    const [testResults, setTestResults] = useState("");
    const { selectedElements, processTrainingData } = useDataFetcher();

    const [animationClass, setAnimationClass] = useState(''); // To trigger the transition animation between words
    const [isAnimating, setIsAnimating] = useState(false);
    const [isTurningIn, setIsTurningIn] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [periods, setPeriods] = useState(3); // Periods in training text

    const shrinkButton = useRef(null);
    const shrinkSpace = useRef(null);
    const maxIterations = 5; // Maximum training times


    useEffect(() => {
        if (currentWordIndex > 10) {
            setIsTurningIn(true);
        } else {
            setIsTurningIn(false);
        }
    }, [currentWordIndex]);

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
        // Initialize newBatch with a random set of 10 words
        if (!newWords) {
            setNewBatch(selectedElements);
        }

        if (newWords) {
            const updatedNewBatch = processTrainingData(trainingData);
            setNewBatch(updatedNewBatch); // Set new batch of words
            console.log('Updated NewBatch:', updatedNewBatch);
            setCurrentWordIndex(0);
            setNewWords(false);
        }
    }, [selectedElements, iteration]);

    useEffect(() => {
        handleExternalClick();
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
        if (!isTurningIn) return;

        if (iteration == maxIterations) {
            updateScore(getScoreFromTestResults());
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

        const url = `http://localhost:5000/models/${selectedModel}/train`;
        const config = { method: 'post', body: JSON.stringify(answersObj), headers: { 'Content-Type': 'application/json' } };

        try {
            // Loop to train the model 5 times
            for (let i = 0; i < 5; i++) {
                const response = await fetch(url, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();

                // Transform the data to the desired format
                const transformedData = data.map(item => [item[1], item[2]]);

                // Update the trainingData state with the transformed data
                setTrainingData(transformedData);
            }

            handleTestModel([selectedModel]);

            if (iteration + 1 != maxIterations) {
                setProgress((iteration + 1) * 20); // Update the student's progress by 20% for each iteration
                setNewWords(true);
                setIsTraining(false);
                setIsTurningIn(false);
                setCurrentWordIndex(0);
                setExternalIsTraining(false);
            } else {
                setProgress((iteration + 1) * 20); // Update the student's progress by 20% for each iteration
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
            const response = await fetch('http://127.0.0.1:5000/models/test', {
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
            console.log('API Response:', data);
            const processedData = data.map((modelResult) => ({
                model: modelResult.model,
                accuracy: modelResult.metrics.compile_metrics * 100,
                loss: modelResult.metrics.loss * 100,
            }));
            console.log('Processed Data for State:', processedData);

            if (processedData.length > 0) {
                setTestResults(`Accuracy: ${processedData[0].accuracy.toFixed(2)}%`);
            }
        } catch (error) {
            console.error('Failed to fetch model evaluation results:', error);
        }
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
        }, 270);
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

    const getScoreFromTestResults = () => {
        const match = testResults.match(/Accuracy: (\d+\.\d+)%/);
        if (match && match[1]) {
            // Convert the percentage to a number with two decimal places
            return parseFloat(match[1]).toFixed(2);
        }
        return "0.00"; // Default score if no match is found
    };


    return (
        <div className='h-full'>
            <div>
                {newBatch[0] && (
                    <div className='grid lg:grid-rows-5 grid-rows-2'>
                        <div className='hidden lg:block lg:row-span-1'></div>
                        <div className='row-span-2'>
                            <h1 className={`text-center ${isTraining ? 'trainingIn' : 'trainingOut'}`} style={{ position: 'absolute' }}>
                                Training{'.'.repeat(periods)}
                            </h1>
                            <div className={`grid grid-rows-2 grid-cols-3 ${isTraining ? 'buttonsOut' : 'buttonsIn'}`} style={{ position: 'relative' }}>
                                <div className='col-span-full justify-center word-container'>
                                    <div className="word-container">
                                        {currentWordIndex === 11 ? (
                                            <h1 className={`word ${animationClass}`}> Train? </h1>
                                        ) : currentWordIndex === 12 ? (
                                            <h1 className={`word ${animationClass}`}> Turn in </h1>
                                        ) : (
                                            <h1 className={`word ${animationClass}`}>{newBatch[currentWordIndex][0]}</h1>
                                        )}

                                    </div>
                                </div>

                                <div ref={shrinkSpace} className='grid grid-cols-3 col-span-3 justify-center mt-4 w-full'>

                                    <div ref={shrinkButton} onClick={() => handleAnswerSubmit(newAnswer)} className={`grid grid-cols-3 col-span-3 turnInContainer ${isTurningIn ? 'buttonsShrink' : 'buttonsShrink2'} `}>

                                        <div className={`animated-button-text ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`} disabled={isTurningIn || isTraining} style={{ position: 'absolute', justifySelf: 'center', alignSelf: 'center' }}>
                                            Turn In
                                        </div>

                                        <div className={`animated-button-bg ${isTurningIn ? 'turnInTransition2' : 'turnInTransition'}`}></div>

                                        <button onClick={() => handleButtonClick('D')} disabled={isAnimating || isTurningIn} className={`animated-button-diphthong p-2 text-center`}>
                                            <div className={`animated-button-bg-diphthong ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                Diphthong
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                D
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('H')} disabled={isAnimating} className={`animated-button-hiatus p-2 text-center`}>
                                            <div className={`animated-button-bg-hiatus ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                Hiatus
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                H
                                            </div>
                                        </button>

                                        <button onClick={() => handleButtonClick('G')} disabled={isAnimating || isTurningIn} className={`animated-button-general p-2 text-center`}>
                                            <div className={`animated-button-bg-general  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}></div>
                                            <div className={`hidden lg:block md:block animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                General
                                            </div>
                                            <div className={`lg:hidden md:hidden animated-button-text  ${isTurningIn ? 'turnInTransition' : 'turnInTransition2'}`}>
                                                G
                                            </div>
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='hidden lg:block lg:row-span-1'></div>
                        <div className='lg:block lg:row-span-1'>
                            {/* <div> {testResults || "[Test Results]"}</div> */}
                            {/* <button onClick={() => updateScore(getScoreFromTestResults())}>Turn In</button> */}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

export default PlayWordSelector;