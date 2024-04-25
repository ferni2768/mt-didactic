import React, { useEffect, useState } from 'react';
import useDataFetcher from './database/dataFetcher'; // To fetch the data from the csv files

function PlayWordSelector({ updateScore, setProgress, setWords }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0); // To keep track of the current word index
    const [selectedModel] = useState('model1'); // Default model for development
    const [iteration, setIteration] = useState(0); // To keep track of the training iterations

    const [newBatch, setNewBatch] = useState([]); // To store the new batch of recommended words
    const [newAnswer, setNewAnswer] = useState([]); // To store the input answers
    const [newWords, setNewWords] = useState(false); // To trigger the new batch of words

    const [trainingData, setTrainingData] = useState([]);
    const [testResults, setTestResults] = useState("");
    const { selectedElements, processTrainingData } = useDataFetcher();

    const [animationClass, setAnimationClass] = useState(''); // To trigger the transition animation between words
    const [isAnimating, setIsAnimating] = useState(false);


    useEffect(() => {
        // Initialize newBatch with a random set of 10 words
        setNewBatch(selectedElements);


        if (newWords) {
            const updatedNewBatch = processTrainingData(trainingData); // Assuming trainingData is accessible here
            setNewBatch(updatedNewBatch);
            console.log('Updated NewBatch:', updatedNewBatch);
            setCurrentWordIndex(0);
            setNewWords(false);
            setIteration(iteration + 1);
            setProgress((iteration + 1) * 20); // Update the student's progress by 20% for each iteration
        }
    }, [selectedElements, trainingData]);

    useEffect(() => {
        setNewAnswer(newBatch.map(([word, label]) => [word, '']));
    }, [newBatch]);

    useEffect(() => {
        setWords(newAnswer);
    }, [newAnswer]);


    const handleAnswerSubmit = async (newAnswer) => {
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
                console.log(`Training Result ${i + 1}:`, data);

                // Transform the data to the desired format
                const transformedData = data.map(item => [item[1], item[2]]);

                // Update the trainingData state with the transformed data
                setTrainingData(transformedData);
            }

            handleTestModel([selectedModel]);
            setNewWords(true);

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

    const handleButtonClick = (label) => {
        // Disable buttons to prevent further interaction
        setIsAnimating(true);

        setAnimationClass('move-old' + (label === 'H' ? ' hiatus' : label === 'D' ? ' diphthong' : label === 'G' ? ' general' : ''));


        // Delay the update to match the transition duration
        setTimeout(() => {
            const updatedNewAnswer = [...newAnswer];
            updatedNewAnswer[currentWordIndex] = [newBatch[currentWordIndex][0], label];
            setCurrentWordIndex(currentWordIndex + 1);

            if (currentWordIndex + 1 === 10) {
                handleAnswerSubmit(updatedNewAnswer); // Submit the answers
            }

            setNewAnswer(updatedNewAnswer);

            // Add the class for the new word animation
            setAnimationClass('move-new');
            setIsAnimating(false);
        }, 305);
    };



    const getScoreFromTestResults = () => {
        const match = testResults.match(/Accuracy: (\d+\.\d+)%/);
        if (match && match[1]) {
            // Convert the percentage to a score
            return parseFloat(match[1]);
        }
        return 0; // Default score if no match is found
    };


    return (
        <div className='h-full'>
            <div>
                {currentWordIndex < 10 && newBatch[currentWordIndex] && (
                    <div className='grid lg:grid-rows-5 grid-rows-2'>
                        <div className='hidden lg:block lg:row-span-1'></div>
                        <div className='row-span-2'>
                            <div className='grid grid-rows-2 grid-cols-3'>
                                <div className='col-span-full justify-center word-container'>
                                    <div className="word-container">
                                        <h1 className={`word ${animationClass}`}>{newBatch[currentWordIndex][0]}</h1>
                                    </div>
                                </div>

                                <button onClick={() => handleButtonClick('D')} disabled={isAnimating} className="animated-button-diphthong p-2 text-center mt-4">
                                    <div className="animated-button-bg-diphthong"></div>
                                    <div className="hidden lg:block md:block animated-button-text">
                                        Diphthong
                                    </div>
                                    <div className="lg:hidden md:hidden animated-button-text">
                                        D
                                    </div>
                                </button>

                                <button onClick={() => handleButtonClick('H')} disabled={isAnimating} className="animated-button-hiatus p-2 text-center mt-4">
                                    <div className="animated-button-bg-hiatus"></div>
                                    <div className="hidden lg:block md:block animated-button-text">
                                        Hiatus
                                    </div>
                                    <div className="lg:hidden md:hidden animated-button-text">
                                        H
                                    </div>
                                </button>

                                <button onClick={() => handleButtonClick('G')} disabled={isAnimating} className="animated-button-general p-2 text-center mt-4">
                                    <div className="animated-button-bg-general"></div>
                                    <div className="hidden lg:block md:block animated-button-text">
                                        General
                                    </div>
                                    <div className="lg:hidden md:hidden animated-button-text">
                                        G
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className='hidden lg:block lg:row-span-1'></div>
                        <div className='lg:block lg:row-span-1'>
                            <button> {testResults || "Test Results"}</button>
                            <button onClick={() => updateScore(getScoreFromTestResults())}>Turn In</button>
                        </div>
                    </div>
                )}
                {currentWordIndex === 10 && (
                    <div>
                        Waiting for the next batch...
                    </div>
                )}
            </div>

            {
                iteration === 5 && (
                    <button onClick={() => updateScore(getScoreFromTestResults())}>Turn In</button>
                )
            }
        </div >
    );
}

export default PlayWordSelector;