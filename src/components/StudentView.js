import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentJoin from './StudentRooms/StudentJoin';
import StudentPlay from './StudentRooms/StudentPlay';

function StudentView() {
    const { classCode: urlClassCode } = useParams();
    const navigate = useNavigate();
    const [classCode, setClassCode] = useState('');
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const loggedInClassCode = localStorage.getItem('loggedInStudentClassCode');
        if (loggedInClassCode) {
            setClassCode(loggedInClassCode);
            // For simplicity, return a dummy student object
            setStudent({ id: 1, name: 'student1', score: -1 });
            navigate(`/student/${loggedInClassCode}`);
        }

        if (urlClassCode) {
            setClassCode(urlClassCode);
        }
    }, [urlClassCode, navigate]);

    if (!student) {
        return <StudentJoin setStudent={setStudent} navigate={navigate} classCode={classCode} />;
    }

    return <StudentPlay student={student} setStudent={setStudent} navigate={navigate} />;
}

export default StudentView;
