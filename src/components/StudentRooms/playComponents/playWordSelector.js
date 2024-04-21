import React, { useEffect, useState } from 'react';
import useDataFetcher from './database/dataFetcher'; // To fetch the data from the csv files

function PlayWordSelector({ updateScore, setProgress }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0); // To keep track of the current word index
    const [selectedModel] = useState('model1'); // Default model for development
    const [iteration, setIteration] = useState(0); // To keep track of the training iterations

    const [newBatch, setNewBatch] = useState([]); // To store the new batch of recommended words
    const [newAnswer, setNewAnswer] = useState([]); // To store the input answers
    const [newWords, setNewWords] = useState(false); // To trigger the new batch of words

    const [trainingData, setTrainingData] = useState([]);
    const [testResults, setTestResults] = useState("");
    const { selectedElements, processTrainingData } = useDataFetcher();


    useEffect(() => {
        // Initialize newBatch with a random set of 10 words
        setNewBatch(selectedElements);
        // Initialize newAnswer with an empty array of size 10
        setNewAnswer(Array(10).fill(['', '']));

        if (newWords) {
            const updatedNewBatch = processTrainingData(trainingData); // Assuming trainingData is accessible here
            setNewBatch(updatedNewBatch);
            console.log('Updated NewBatch:', updatedNewBatch);
            setNewAnswer(Array(10).fill(['', '']));
            setCurrentWordIndex(0);
            setNewWords(false);
            setIteration(iteration + 1);
            setProgress((iteration + 1) * 20); // Update the student's progress by 20% for each iteration
        }
    }, [selectedElements, trainingData, iteration, newWords, processTrainingData, setProgress]);


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
        const updatedNewAnswer = [...newAnswer];
        updatedNewAnswer[currentWordIndex] = [newBatch[currentWordIndex][0], label];
        setCurrentWordIndex(currentWordIndex + 1);

        console.log(updatedNewAnswer);

        if (currentWordIndex + 1 === 10) {
            handleAnswerSubmit(updatedNewAnswer); // Submit the answers
        }

        setNewAnswer(updatedNewAnswer);
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
        <div>
            {currentWordIndex < 10 && newBatch[currentWordIndex] && (
                <div>
                    <h1>{newBatch[currentWordIndex][0]}</h1>
                    <button onClick={() => handleButtonClick('D')}>Diphthong</button>
                    <button onClick={() => handleButtonClick('H')}>Hiatus</button>
                    <button onClick={() => handleButtonClick('G')}>General</button>
                </div>
            )}
            {currentWordIndex === 10 && (
                <div>
                    Waiting for the next batch...
                </div>
            )}
            <br /> <br />
            <button> {testResults || "Test Results"}</button>
            {iteration === 5 && (
                <button onClick={() => updateScore(getScoreFromTestResults())}>Turn In</button>
            )}
        </div>
    );
}

export default PlayWordSelector;