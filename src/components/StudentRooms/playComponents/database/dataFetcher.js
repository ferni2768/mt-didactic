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

    const processTrainingDataMatrix = (response) => {
        return shuffleArray(selectNewWordsMatrix(detectErrorsMatrix(response)));
    };

    const adjustErrorCounts = (errorCounts) => {
        // Round the error counts to the nearest whole number
        const roundedCounts = Object.entries(errorCounts).map(([category, count]) => [category, Math.round(count)]);

        // Calculate the total of the rounded counts
        const totalRounded = roundedCounts.reduce((sum, [_, count]) => sum + count, 0);

        // Calculate how many points are left to distribute to reach a total of 10
        let pointsToDistribute = 10 - totalRounded;

        // Sort the categories by their rounded counts in descending order
        const sortedCounts = roundedCounts.sort((a, b) => b[1] - a[1]);

        // Distribute the remaining points to the categories with the highest rounded counts
        sortedCounts.forEach(([category, count], index) => {
            if (pointsToDistribute > 0) {
                const additionalPoints = Math.min(pointsToDistribute, 1);
                sortedCounts[index][1] += additionalPoints;
                pointsToDistribute -= additionalPoints;
            }
        });

        // Convert back to an object
        const adjustedCounts = Object.fromEntries(sortedCounts);

        return adjustedCounts;
    };

    const detectErrorsMatrix = (confusionMatrix) => {
        const errorCounts = { "d": 0, "h": 0, "g": 0 };
        const categories = ['d', 'h', 'g']; // Assuming 'd' for diphthongs, 'h' for hiatuses, and 'g' for generals

        // Calculate error counts for each category based on incorrect predictions
        confusionMatrix.forEach((row, i) => {
            row.forEach((value, j) => {
                if (i !== j) { // Exclude diagonal elements (correct predictions)
                    errorCounts[categories[i]] += value; // Use the row index to categorize the error
                }
            });
        });

        // Normalize error counts if total exceeds 10
        const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
        if (totalErrors > 10) {
            const normalizationFactor = 10 / totalErrors;
            Object.keys(errorCounts).forEach(category => {
                errorCounts[category] *= normalizationFactor;
            });
        }

        // Adjust the error counts to be integers and sum to 10
        const adjustedErrorCounts = adjustErrorCounts(errorCounts);


        // Convert to array of tuples, ensuring at most 10 elements
        const errorArray = Object.entries(adjustedErrorCounts).map(([category, count]) => [category, count]);

        console.log("HEEEERE ERRORRRRS", errorArray);
        return errorArray;
    };



    const selectNewWordsMatrix = (errorCountsArray) => {
        const categories = { "d": diphthongs, "h": hiatuses, "g": generals };
        let selectedWords = [];

        // Iterate over the errorCountsArray to select words based on the specified counts
        errorCountsArray.forEach(([category, count]) => {
            // Ensure the category is present in the categories object
            if (categories[category] !== undefined) {
                const shuffledWords = shuffleArray(categories[category]);
                // Select the specified number of words from the shuffled array
                selectedWords = selectedWords.concat(shuffledWords.slice(0, count));
            } else {
                console.error(`Category ${category} is missing in the categories object.`);
            }
        });

        // If the total number of selected words is less than 10, fill the rest with random words
        while (selectedWords.length < 10) {
            const randomCategory = errorCountsArray[Math.floor(Math.random() * errorCountsArray.length)][0];
            const shuffledWords = shuffleArray(categories[randomCategory]);
            selectedWords.push(shuffledWords[0]);
        }

        return selectedWords;
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

    return { selectedElements, processTrainingData, processTrainingDataMatrix };

}

export default useDataFetcher;
