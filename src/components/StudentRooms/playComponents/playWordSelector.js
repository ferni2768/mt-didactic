import React, { useEffect, useState } from 'react';
import useDataFetcher from './database/dataFetcher'; // To fetch the data from the csv files

function PlayWordSelector({ setAnswerCombos, setTrain }) {
    const [arrayToDisplay, setArrayToDisplay] = useState([]);
    const { processTrainingData } = useDataFetcher();

    // Test data
    // [InputLabel, PredictedLabel]
    const trainingData = [
        ["g", "h"], // h
        ["h", "h"], // NO
        ["d", "g"], // g
        ["g", "d"], // d
        ["h", "g"], // g
        ["d", "h"], // h
        ["g", "g"], // NO
        ["h", "h"], // NO
        ["d", "d"], // NO
        ["g", "h"]  // h
    ];

    useEffect(() => { }, []);

    return (
        <div>
            {/* Display the selected elements */}
            {arrayToDisplay.map((element, index) => (
                <div key={index}>{element[0]} - {element[1]}</div>
            ))}
            {/* Button to process trainingData */}
            <button onClick={() => setArrayToDisplay(processTrainingData(trainingData))}>Process Training Data</button>
        </div>
    );
}

export default PlayWordSelector;
