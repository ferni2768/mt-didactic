import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

function TeacherResults({ navigate, classCode }) {
    const [students, setStudents] = useState([]);
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);

    Scrollbar.use(OverscrollPlugin);


    useEffect(() => {
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
                return () => scrollbar.destroy();
            }
        };

        const handleResize = () => {
            initializeScrollbar(scrollbarRef);
            initializeScrollbar(scrollbarRef2);
        };

        // Initialize scrollbars on component mount
        handleResize();

        // Listen for window resize events
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);



    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('http://localhost:3001/student');
                const data = await response.json();
                // Sort students by score in descending order
                const sortedStudents = data.sort((a, b) => b.score - a.score);
                setStudents(sortedStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, []);

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('createdClassCode');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isFinished');
        navigate('/teacher/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <div>
            <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:h-80 gap-4'>

                    <div className="grid lg:grid-cols-3 lg:col-span-1 gap-4 max-w-17">
                        <div className="col-span-1">
                            <h1>Results</h1>

                            <div className='hidden lg:block podium-2 w-full'>
                                <div className='top-bar-2 py-8'>
                                    <div className='flex justify-between text-center w-full'>
                                        {students.slice(1, 2).map(student => (
                                            <div key={student.id} className='w-full'>
                                                {student.name} <br />
                                                <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                    <div className="progress-bar-container-dark h-3">
                                                        <div className='progress-bar-silver' style={{ width: `${student.score}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <h3 className='pt-8 text-gray-400'>2</h3>
                                </div>
                            </div>
                        </div>



                        <div className="hidden lg:block col-span-1 podium-3 w-full">
                            <div className='top-bar-3 py-8'>
                                <div className='flex justify-between text-center w-full'>
                                    {students.slice(2, 3).map(student => (
                                        <div key={student.id} className='w-full'>
                                            {student.name} <br />
                                            <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                <div className="progress-bar-container-dark h-3">
                                                    <div className='progress-bar-bronce' style={{ width: `${student.score}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <h3 className='pt-8 text-amber-800'>3</h3>
                            </div>
                        </div>

                        <div className="hidden lg:block col-span-1 podium-2 w-full">
                            <div className='top-bar-1 py-8'>
                                <div className='flex justify-between text-center w-full'>
                                    {students.slice(0, 1).map(student => (
                                        <div key={student.id} className='w-full'>
                                            {student.name} <br />
                                            <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                <div className="progress-bar-container-dark h-3">
                                                    <div className='progress-bar-gold' style={{ width: `${student.score}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <h2 className='pt-2 text-amber-500'>1</h2>
                            </div>
                        </div>
                    </div>

                    <div className='col-span-full lg:col-span-1 lg:pl-7'>
                        <div className="hidden lg:block">
                            <div className="inside-card-2 p-6" ref={scrollbarRef}>
                                <ul>
                                    {students.slice(3, 99).map((student, index) => (
                                        <li key={student.id} className='student-item'>

                                            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 md:gap-4 gap-0.5'>
                                                <div className="col-span-full md:col-span-1 lg:col-span-1">
                                                    <span>
                                                        {index + 4}. {student.name.length > 16 ? student.name.substring(0, 16) + "..." : student.name}
                                                    </span>
                                                </div>

                                                <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-start md:justify-end lg:justify-end
                                            pr-0 md:pr-3 lg:pr-3">
                                                    <div className="progress-bar-container h-2.5">
                                                        <div className="progress-bar" style={{ width: `${student.score}%` }}></div>
                                                    </div>
                                                </div>

                                            </div>



                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="block lg:hidden">
                            <div className="inside-card-2 p-6" ref={scrollbarRef2}>
                                <ul>
                                    {students.slice(0, 99).map((student, index) => (
                                        <li key={student.id} className='student-item'>
                                            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 md:gap-4 gap-0.5'>
                                                <div className="col-span-full md:col-span-1 lg:col-span-1">
                                                    <span>
                                                        {index + 1}. {student.name.length > 16 ? student.name.substring(0, 16) + "..." : student.name}
                                                    </span>
                                                </div>

                                                <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-start md:justify-end lg:justify-end
                                                                pr-0 md:pr-3 lg:pr-3">
                                                    <div className="progress-bar-container h-2.5">
                                                        <div className={`progress-bar ${index < 3 ? `progress-bar-${['gold', 'silver', 'bronce'][index]}` : ''}`} style={{ width: `${student.score}%` }}></div>
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
            <button onClick={handleReset}>Reset</button>
        </div >
    );
}

export default TeacherResults;
