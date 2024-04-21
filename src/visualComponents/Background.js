import React from 'react';
import './Background.css';

const Background = ({ children, className }) => {
    return (
        <div className={`background ${className}`}>
            {children}
        </div>
    );
};

export default Background;