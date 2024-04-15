import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li>
                {/* Set classCode to speed up development */}
                <Link to="/student/ABC123">Student View</Link>
              </li>
              <li>
                <Link to="/teacher">Teacher View</Link>
              </li>
            </ul>
          </nav>
        </header>

        <Routes>
          <Route path="/student" element={<StudentView />} />
          <Route path="/student/:classCode" element={<StudentView />} />
          <Route path="/teacher" element={<TeacherView />} />
          <Route path="/teacher/:classCode" element={<TeacherView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
