
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

const BottomNav: React.FC = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-full">
                {NAV_ITEMS.map(({ path, label, icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors duration-200 ${
                                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                            }`
                        }
                    >
                        <span className="text-2xl">{icon}</span>
                        <span className="text-xs font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
