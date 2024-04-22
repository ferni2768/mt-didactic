import React, { createContext, useState } from 'react';

export const TransitionContext = createContext();

export const TransitionProvider = ({ children }) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isEntering, setIsEntering] = useState(false);

    return (
        <TransitionContext.Provider value={{ isTransitioning, setIsTransitioning, isEntering, setIsEntering }}>
            {children}
        </TransitionContext.Provider>
    );
};
