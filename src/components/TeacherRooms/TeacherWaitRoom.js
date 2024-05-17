import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';

function TeacherWaitRoom({ navigate, classCode }) {
    const [students, setStudents] = useState([]);
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);

    const { t } = useTranslation();

    let completedStudents = 0;
    let totalStudents = 0;

    if (students) {
        // Calculate the number of students with progress of 100%
        completedStudents = students.filter(student => student.progress === 100).length;
        totalStudents = students.length;
    }

    Scrollbar.use(OverscrollPlugin);


    const initializeScrollbar = (ref) => {
        if (ref.current) {
            const scrollbar = Scrollbar.init(ref.current, {
                damping: 0.1,
                plugins: {
                    overscroll: {
                        enabled: true,
                        maxOverscroll: 50,
                        effect: 'bounce',
                        damping: 0.1
                    }
                }
            });
            scrollbar.track.xAxis.element.remove();
            return () => scrollbar.destroy();
        }
    };

    useEffect(() => initializeScrollbar(scrollbarRef), []);
    useEffect(() => initializeScrollbar(scrollbarRef2), []);

    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current, scrollbarRef2.current].forEach(ref => {
                if (ref) ref.style.pointerEvents = state;
            });
        };

        window.addEventListener('keydown', handleKeyEvents);
        window.addEventListener('keyup', handleKeyEvents);

        return () => {
            window.removeEventListener('keydown', handleKeyEvents);
            window.removeEventListener('keyup', handleKeyEvents);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'r' || event.key === 'R') {
                handleReset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch(`${global.BASE_URL}/students?classCode=${sessionStorage.getItem('createdClassCode')}`);
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents(); // Fetch students initially
        const intervalId = setInterval(fetchStudents, 3000); // Reload students every 3 seconds

        return () => clearInterval(intervalId);
    }, [classCode]);


    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('createdClassCode');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isFinished');
        navigate('/teacher/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    const seeResults = async () => {
        try {
            // Set the class phase to 2
            const response = await fetch(`${global.BASE_URL}/class/${sessionStorage.getItem('createdClassCode')}/setPhase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phase: 2 }),
            });

            if (response.ok) {
                sessionStorage.setItem('isFinished', true);
                navigate(`/teacher/${sessionStorage.getItem('createdClassCode')}/results`);
            } else {
                console.error('Error setting class phase:', response.statusText);
                alert('Error occurred while setting class phase');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while setting class phase');
        }
    };


    return (
        <div class="overflowY-container" ref={scrollbarRef2}>
            <div className="overflowY-container-inside">
                <div>
                    <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:h-80 gap-4'>

                            <div className="col-span-full md:col-span-full lg:col-span-1">
                                <h1>{t('listOfStudents')}</h1>
                                <p> {completedStudents}/{totalStudents} {t('studentsFinished')}

                                    <div className='allow-info-overflow block lg:hidden'>
                                        <div className="info-button mt-0.5">
                                            i
                                            <div className="tooltip top left">
                                                {t('info-results')}
                                            </div>
                                        </div>
                                    </div>
                                </p>
                                <p> {t('code')}: {sessionStorage.getItem('createdClassCode')} </p>

                                <button onClick={seeResults} className="animated-button p-2 text-center mt-4 align-bottom">
                                    <div className="animated-button-bg"></div>
                                    <div className="animated-button-text">
                                        {t('seeResults')}
                                    </div>
                                </button>

                                <div className='allow-info-overflow hidden lg:block'>
                                    <div className="info-button left mt-0.5">
                                        i
                                        <div className="tooltip bottom right">
                                            {t('info-results')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7">
                                <div className='contain'>
                                    <div className='inside-card-2-header text-white'> {/* Header */}
                                        <div className='hidden md:block lg:block'>{t('name')}</div>
                                        <div className='hidden md:block lg:block'>{t('progress')}</div>
                                        <div className='hidden md:block lg:block'></div>
                                        <div className='md:hidden lg:hidden'>{t('nameAndProgress')}</div>
                                    </div>
                                    <div className="inside-card-2 p-6 pt-14" ref={scrollbarRef}>
                                        <ul className='pt-1'>
                                            {students && students.slice(0, 99).reverse().map(student => (
                                                <li key={student.id} className="student-item">
                                                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 md:gap-4 gap-0.5'>
                                                        <div className="col-span-full md:col-span-1 lg:col-span-1">
                                                            <span>
                                                                {student.name.length > 16 ? student.name.substring(0, 16) + "..." : student.name}
                                                            </span>
                                                        </div>

                                                        <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-start md:justify-end lg:justify-end
                                                                        pr-0 md:pr-3 lg:pr-3">
                                                            <div className="progress-bar-container h-2.5">
                                                                <div className="progress-bar" style={{ width: `${student.progress}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherWaitRoom;
