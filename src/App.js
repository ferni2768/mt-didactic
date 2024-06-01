import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes, Navigate } from 'react-router-dom';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import TeacherPDF from './components/TeacherRooms/TeacherPDF';
import StudentPDF from './components/StudentRooms/StudentPDF';
import { TransitionProvider } from './visualComponents/TransitionContext';
import './App.css';
import './i18n/i18n'; // Translations from i18n.js
import { saveToSessionStorage, getFromSessionStorage } from './utils/storageUtils';

const { SERVER_URL, WEB_URL } = require('./config');

global.BASE_URL = SERVER_URL;
global.WEB_URL = WEB_URL;

const StorageContext = React.createContext();

function App() {
  return (
    <TransitionProvider>
      <Router>
        <div className="full-screen">
          <div className="App">
            <header className="App-header hidden">
              <nav>
                <ul>
                  <li>
                    <Link to="/student/ABC123">Student View</Link>
                  </li>
                  <li>
                    <Link to="/teacher/ABC123">Teacher View</Link>
                  </li>
                </ul>
              </nav>
            </header>

            <StorageContext.Provider value={{ saveToSessionStorage, getFromSessionStorage }}>
              <Routes>
                <Route path="/student" element={<StudentView />} />
                <Route path="/student/:classCode" element={<StudentView />} />
                <Route path="/student/:classCode/results" element={<StudentView />} />
                <Route path="/teacher" element={<TeacherView />} />
                <Route path="/teacher/:classCode" element={<TeacherView />} />
                <Route path="/teacher/:classCode/results" element={<TeacherView />} />
                <Route path="/pdf" element={<TeacherPDF />} />
                <Route path="/pdf2" element={<StudentPDF />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
              </Routes>
            </StorageContext.Provider>
          </div>
        </div>
      </Router>
    </TransitionProvider>
  );
}

export default App;
