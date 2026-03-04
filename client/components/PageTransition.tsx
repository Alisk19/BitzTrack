import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();

    return (
        <div key={location.pathname} className="animate-page-slide-in w-full h-full transform-gpu">
            {children}
        </div>
    );
};

export default PageTransition;
