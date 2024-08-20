//////////////////////////// APP CONFIG ////////////////////////////

// http://localhost:3000
const WEB_URL = `${process.env.REACT_APP_STATIC_PAGE}`;
// http://localhost:3001
const SERVER_URL = `${process.env.REACT_APP_SERVER}`;
// http://localhost:8000
const API_URL = `${process.env.REACT_APP_AI}`;





////////////////////////// DATABASE CONFIG /////////////////////////

// localhost
const DB_HOST = `${process.env.DB_HOST}`;
const DB_USER = process.env.DB_USER || 'pupis';
const DB_PASSWORD = process.env.DB_PASSWORD || 'pupis';
const DB_NAME = process.env.DB_NAME || 'tfg_db';

module.exports = {
    SERVER_URL,
    WEB_URL,
    API_URL,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
};