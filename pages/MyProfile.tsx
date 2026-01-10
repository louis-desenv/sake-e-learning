
import React from 'react';
import { useUser } from '../context/UserContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 3 },
    { name: 'Wed', hours: 1.5 },
    { name: 'Thu', hours: 4 },
    { name: 'Fri', hours: 2.5 },
    { name: 'Sat', hours: 5 },
    { name: 'Sun', hours: 1 },
];

const MyProfile: React.FC = () => {
    const { user, logout } = useUser();

    if (!user) return null;

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <img src={`https://picsum.photos/seed/${user.name}/100/100`} alt="User Avatar" className="h-24 w-24 rounded-full shadow-lg" />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{user.name}</h1>
                        <p className="text-gray-500 mt-1">{user.level} Learner</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Logout
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Performance</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.6)' }} />
                                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Goals</h2>
                    <ul className="space-y-3">
                        {user.goals.map(goal => (
                            <li key={goal} className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
                                <span className="text-blue-500">✓</span>
                                <span className="text-gray-700">{goal}</span>
                            </li>
                        ))}
                    </ul>
                    <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">Native Language</h2>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-gray-700">{user.nativeLanguage}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
