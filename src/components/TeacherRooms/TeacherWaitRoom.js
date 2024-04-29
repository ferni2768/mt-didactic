import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

function TeacherWaitRoom({ navigate, classCode }) {
    const [students, setStudents] = useState([]);
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);

    let completedStudents = 0;
    let totalStudents = 0;

    if (students) {
        // Calculate the number of students with progress of 100%
        completedStudents = students.filter(student => student.progress === 100).length;
        totalStudents = students.length;
    }

    Scrollbar.use(OverscrollPlugin);


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
        if (scrollbarRef.current) {
            const scrollbar = Scrollbar.init(scrollbarRef.current, {
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
            return () => scrollbar.destroy();
        }
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch(`http://localhost:3001/students?classCode=${classCode}`);
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents(); // Fetch students initially
        const intervalId = setInterval(fetchStudents, 3000); // Reload students every 3 seconds

        return () => clearInterval(intervalId);
    }, [classCode]); // Add classCode as a dependency to re-fetch when it changes


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
            const response = await fetch(`http://localhost:3001/class/${classCode}/setPhase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phase: 2 }),
            });

            if (response.ok) {
                sessionStorage.setItem('isFinished', true);
                navigate(`/teacher/${classCode}/results`);
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
        <div>
            <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:h-80 gap-4'>

                    <div className="col-span-full md:col-span-full lg:col-span-1">
                        <h1>List of Students</h1>
                        <p> {completedStudents}/{totalStudents} students finished</p>

                        <button onClick={seeResults} className="animated-button p-2 text-center mt-4 align-bottom">
                            <div className="animated-button-bg"></div>
                            <div className="animated-button-text">
                                See results
                            </div>
                        </button>
                    </div>

                    <div className="col-span-full md:col-span-full lg:col-span-2 lg:pl-7">
                        <div className='contain'>
                            <div className='inside-card-2-header text-white'> {/* Header */}
                                <div className='hidden md:block lg:block'>Name</div>
                                <div className='hidden md:block lg:block'>Progress</div>
                                <div className='hidden md:block lg:block'></div>
                                <div className='md:hidden lg:hidden'>Names and progress</div>
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
                    {/* <button onClick={handleReset}>Reset</button> */}
                </div>
            </div>
        </div >
    );
}

export default TeacherWaitRoom;
