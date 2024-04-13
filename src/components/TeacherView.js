import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLogin from './TeacherRooms/TeacherLogin';
import TeacherWaitRoom from './TeacherRooms/TeacherWaitRoom';

function TeacherView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();
    const [classCode, setClassCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loggedInClassCode = localStorage.getItem('loggedInClassCode');
        if (loggedInClassCode) {
            setClassCode(loggedInClassCode);
            setIsAuthenticated(true);
            navigate(`/teacher/${loggedInClassCode}`);
        }

        if (urlClassCode) {
            setClassCode(urlClassCode);
        }
    }, [urlClassCode, navigate]);

    if (!isAuthenticated) {
        return <TeacherLogin setIsAuthenticated={setIsAuthenticated} navigate={navigate} classCode={classCode} setClassCode={setClassCode} />;
    }

    return <TeacherWaitRoom classCode={classCode} setIsAuthenticated={setIsAuthenticated} navigate={navigate} />;
}

export default TeacherView;
