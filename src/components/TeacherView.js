import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLogin from './TeacherRooms/TeacherLogin';
import TeacherWaitRoom from './TeacherRooms/TeacherWaitRoom';
import TeacherResults from './TeacherRooms/TeacherResults';

function TeacherView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const createdClassCode = sessionStorage.getItem('createdClassCode');
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        const isFinished = sessionStorage.getItem('isFinished');

        if (createdClassCode && createdClassCode !== urlClassCode) {
            navigate(`/teacher/${createdClassCode}`); // Redirect to the correct class code
        }

        if (createdClassCode && createdClassCode && isFinished) {
            navigate(`/teacher/${createdClassCode}/results`);
        } else if (createdClassCode && isAuthenticated) {
            sessionStorage.setItem('createdClassCode', createdClassCode);
            navigate(`/teacher/${createdClassCode}`);
        }

    }, [urlClassCode, navigate]);

    if (!sessionStorage.getItem('isAuthenticated')) {
        return <TeacherLogin navigate={navigate} classCode={urlClassCode} />;
    }

    if (sessionStorage.getItem('isAuthenticated') && !sessionStorage.getItem('isFinished')) {
        return <TeacherWaitRoom navigate={navigate} classCode={urlClassCode} />;
    }

    return <TeacherResults navigate={navigate} classCode={urlClassCode} />;
}

export default TeacherView;
