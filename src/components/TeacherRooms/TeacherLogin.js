import React, { useState, useEffect, useContext, useRef } from 'react';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import { useTranslation } from 'react-i18next';
import UDClogo from '../../static/logos/UDC.png';
import LIDIAlogo from '../../static/logos/LIDIA.png';
import OLAVIDElogo from '../../static/logos/Olavide.png';
import RADTElogo from '../../static/logos/radte.jpg';
import INNOVAGIA from '../../static/logos/Grupo_Eduinnovagogia.png';
import { saveToSessionStorage } from '../../utils/storageUtils';

function TeacherLogin({ navigate, classCode }) {
    const [password, setPassword] = useState('password');
    const [inputClassCode, setInputClassCode] = useState(classCode);
    const { isTransitioning, isEntering } = useContext(TransitionContext);
    const [classError, setClassError] = useState('');
    const [generalError, setGeneralError] = useState('');

    const scrollbarRef = useRef(null);

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

    // Disable the scrollbar when the ctrl key is pressed in order to zoom in/out with the mouse wheel
    useEffect(() => {
        const handleKeyEvents = (event) => {
            const state = event.ctrlKey ? 'none' : 'auto';
            [scrollbarRef.current].forEach(ref => {
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
        setInputClassCode(classCode);
    }, [classCode]);

    const openTeacherManualInNewTab = () => {
        // Open the PDF in a new tab
        window.open('/manuals/manual_profesor.pdf', '_blank');
    };

    const handleCreateClass = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${global.BASE_URL}/teacher/authenticate`, { // Teacher authenticates
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: inputClassCode, password }),
            });

            if (response.ok) {
                saveToSessionStorage('isAuthenticated', true);
                saveToSessionStorage('createdClassCode', inputClassCode);
                navigate(`/teacher/${inputClassCode}`);

                // Check the class phase in case the class already has finished
                const checkPhaseResponse = await fetch(`${global.BASE_URL}/class/${inputClassCode}/phase`);
                if (checkPhaseResponse.ok) {
                    const checkPhaseData = await checkPhaseResponse.json();
                    if (checkPhaseData.phase === 2) {
                        // Go to results directly
                        saveToSessionStorage('isFinished', true);
                        navigate(`/teacher/${classCode}/results`);
                        return;
                    }
                } else {
                    setClassError('');
                    setGeneralError(t('error'));
                    return; // Exit the function if there's an error checking the phase
                }

                // After successful login and checking the class phase, set the class phase to 1
                const phaseResponse = await fetch(`${global.BASE_URL}/class/${inputClassCode}/setPhase`, { // Set the class phase to 1
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phase: 1 }),
                });

                if (!phaseResponse.ok) {
                    setClassError('');
                    setGeneralError(t('error'));
                }
            } else {
                setClassError(t('invalidCredentials'));
                setGeneralError('');
            }
        } catch (error) {
            setClassError('');
            setGeneralError(t('error'));
        }
    };


    return (
        <div class="overflowY-container" ref={scrollbarRef}>
            <div className="overflowY-container-inside footer">
                <div>
                    <div className={`inside-login-card ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className="form-container">
                            <h1 className="text-2xl font-bold text-center">{t('teacherLogin')}</h1>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div className="flex justify-center relative">
                                    <input
                                        id="classCode"
                                        type="text"
                                        placeholder=""
                                        value={inputClassCode}
                                        onChange={(e) => {
                                            setInputClassCode(e.target.value);
                                            setClassError(''); // Reset class code error on change
                                        }}
                                        maxLength={6}
                                        className="mt-8 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                    />
                                    <span className='text-2xl text-gray-300 bg-white absolute left-3 top-11 px-1
                                transition duration-200 input-text pointer-events-none'>{t('classCode')}</span>
                                </div>
                                {classError && (
                                    <div className='pb-0.5'>
                                        <p className="text-sm text-error slideUpFadeIn">{classError}</p>
                                    </div>
                                )}

                                <div className="flex justify-center relative">
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder=""
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setClassError('');
                                        }}
                                        maxLength={20}
                                        className="mt-3 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                    />
                                    <span className='text-2xl text-gray-300 bg-white absolute left-4 top-6 px-1
                                transition duration-200 input-text pointer-events-none'>{t('password')}</span>
                                </div>
                                <div>
                                    <button type="submit" className={`animated-button p-2 text-center mt-4 ${generalError ? 'error' : ''}`}>
                                        <div className={`animated-button-bg ${generalError ? 'error' : ''}`}></div>
                                        <div className={`animated-button-text ${generalError ? 'error' : ''}`}>
                                            {generalError || t('login')}
                                        </div>
                                    </button>

                                    <div className="text-center text-base pt-2 justify-between flex">
                                        <span onClick={openTeacherManualInNewTab} className="text-custom_black opacity-60 hover:text-accent hover:opacity-100 cursor-pointer">{t('teacherManual')}</span>
                                        <span onClick={() => navigate('/student')} className="text-custom_black opacity-60 hover:text-accent hover:opacity-100 cursor-pointer">{t('imastudent')}</span>
                                    </div>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>

                <div class={`bg-white fixed inset-x-0 bottom-0 flex justify-around items-center py-4 z-50 ${isTransitioning ? 'transitioning-footer' : ''} ${isEntering ? 'entering-footer' : ''}`}>
                    <img className="logo" src={UDClogo} alt="UDClogo" />
                    <img className="logo" src={RADTElogo} alt="RADTElogo" />
                    <img className="logo" src={OLAVIDElogo} alt="OLAVIDElogo" />
                    <img className="logo" src={LIDIAlogo} alt="LIDIAlogo" />
                    <img className="logo" src={INNOVAGIA} alt="INNOVAGIA" />
                </div>
            </div>
        </div>
    );
}

export default TeacherLogin;
