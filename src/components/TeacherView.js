import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TransitionContext } from '../visualComponents/TransitionContext';
import TeacherLogin from './TeacherRooms/TeacherLogin';
import TeacherWaitRoom from './TeacherRooms/TeacherWaitRoom';
import TeacherResults from './TeacherRooms/TeacherResults';
import Background from '../visualComponents/Background';
import { getFromSessionStorage } from '../utils/storageUtils';

function TeacherView() {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, setIsTransitioning]);

    useEffect(() => {
        setPrevLocation(location);
    }, [location]);

    // Function to determine which component to render based on conditions
    const determineComponentToRender = () => {
        const isAuthenticated = getFromSessionStorage('isAuthenticated');
        const isFinished = getFromSessionStorage('isFinished');

        if (!isAuthenticated) {
            return <TeacherLogin navigate={navigate} classCode={urlClassCode} />;
        } else if (isAuthenticated && !isFinished) {
            return <TeacherWaitRoom navigate={navigate} classCode={urlClassCode} />;
        } else {
            return <TeacherResults navigate={navigate} classCode={urlClassCode} />;
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

export default TeacherView;
