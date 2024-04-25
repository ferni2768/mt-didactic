import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TransitionContext } from '../visualComponents/TransitionContext';
import StudentJoin from './StudentRooms/StudentJoin';
import StudentPlay from './StudentRooms/StudentPlay';
import StudentResults from './StudentRooms/StudentResults';
import Background from '../visualComponents/Background';

function StudentView() {
    const { classCode: urlClassCode } = useParams();
    const { setIsTransitioning } = useContext(TransitionContext);
    const { setIsEntering } = useContext(TransitionContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [, setPrevLocation] = useState(location);
    const [renderComponent, setRenderComponent] = useState(null); // State to control rendering
    const [hasMounted, setHasMounted] = useState(true);


    useEffect(() => {
        setHasMounted(true); // Skip transition on first mount
    }, []);

    useEffect(() => {
        if (hasMounted) {
            setIsTransitioning(true); // Start the transition

            const changeComponentTimeoutId = setTimeout(() => {
                setIsTransitioning(false);
                setIsEntering(true);
                setRenderComponent(determineComponentToRender());
            }, 450);

            const endTransitionTimeoutId = setTimeout(() => {
                setIsEntering(false);
            }, 900); // End the transition

            return () => {
                clearTimeout(changeComponentTimeoutId);
                clearTimeout(endTransitionTimeoutId);
            };
        } else {
            // If the component is mounting for the first time, skip the transition
            setIsTransitioning(false);
            setIsEntering(false);
            setRenderComponent(determineComponentToRender());
        }
    }, [location, setIsTransitioning]);

    useEffect(() => {
        setPrevLocation(location);
    }, [location]);

    // Function to determine which component to render based on conditions
    const determineComponentToRender = () => {
        const loggedInStudent = sessionStorage.getItem('loggedInStudent');
        const loggedInScore = sessionStorage.getItem('loggedInScore');
        const classStarted = sessionStorage.getItem('classStarted');

        if (!classStarted) {
            return <StudentJoin navigate={navigate} classCode={urlClassCode} />;
        } else if (loggedInStudent && classStarted && !loggedInScore) {
            return <StudentPlay navigate={navigate} classCode={urlClassCode} />;
        } else if (loggedInStudent && classStarted && loggedInScore) {
            return <StudentResults navigate={navigate} classCode={urlClassCode} />;
        }
    };

    // Initial render or during transition, render nothing or a loading indicator (TODO)
    if (!renderComponent) {
        return null;
    }

    return (
        <Background>
            {renderComponent}
        </Background>
    );
}

export default StudentView;
