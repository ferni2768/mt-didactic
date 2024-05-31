import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes, Navigate } from 'react-router-dom';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import TeacherPDF from './components/TeacherRooms/TeacherPDF';
import StudentPDF from './components/StudentRooms/StudentPDF';
import { TransitionProvider } from './visualComponents/TransitionContext';
import './App.css';
import './i18n/i18n'; // Translations from i18n.js
global.BASE_URL = 'http://127.0.0.1:3001'; // JavaScript server URL
global.WEB_URL = 'http://localhost:3000'; // React web URL

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
                    {/* Set classCode to speed up development */}
                    <Link to="/student/ABC123">Student View</Link>
                  </li>
                  <li>
                    {/* Set classCode to speed up development */}
                    <Link to="/teacher/ABC123">Teacher View</Link>
                  </li>
                </ul>
              </nav>
            </header>

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
          </div>
        </div>
      </Router>
    </TransitionProvider>
  );
}

export default App;
