import React, { useState, useEffect, useContext, useRef } from 'react';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import html2pdf from 'html2pdf.js';
import ReactDOMServer from 'react-dom/server';
import StudentPDF from './StudentPDF';
import { getFromSessionStorage } from '../../utils/storageUtils';

function StudentResults({ navigate, classCode }) {
    const [student, setStudent] = useState({});
    const [score, setScore] = useState(0);
    const [classPhase, setClassPhase] = useState(null); // State to track the class phase
    const { isEntering, isTransitioning } = useContext(TransitionContext);

    const jsonData = JSON.parse(getFromSessionStorage('iterationData')) || {};
    const diphthongScore = jsonData.iteration6?.results?.diphthong || 0;
    const hiatusScore = jsonData.iteration6?.results?.hiatus || 0;
    const generalScore = jsonData.iteration6?.results?.general || 0;

    const scrollbarRef = useRef(null);
    const scrollbarRef2 = useRef(null);
    const scrollbarRef3 = useRef(null);
    const scrollbarRef4 = useRef(null);

    const mistakes = JSON.parse(getFromSessionStorage('mistakes')) || [];

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
    useEffect(() => initializeScrollbar(scrollbarRef4), []);

    useEffect(() => {
        const storedScore = parseFloat(getFromSessionStorage('loggedInScore')) || 0;
        setScore(storedScore);
    }, []);


    // Function to handle the download of the results PDF
    const handleDownloadPDF = () => {
        const element = document.createElement('div');
        element.style.width = '1920px'; // Match the PDF width
        element.style.height = '1080px'; // Match the PDF height
        element.style.background = 'white';

        console.log(getFromSessionStorage('iterationData'));

        element.innerHTML = ReactDOMServer.renderToString(<StudentPDF />);

        document.body.appendChild(element);
        document.body.style.overflow = 'hidden';

        // Get current date and format it according to language
        const currentDate = new Date();
        let formattedDate;
        if (i18next.language.startsWith('en')) {
            formattedDate = `${currentDate.getMonth() + 1}.${currentDate.getDate()}.${currentDate.getFullYear()}`;
        } else if (i18next.language.startsWith('es')) {
            formattedDate = `${currentDate.getDate()}.${currentDate.getMonth() + 1}.${currentDate.getFullYear()}`;
        }

        // Determine file name based on language
        let fileName = `${student.name}_${getFromSessionStorage('loggedInClassCode')}_${formattedDate}.pdf`;

        const opt = {
            margin: 0,
            filename: fileName, // Updated filename
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
            link.download = fileName; // Use the dynamically generated file name
            link.click();

            // Clean up
            document.body.removeChild(element);
            URL.revokeObjectURL(blobURL); // Revoke the Blob URL after usage
        });
    };


    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current, scrollbarRef2.current, scrollbarRef3.current, scrollbarRef4.current].forEach(ref => {
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
        // Get the data from sessionStorage
        const loggedInStudent = JSON.parse(getFromSessionStorage('loggedInStudent'));
        setStudent(loggedInStudent);

        const checkClassPhase = async () => {
            try {
                const response = await fetch(`${global.BASE_URL}/class/${getFromSessionStorage('loggedInClassCode')}/phase`);
                if (response.ok) {
                    const data = await response.json();
                    setClassPhase(data.phase);
                } else {
                    console.error('Error fetching class phase:', response.statusText);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        // Initial check
        checkClassPhase();

        // Set up an interval to check the class phase every second
        const intervalId = setInterval(checkClassPhase, 1000);

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [classCode]);


    // Function to map labels to inline styles
    const getStyleForLabel = (label) => {
        switch (label) {
            case 'D':
                return { color: '#cfb838', fontWeight: 500 };
            case 'H':
                return { color: '#127edd', fontWeight: 500 };
            case 'G':
                return { color: '#ee1212', fontWeight: 500 };
            default:
                return { color: '#1c1c1c', fontWeight: 500 };
        }
    };

    const handleReset = () => {
        // Reset the session
        sessionStorage.removeItem('loggedInClassCode');
        sessionStorage.removeItem('loggedInStudent');
        sessionStorage.removeItem('loggedInScore');
        sessionStorage.removeItem('classStarted');
        sessionStorage.removeItem('iteration');
        sessionStorage.removeItem('newBatch');
        sessionStorage.removeItem('score');
        sessionStorage.removeItem('mistakes');
        sessionStorage.removeItem('iterationData');
        navigate('/student/ABC123');
        window.location.reload(); // Reload the page to reset the state
    };

    if (classPhase === 0) {
        handleReset();
    }


    return (
        <div className="overflowY-container" ref={scrollbarRef4}>
            <div className="overflowY-container-inside">
                <div>
                    <div className={`inside-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''} max-w-[20rem] md:max-w-none lg:max-w-[60rem]`}>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:h-80 gap-4'>
                            <div className="lg:col-span-1 col-span-full gap-4 max-w-17">
                                <h1>{t('studentResults')}</h1>

                                <div className='hidden podium-student lg:flex justify-center items-center text-center'>
                                    <div className='top-bar-student py-8'>
                                        <div>
                                            {student.name} <br />
                                            {score}%
                                        </div>
                                    </div>
                                </div>
                                <div className='block lg:hidden'>
                                    {student.name} <br />
                                    {score}%
                                </div>
                            </div>

                            <div className='col-span-full lg:col-span-2 lg:pl-7'>
                                <div className='contain hidden md:grid lg:grid grid-rows-3 grid-cols-2'>
                                    <div className='inside-card-2-header text-white'> {/* Header */}
                                        <div>{t('AIResults')}</div>
                                    </div>

                                    <div className="inside-card-2 p-7 pt-14 col-span-full grid grid-cols-2 grid-rows-3 justify-center">

                                        <div className='row-span-3 mt-2'>

                                            <div className='self-center text-center'>
                                            </div>

                                            <div className='ml-5 mt-20' style={{ boxShadow: '0 0 1rem rgba(0, 0, 0, 0.25)', width: '12rem', borderRadius: '1rem' }}>

                                                <div className="flex row-span-2 justify-center">
                                                    <div className="type-score-bar-container light diphthong">
                                                        <div className='type-score-bar-text-white'>{t('d')}</div>
                                                        <div className="type-score-bar diphthong" style={{ height: `${diphthongScore}%` }}></div>
                                                        <div className="type-score-bar hide light" style={{ height: diphthongScore > 95 ? "0%" : `${100 - diphthongScore}%` }}>
                                                            <div className='type-score-bar-text-black'>{t('d')}</div>
                                                        </div>
                                                    </div>


                                                    <div className="type-score-bar-container light hiatus">
                                                        <div className='type-score-bar-text-white'>{t('h')}</div>
                                                        <div className="type-score-bar hiatus" style={{ height: `${hiatusScore}%` }}></div>
                                                        <div className="type-score-bar hide light" style={{ height: hiatusScore > 95 ? "0%" : `${100 - hiatusScore}%` }}>
                                                            <div className='type-score-bar-text-black'>{t('h')}</div>
                                                        </div>
                                                    </div>


                                                    <div className="type-score-bar-container light general">
                                                        <div className='type-score-bar-text-white'>{t('g')}</div>
                                                        <div className="type-score-bar general" style={{ height: `${generalScore}%` }}></div>
                                                        <div className="type-score-bar hide light" style={{ height: generalScore > 95 ? "0%" : `${100 - generalScore}%` }}>
                                                            <div className='type-score-bar-text-black'>{t('g')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>


                                            <div className='pr-4 mt-5'>
                                                <button onClick={() => handleDownloadPDF()} className="animated-button p-2 text-center align-bottom">
                                                    <div className="animated-button-bg"></div>
                                                    <div className="animated-button-text">
                                                        {t('downloadDetails')}
                                                    </div>
                                                </button>
                                            </div>


                                        </div>


                                        <div className='col-span-1 row-span-3'>
                                            <div className='contain-mistakes pl-2'>
                                                <div className='inside-card-mistakes-header mt-5 text-white'> {/* Header */}
                                                    {mistakes.length} {mistakes.length === 1 ? t('mistake') : t('mistakes')}

                                                    <div className="info-button mt-5 mr-2">
                                                        i
                                                        <div className="tooltip bottom left">
                                                            <div style={{ fontWeight: '400' }}>{t('info-errors')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='inside-card-mistakes p-7 pt-12 mt-5' ref={scrollbarRef}>
                                                    <div className='mistakes pt-1'>
                                                        {mistakes.map(([word, mistakenLabel, correctLabel], index) => (
                                                            <div key={index}>
                                                                <a>{word}: </a>
                                                                <a style={getStyleForLabel(correctLabel)}>{correctLabel}</a>
                                                                <a>, no </a>
                                                                <a style={getStyleForLabel(mistakenLabel)}>{mistakenLabel}</a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </div>


                                {/*For small screens*/}
                                <div className='contain slim grid md:hidden lg:hidden'>
                                    <div className='inside-card-2-header text-white'> {/* Header */}
                                        <div>{t('AIResultsShort')}</div>
                                    </div>

                                    <div ref={scrollbarRef2} className="inside-card-2 lg:pt-14 md:pt-14 pt-14 pl-5 pb-5 justify-center">

                                        <div className='contain-mistakes-slim'>
                                            <div className='inside-card-mistakes-header mt-4 text-white' > {/* Header */}
                                                {mistakes.length} {mistakes.length === 1 ? t('mistake') : t('mistakes')}

                                                <div className="info-button mt-4 mr-4">
                                                    i
                                                    <div className="tooltip bottom left">
                                                        <div style={{ fontWeight: '400' }}>{t('info-errors')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='inside-card-mistakes-slim p-7 pt-12 mt-5' ref={scrollbarRef3} >
                                                <div className='mistakes pt-1'>
                                                    {mistakes.map(([word, mistakenLabel, correctLabel], index) => (
                                                        <div key={index}>
                                                            <a>{word}: </a>
                                                            <a style={getStyleForLabel(correctLabel)}>{correctLabel}</a>
                                                            <a>{t('no')}</a>
                                                            <a style={getStyleForLabel(mistakenLabel)}>{mistakenLabel}</a>
                                                        </div>
                                                    ))}
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
        </div >
    );
}

export default StudentResults;
