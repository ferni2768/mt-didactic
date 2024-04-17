import React, { useEffect, useState } from 'react';
import { loadData } from './database/dataFetcher'; // To fetch the data from the csv files
import diphthongsData from './database/diptongos.csv';
import hiatusesData from './database/hiatos.csv';
import generalsData from './database/general.csv';

function PlayWordSelector({ setAnswerCombos, setTrain }) {
    const [diphthongs, setDiphthongs] = useState([]);
    const [hiatuses, setHiatuses] = useState([]);
    const [generals, setGenerals] = useState([]);
    const [selectedElements, setSelectedElements] = useState([]);

    useEffect(() => {
        const loadDataAndSetState = async () => {
            try {
                // Load the words from the csv files as tuples in the form of [word, label]
                const diphthongsTuples = await loadData(diphthongsData, 'd');
                const hiatusesTuples = await loadData(hiatusesData, 'h');
                const generalsTuples = await loadData(generalsData, 'g');

                setDiphthongs(diphthongsTuples);
                setHiatuses(hiatusesTuples);
                setGenerals(generalsTuples);

                // Combine and shuffle the arrays
                const combinedArray = [...diphthongsTuples, ...hiatusesTuples, ...generalsTuples];
                const shuffledArray = shuffleArray(combinedArray);

                // Select the first 10 elements
                const selected = shuffledArray.slice(0, 10);
                setSelectedElements(selected);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };

        loadDataAndSetState();
    }, []);

    // Function to shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };


    return (
        <div>
            {/* Display the selected elements */}
            {selectedElements.map((element, index) => (
                <div key={index}>{element[0]} - {element[1]}</div>
            ))}
        </div>
    );
}

export default PlayWordSelector;
