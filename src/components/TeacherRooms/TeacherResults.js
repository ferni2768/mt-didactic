import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';
import html2pdf from 'html2pdf.js';
import ReactDOMServer from 'react-dom/server';
import TeacherPDF from './TeacherPDF';

function TeacherResults({ navigate, classCode }) {
    const [students, setStudents] = useState([]);
    const { isEntering, isTransitioning } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);
    const scrollbarRef3 = useRef(null);

    const { t } = useTranslation();

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
    useEffect(() => initializeScrollbar(scrollbarRef3), []);

    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current, scrollbarRef2.current, scrollbarRef3.current].forEach(ref => {
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
    }, [students]);


    // Function to handle the download of the results PDF
    const handleDownloadPDF = (params) => {
        const element = document.createElement('div');
        element.style.width = '1920px'; // Match the PDF width
        element.style.height = '1080px'; // Match the PDF height
        element.style.background = 'white';

        element.innerHTML = ReactDOMServer.renderToString(<TeacherPDF {...params} />);

        document.body.appendChild(element);
        document.body.style.overflow = 'hidden';

        const opt = {
            margin: 0,
            filename: 'teacher_results.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                windowWidth: 1920,
                windowHeight: 1080,
                scrollX: 0,
                scrollY: 0,
                useCORS: true
            },
            jsPDF: {
                unit: 'px',
                format: [1920, 1080], // Match the window size
                orientation: 'landscape'
            }
        };

        html2pdf().from(element).set(opt).toPdf().get('pdf').then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            if (totalPages > 1) {
                const scale = 1 / totalPages;
                pdf.internal.pageSize.width *= scale;
                pdf.internal.pageSize.height *= scale;
                pdf.setPage(1);
                pdf.deletePage(2);
            }
            return pdf.output('blob'); // Output the PDF as a Blob object
        }).then((blob) => {
            const blobURL = URL.createObjectURL(blob); // Create a URL for the Blob
            window.open(blobURL); // Open the Blob URL in a new window

            // Save the PDF file
            const link = document.createElement('a');
            link.href = blobURL;
            link.download = 'teacher_results.pdf';
            link.click();

            // Clean up
            document.body.removeChild(element);
            URL.revokeObjectURL(blobURL); // Revoke the Blob URL after usage
        });
    };

    const seeProgress = async () => {
        try {
            // Set the class phase to 1
            const response = await fetch(`${global.BASE_URL}/class/${sessionStorage.getItem('createdClassCode')}/setPhase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phase: 1 }),
            });

            if (response.ok) {
                sessionStorage.removeItem('isFinished');
                navigate(`/teacher/${sessionStorage.getItem('createdClassCode')}`);
            } else {
                console.error('Error setting class phase:', response.statusText);
                alert('Error occurred while setting class phase');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred while setting class phase');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${global.BASE_URL}/students?classCode=${sessionStorage.getItem('createdClassCode')}`);
            const data = await response.json();
            // Sort students by score in descending order
            const sortedStudents = data.sort((a, b) => b.score - a.score);
            setStudents(sortedStudents);
        } catch (error) {
            // Silently handle errors
            console.error('Error fetching students:', error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
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

    const restartClass = async () => {
        try {
            const classCode = sessionStorage.getItem('createdClassCode');
            const response = await fetch(`${global.BASE_URL}/class/${classCode}/restart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                handleReset();
            } else {
                console.error('Error restarting class:', response.statusText); // Silently handle errors
            }
        } catch (error) {
            console.error('Error:', error); // Silently handle errors
        }
    };


    return (
        <div className="overflowY-container" ref={scrollbarRef3}>
            <div className="overflowY-container-inside">
                <div>
                    <div className={`inside-card wait-room ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:h-80 gap-4'>

                            <div className="grid lg:grid-cols-3 lg:col-span-1 gap-4 max-w-17">
                                <h1 className='absolute hidden lg:block'>{t('results')}</h1>
                                <h1 className='block lg:hidden'>{t('results')}</h1>

                                <div className='hidden lg:block podium-2 w-full'>
                                    <div className='top-bar-2 py-8 see-score'>
                                        <div className='flex justify-between text-center w-full'>
                                            {students.slice(1, 2).map(student => (
                                                <div key={student.id} className='w-full see-score'>
                                                    {student.name} <br />
                                                    <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                        <div className="progress-bar-container-dark h-2">
                                                            <div className='progress-bar-silver' style={{ width: `${student.score}%` }}></div>
                                                        </div>
                                                        <div className='hover-score hover-score-silver text-center'>{student.score}%</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <h3 className='pt-8 text-gray-400' style={{ pointerEvents: 'none' }}>2</h3>
                                    </div>
                                </div>

                                <div className="hidden lg:block col-span-1 w-full">
                                    <div className='podium-3'>
                                        <div className='top-bar-3 py-8 see-score'>
                                            <div className='flex justify-between text-center w-full'>
                                                {students.slice(2, 3).map(student => (
                                                    <div key={student.id} className='w-full'>
                                                        {student.name} <br />
                                                        <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                            <div className="progress-bar-container-dark h-2">
                                                                <div className='progress-bar-bronce' style={{ width: `${student.score}%` }}></div>
                                                            </div>
                                                            <div className='hover-score hover-score-bronce text-center'>{student.score}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <h3 className='pt-8 text-amber-800' style={{ pointerEvents: 'none' }}>3</h3>
                                        </div>

                                    </div>
                                </div>

                                <div className="hidden lg:block col-span-1 podium-2 w-full">
                                    <div className='top-bar-1 py-8 see-score'>
                                        <div className='flex justify-between text-center w-full'>
                                            {students.slice(0, 1).map(student => (
                                                <div key={student.id} className='w-full'>
                                                    {student.name} <br />
                                                    <div className="col-span-full md:col-span-2 lg:col-span-2 flex items-center justify-center pt-3">
                                                        <div className="progress-bar-container-dark h-2">
                                                            <div className='progress-bar-gold' style={{ width: `${student.score}%` }}></div>
                                                        </div>
                                                        <div className='hover-score hover-score-gold text-center'>{student.score}%</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <h2 className='pt-2 text-amber-500' style={{ pointerEvents: 'none' }}>1</h2>
                                    </div>
                                </div>
                            </div>

                            <div className='hidden lg:block inside-card-2-common-errors'>
                                <div className='font-bold'>Errores comunes: </div>
                                cascarillo, máquina, pisapapeles, hora, maricarmen, oleaje, canción, genialidad, estudiante, guardería, julio
                            </div>


                            <div className='col-span-full lg:col-span-1 lg:pl-7'>
                                <div className="hidden lg:block">
                                    <div className='contain'>
                                        <div className='inside-card-2-header text-white'> {/* Header */}
                                            <div>{t('name')}</div>
                                            <div>{t('score')}</div>
                                            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                                        </div>
                                        <div className="inside-card-2 wait-room p-6 pt-14" ref={scrollbarRef}>
                                            <ul className='pt-1'>
                                                {students.slice(3, 99).map((student, index) => (
                                                    <li key={student.id} className='student-item see-score'>
                                                        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 md:gap-4 gap-0.5'>
                                                            <div className="col-span-full md:col-span-1 lg:col-span-1">
                                                                <span>
                                                                    <a className={`${student.score < 1 ? 'hidden' : ''}`}> {index + 4}.</a> {student.name.length > 16 ? student.name.substring(0, 16) + "..." : student.name}
                                                                </span>
                                                            </div>

                                                            <div className={`col-span-full md:col-span-2 lg:col-span-2 flex items-center
                                                    justify-start md:justify-end lg:justify-end pr-0 md:pr-3 lg:pr-3 ${student.score < 1 ? 'hidden' : ''}`}>
                                                                <div className='hover-score text-center'>{student.score}%</div>
                                                                <div className="progress-bar-container score h-2.5">
                                                                    <div className="progress-bar" style={{ width: `${student.score}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-5 grid-rows-2 mt-3'>
                                        <button onClick={() => handleDownloadPDF({})} className="col-span-full animated-button p-2 text-center mt-4 align-bottom">
                                            <div className="animated-button-bg download"></div>
                                            <div className="animated-button-text">
                                                Descargar resultados
                                            </div>
                                        </button>

                                        <div className='col-span-full grid grid-cols-5'>
                                            <button onClick={() => seeProgress()} className="col-span-2 animated-button p-2 text-center my-2 align-bottom">
                                                <div className="animated-button-bg"></div>
                                                <div className="animated-button-text">
                                                    Progreso
                                                </div>
                                            </button>

                                            <div className="ml-5 col-span-3">
                                                <button onClick={() => restartClass()} className="animated-button p-2 text-center my-2 align-bottom">
                                                    <div className="animated-button-bg restart"></div>
                                                    <div className="animated-button-text">
                                                        Reiniciar clase
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="block lg:hidden">
                                    <div className='contain small md:h-auto'>
                                        <div className='inside-card-2-header text-white'>
                                            <div className='hidden md:block'>{t('name')}</div>
                                            <div className='hidden md:block'>{t('score')}</div>
                                            <div className='hidden md:block'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                                            <div className='md:hidden'>{t('namesAndScores')}</div>

                                            <div className="info-button mt-1 mr-1">
                                                i
                                                <div className="tooltip common-errors bottom left">

                                                    <div className='text-xl'>Errores comunes</div>

                                                    <div style={{ fontWeight: '400' }} className='mt-6'>
                                                        cascarillo, máquina, pisapapeles, hora, maricarmen, oleaje, canción, genialidad, estudiante, guardería, julio
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="inside-card-2 p-6 pt-14" ref={scrollbarRef2}>
                                            <ul className='pt-1'>
                                                {students.slice(0, 99).map((student, index) => (
                                                    <li key={student.id} className='student-item see-score'>
                                                        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 lg:gap-4 md:gap-4 gap-0.5'>
                                                            <div className="col-span-full md:col-span-1 lg:col-span-1">
                                                                <span>
                                                                    <a className={`${student.score < 1 ? 'hidden' : ''}`}> {index + 1}.</a> {student.name.length > 16 ? student.name.substring(0, 16) + "..." : student.name}
                                                                </span>
                                                            </div>

                                                            <div className={`col-span-full md:col-span-2 lg:col-span-2 flex items-center
                                                    justify-start md:justify-end lg:justify-end pr-0 md:pr-3 lg:pr-3 ${student.score < 1 ? 'hidden' : ''}`}>
                                                                <div className={`hover-score text-center ${index === 0 ? 'hover-score-gold' : index === 1 ? 'hover-score-silver' : index === 2 ? 'hover-score-bronce' : ''}`}>
                                                                    {student.score}%
                                                                </div>
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

                                    <div className='grid-rows-3 md:grid-rows-2 mt-4'>
                                        <button onClick={() => handleDownloadPDF({})} className="row-span-1 animated-button p-2 text-center mt-4 align-bottom">
                                            <div className="animated-button-bg download"></div>
                                            <div className="animated-button-text">
                                                Descargar
                                            </div>
                                        </button>

                                        <div className='md:grid grid-cols-5 row-span-2 md:row-span-1'>
                                            <button onClick={() => seeProgress()} className="md:col-span-2 animated-button p-2 text-center md:my-2 mt-2 align-bottom">
                                                <div className="animated-button-bg"></div>
                                                <div className="animated-button-text">
                                                    Progreso
                                                </div>
                                            </button>
                                            <div className='md:col-span-3 md:ml-3'>
                                                <button onClick={() => restartClass()} className="animated-button p-2 text-center my-0 md:my-2 mt-2 align-bottom">
                                                    <div className="animated-button-bg restart"></div>
                                                    <div className="animated-button-text">
                                                        Reiniciar clase
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default TeacherResults;
