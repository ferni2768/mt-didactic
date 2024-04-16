import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentJoin from './StudentRooms/StudentJoin';
import StudentPlay from './StudentRooms/StudentPlay';
import StudentResults from './StudentRooms/StudentResults';

function StudentView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const loggedInClassCode = sessionStorage.getItem('loggedInClassCode');
        const loggedInStudent = sessionStorage.getItem('loggedInStudent');
        const loggedInScore = sessionStorage.getItem('loggedInScore');

        if (loggedInClassCode && loggedInClassCode !== urlClassCode) {
            navigate(`/student/${loggedInClassCode}`); // Redirect to the correct class code
        }

        if (loggedInClassCode && loggedInStudent && loggedInScore) {
            navigate(`/student/${loggedInClassCode}/results`);
        } else if (loggedInClassCode && loggedInStudent) {
            sessionStorage.setItem('loggedInClassCode', loggedInClassCode);
            navigate(`/student/${loggedInClassCode}`);
        }

    }, [urlClassCode, navigate]);

    if (!sessionStorage.getItem('loggedInStudent')) {
        return <StudentJoin navigate={navigate} classCode={urlClassCode} />;
    }

    if (sessionStorage.getItem('loggedInStudent') && !sessionStorage.getItem('loggedInScore')) {
        return <StudentPlay navigate={navigate} classCode={urlClassCode} />;
    }

    return <StudentResults navigate={navigate} classCode={urlClassCode} />;
}

export default StudentView;
