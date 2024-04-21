import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import './App.css';

function App() {
  return (
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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
