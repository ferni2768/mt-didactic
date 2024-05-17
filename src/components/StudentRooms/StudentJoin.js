import React, { useState, useEffect, useContext, useRef } from 'react';
import Scrollbar from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';
import { TransitionContext } from '../../visualComponents/TransitionContext';
import { useTranslation } from 'react-i18next';

function StudentJoin({ navigate, classCode }) {
    const maxLength = 15; // Set the maximum length of the name of the student
    const [name, setName] = useState('student1');
    const [nameExceedsLimit, setNameExceedsLimit] = useState(false);
    const [isNameInputFocused, setIsNameInputFocused] = useState(false);
    const [inputClassCode, setInputClassCode] = useState(classCode);
    const [wantsToJoin, setWantsToJoin] = useState(false);
    const { isTransitioning, isEntering } = useContext(TransitionContext);
    const scrollbarRef = useRef(null);

    const { t } = useTranslation();
    const shrinkCard = useRef(null);

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
        const updateHeight = () => {
            if (shrinkCard.current) {
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

                const heightInPixels = shrinkCard.current.offsetHeight;
                const heightInRem = heightInPixels / rootFontSize;

                const widthInPixels = shrinkCard.current.offsetWidth;
                const widthInRem = widthInPixels / rootFontSize;

                shrinkCard.current.style.setProperty('--initial-height', `${heightInRem}rem`);
                shrinkCard.current.style.setProperty('--initial-width', `${widthInRem}rem`);
            }
        };

        // Call the function initially to set the height
        updateHeight();

        // Add event listeners for resize and zoom level changes
        window.addEventListener('resize', updateHeight);
        // Listen for changes in devicePixelRatio to detect zoom level changes
        window.addEventListener('resize', updateHeight);

        // Cleanup function to remove event listeners
        return () => {
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
        };
    }, [shrinkCard, wantsToJoin]);

    useEffect(() => {
        setInputClassCode(classCode);
    }, [classCode]);

    useEffect(() => {
        if (wantsToJoin) {
            const intervalId = setInterval(async () => {
                try {
                    const response = await fetch(`${global.BASE_URL}/class/${inputClassCode}/phase`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.phase > 0) {
                            clearInterval(intervalId); // Clear the interval when the phase is 1
                            sessionStorage.setItem('loggedInClassCode', inputClassCode);
                            sessionStorage.setItem('classStarted', true);
                            navigate(`/student/${inputClassCode}`);
                        }
                    } else {
                        clearInterval(intervalId); // Clear the interval if the response is not ok
                        alert('Error occurred while checking class phase');
                    }
                } catch (error) {
                    clearInterval(intervalId); // Clear the interval in case of an error
                    console.error('Error:', error);
                    alert('Error occurred while checking class phase');
                }
            }, 1000); // Poll every second

            // Cleanup function to clear the interval when the component unmounts
            return () => clearInterval(intervalId);
        }
    }, [wantsToJoin, inputClassCode, navigate]);


    const handleJoin = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${global.BASE_URL}/class/${inputClassCode}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            // Directly parse the JSON response
            const data = await response.json();

            // Check if the response contains an error
            if (data.error) {
                // Handle different types of errors
                switch (data.error) {
                    case 'Class code does not exist':
                        alert('The class code does not exist. Please check and try again.');
                        break;
                    case 'Student with that name already exists in the class':
                        alert('A student with that name already exists in the class. Please choose a different name.');
                        break;
                    case 'Failed to create model':
                        alert('Failed to create model. Please try again.');
                        break;
                    default:
                        alert('An error occurred while joining the class.');
                }
                return; // Exit the function if there's an error
            }

            // If there's no error, proceed as before
            sessionStorage.setItem('loggedInStudent', JSON.stringify(data));
            setWantsToJoin(true); // Set wantsToJoin to true to start polling for the class phase
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while joining the class.');
        }
    };

    // Handle max length of the student name and filter out special characters
    const handleNameChange = (e) => {
        if (isNameInputFocused == false) {
            setNameExceedsLimit(false);
            return;
        }
        let newName = e.target.value;
        // Filter out special characters
        newName = newName.replace(/[^a-zA-Z0-9 ]/g, '');
        // Limit the name characters to maxLength
        if (newName.length > maxLength) {
            const trimmedName = newName.slice(0, maxLength);
            setName(trimmedName);
            setNameExceedsLimit(true);
        } else {
            setName(newName);
            setNameExceedsLimit(false);
        }
    };


    return (
        <div class="overflowY-container" ref={scrollbarRef}>
            <div className="overflowY-container-inside">
                <div>
                    <div ref={shrinkCard} className={`inside-login-card ${wantsToJoin ? 'shrink' : ''} ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
                        <div className="form-container">

                            {wantsToJoin && <p className={`waiting ${wantsToJoin ? 'form-animated-2' : ''}`} style={{ position: 'absolute' }}>{t('waiting')}</p>}

                            <h1 className={`text-2xl font-bold text-center ${wantsToJoin ? 'form-animated' : ''}`}>{t('studentJoin')}</h1>

                            <div className={`${wantsToJoin ? 'form-animated' : ''}`}>
                                <form onSubmit={handleJoin} className="space-y-4">
                                    <div className="flex justify-center relative">
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder=""
                                            value={name}
                                            disabled={wantsToJoin}
                                            onChange={handleNameChange}
                                            maxLength={maxLength + 1}
                                            onFocus={() => {
                                                setIsNameInputFocused(true);
                                                handleNameChange();
                                            }}
                                            onBlur={() => setIsNameInputFocused(false)}
                                            className="mt-8 border-custom_black focus:border-accent border-2 rounded-lg
                                               outline-none block w-full shadow-sm text-custom_black p-2"
                                        />
                                        <span className='text-2xl text-gray-300 bg-white absolute left-5 top-11 px-1
                                                transition duration-200 input-text pointer-events-none'>{t('name')}</span>
                                    </div>
                                    {nameExceedsLimit && isNameInputFocused && (
                                        <div className='pb-0.5'>
                                            <p className="text-sm text-accent slideUpFadeIn">{t('charLimit')}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-center relative">
                                        <input
                                            id="classCode"
                                            type="text"
                                            placeholder=""
                                            value={inputClassCode}
                                            disabled={wantsToJoin}
                                            onChange={(e) => setInputClassCode(e.target.value)}
                                            maxLength={100}
                                            className="mt-3 border-custom_black focus:border-accent border-2 rounded-lg
                                              outline-none block w-full shadow-sm text-custom_black p-2"
                                        />
                                        <span className='text-2xl text-gray-300 bg-white absolute left-3 top-6 px-1
                                                 transition duration-200 input-text pointer-events-none'>{t('classCode')}</span>
                                    </div>
                                    <div>
                                        <button type="submit" className="animated-button p-2 text-center mt-4" disabled={wantsToJoin}>
                                            <div className="animated-button-bg"></div>
                                            <div className="animated-button-text">
                                                {t('join')}
                                            </div>
                                        </button>

                                        <div className="text-center text-base pt-2" onClick={() => navigate('/teacher')}>
                                            <span className="text-custom_black opacity-50 hover:text-accent hover:opacity-100 cursor-pointer">{t('imateacher')}</span>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentJoin;
