import React, { useState, useEffect } from 'react';
import PlayWordSelector from './playComponents/playWordSelector';
const defaultAnswersObj = require('./dev/defaultAnswers');

function StudentPlay({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [answerCombos, setAnswerCombos] = useState([{ word: '', label: '' }]);
    const [train, setTrain] = useState(false);
    const [selectedModel] = useState('modelo4'); // Default model for development
    const [testResults, setTestResults] = useState();

    // If true, it submits the default answers object
    const dev = true;

    useEffect(() => {
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        setStudent(loggedInStudent);
    }, []);

    const updateScore = async () => {
        const defaultScore = 1000; // Default score
        try {
            await fetch(`http://localhost:3001/student/${student.id}/updateScore`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: defaultScore }) // Default score to database
            });
            sessionStorage.setItem('loggedInScore', defaultScore); // Default score to this keep in the session
            navigate(`/student/${classCode}/results`);
        } catch (error) {
            console.error('Error updating score:', error);
        }
    };

    const handleComboChange = (index, type, value) => {
        setAnswerCombos((prevCombos) => {
            const updatedCombos = [...prevCombos];
            if (type === 'word') {
                updatedCombos[index].word = value;
            } else if (type === 'label') {
                updatedCombos[index].label = value;
            }
            return updatedCombos;
        });
    };

    const handleAnswerSubmit = async () => {
        const answersObj = !dev ? {} : {};
        answerCombos.forEach((combo) => {
            if (combo.word.trim() !== '' && combo.label !== '') {
                answersObj[combo.word] = combo.label;
            }
        });

        // Use the 'answersObj' or 'defaultAnswersObj' based on the inverted 'dev' constant
        const answersToUse = !dev ? answersObj : defaultAnswersObj;

        console.log(answersToUse);

        const url = `http://localhost:5000/models/${selectedModel}/train`;
        const config = { method: 'post', body: JSON.stringify(answersToUse), headers: { 'Content-Type': 'application/json' } };

        try {
            // Loop to train the model 10 times
            for (let i = 0; i < 10; i++) {
                const response = await fetch(url, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Training Result ${i + 1}:`, data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };


    const handleTestModelClick = async (selectedModelNames) => {
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


    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('loggedInClassCode');
        sessionStorage.removeItem('loggedInStudent');
        sessionStorage.removeItem('loggedInScore');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <h1>Student View</h1>
            <p>This is the student view page.</p>
            <div>
                <h2>My Details:</h2>
                <div>ID: {student.id}</div>
                <div>Name: {student.name}</div>
                <div>Score: 0</div>
                <br />
                {student.score !== 1000 && (
                    <button onClick={updateScore}>Update Score</button>
                )}
                {student.score === 1000 && (
                    <p>Score Updated</p>
                )}
                <button onClick={handleReset}>Reset</button>
                <br /> <br /> <br />
                <PlayWordSelector setAnswerCombos={setAnswerCombos} setTrain={setTrain} />
                <br /> <br /> <br />
                <button onClick={handleAnswerSubmit}>Submit Answers</button> *Submitting a predefined set of answers
                <br /> <br />
                <button onClick={() => handleTestModelClick([selectedModel])}>{testResults || "Test Results"}</button>
            </div>
        </div>
    );
}

export default StudentPlay;
