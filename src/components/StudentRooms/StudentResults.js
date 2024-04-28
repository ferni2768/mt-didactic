import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

function StudentResults({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [score, setScore] = useState();
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);

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
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(sessionStorage.getItem('loggedInStudent'));
        const loggedInScore = JSON.parse(sessionStorage.getItem('score'));
        setStudent(loggedInStudent);
        setScore(loggedInScore);
    }, []);

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('loggedInClassCode');
        sessionStorage.removeItem('loggedInStudent');
        sessionStorage.removeItem('loggedInScore');
        sessionStorage.removeItem('classStarted');
        sessionStorage.removeItem('iteration');
        sessionStorage.removeItem('score');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:h-80 gap-4'>
                    <div className="lg:col-span-1 col-span-full gap-4 max-w-17">
                        <div className="col-span-1">
                            <h1>Student Results</h1>
                            <p>{student.name}</p>
                            <p>{score}%</p>
                        </div>

                    </div>

                    <div className='col-span-full lg:col-span-1 lg:pl-7'>
                        <div className="inside-card-2 p-6" ref={scrollbarRef}>
                            Wrong/right words
                        </div>
                    </div>

                </div>

            </div>
            {/* <button onClick={handleReset}>Reset</button> */}
        </div>
    );
}

export default StudentResults;
