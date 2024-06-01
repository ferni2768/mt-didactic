const IP = `http://${process.env.REACT_APP_IP}`;
const BASE_PORT = process.env.REACT_APP_BASE_PORT;
const WEB_PORT = process.env.REACT_APP_WEB_PORT;
const EXTERNAL_API_PORT = process.env.REACT_APP_EXTERNAL_API_PORT;

const SERVER_URL = `${IP}:${BASE_PORT}`;
const WEB_URL = `${IP}:${WEB_PORT}`;
const API_URL = `${IP}:${EXTERNAL_API_PORT}`;

// Database config
const DB_HOST = process.env.REACT_APP_IP || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'root';
const DB_NAME = process.env.DB_NAME || 'tfg_db';

module.exports = {
    SERVER_URL,
    BASE_PORT,
    WEB_URL,
    API_URL,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
};