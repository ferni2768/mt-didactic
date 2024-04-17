import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import diphthongsData from './diptongos.csv';
import hiatusesData from './hiatos.csv';
import generalsData from './general.csv';

// This file contains utility functions to fetch and parse data from CSV files
function useDataFetcher() {
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

        loadDataAndSetState(); // Load the files
    }, []);


    // Function that processes the training data and returns a shuffled array of 10 recommended words
    const processTrainingData = (response) => {
        return shuffleArray(selectNewWords(detectErrors(response)));
    };

    const parseCSV = (data, type) => {
        return new Promise((resolve, reject) => {
            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const tuples = results.data.map(row => [row.PALABRA, type]);
                    resolve(tuples);
                },
                error: function (error) {
                    console.error("Error parsing CSV:", error);
                    reject(error);
                }
            });
        });
    };

    const loadData = async (url, type) => {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const tuples = await parseCSV(text, type);
            return tuples;
        } catch (error) {
            console.error("Error loading data:", error);
            throw error; // Rethrow the error to handle it in the calling function
        }
    };

    // Function to shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Function that detects the errors in the training data
    const detectErrors = (data) => {
        const errorCounts = { "d": 0, "h": 0, "g": 0 };
        data.forEach(tuple => {
            if (tuple[0] !== tuple[1]) {
                errorCounts[tuple[1]]++;
            }
        });
        console.log(errorCounts);
        return errorCounts;
    };

    // Function that selects new recommended words based on the errors of the preious ones
    const selectNewWords = (errorCounts) => {
        // Sort categories by error counts in descending order
        const sortedCategories = Object.keys(errorCounts).sort((a, b) => errorCounts[b] - errorCounts[a]);
        const categories = { "d": diphthongs, "h": hiatuses, "g": generals };
        let selectedWords = [];

        // Ensure all categories are present in the categories object
        if (!sortedCategories.every(category => categories[category] !== undefined)) {
            console.error('One or more categories are missing in the categories object.');
            return selectedWords;
        }

        // Shuffle each category before selecting words
        const shuffledCategories = sortedCategories.map(category => ({
            category,
            shuffledWords: shuffleArray(categories[category])
        }));

        if (shuffledCategories.length === 3 && errorCounts[shuffledCategories[0].category] !== errorCounts[shuffledCategories[1].category] && errorCounts[shuffledCategories[1].category] !== errorCounts[shuffledCategories[2].category]) {
            // No tie between the top three
            selectedWords = selectedWords.concat(
                shuffledCategories[0].shuffledWords.slice(0, 5), // Most elements from the category with the most errors
                shuffledCategories[1].shuffledWords.slice(0, 3), // Subsequently 3 elements from the second most error-prone category
                shuffledCategories[2].shuffledWords.slice(0, 2) // And 2 elements from the third most error-prone category
            );
        } else if (errorCounts[shuffledCategories[0].category] === errorCounts[shuffledCategories[1].category] && errorCounts[shuffledCategories[1].category] !== errorCounts[shuffledCategories[2].category]) {
            // Tie between the top two
            selectedWords = selectedWords.concat(
                shuffledCategories[0].shuffledWords.slice(0, 4), // Most elements from the categories with the most errors
                shuffledCategories[1].shuffledWords.slice(0, 4), // Subsequently 4 elements from the categories with the most errors
                shuffledCategories[2].shuffledWords.slice(0, 2) // And 2 elements from the category with the least errors in this tie
            );
        } else if (errorCounts[shuffledCategories[1].category] === errorCounts[shuffledCategories[2].category] && errorCounts[shuffledCategories[0].category] !== errorCounts[shuffledCategories[1].category]) {
            // Tie in the bottom
            selectedWords = selectedWords.concat(
                shuffledCategories[0].shuffledWords.slice(0, 4), // Most elements from the category with the most errors
                shuffledCategories[1].shuffledWords.slice(0, 3), // Subsequently 3 elements from the category with the second most errors
                shuffledCategories[2].shuffledWords.slice(0, 3) // And 3 elements from the category with the third most errors
            );
        } else {
            // Tie among all three or other scenarios, return a random selection
            selectedWords = shuffleArray([...shuffledCategories[0].shuffledWords, ...shuffledCategories[1].shuffledWords, ...shuffledCategories[2].shuffledWords]).slice(0, 10);
        }

        return selectedWords;
    };

    return { selectedElements, processTrainingData };

}

export default useDataFetcher;
