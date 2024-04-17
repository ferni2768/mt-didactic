import Papa from 'papaparse';
// This file contains utility functions to fetch and parse data from CSV files

export const parseCSV = (data, type) => {
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

export const loadData = async (url, type) => {
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