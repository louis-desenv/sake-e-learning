import React from 'react';
import { useUser, useAuth } from '../context/UserContext';
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
    const user = useUser();
    const { logout } = useAuth();

    const handleLogout = async () => {
        if (confirm('Tem certeza que deseja sair?')) {
            await logout();
        }
    };

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
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H6a1 1 0 110-2h5.586L8.293 1.707a1 1 0 011.414-1.414L14 4.586V7.414z" clipRule="evenodd" />
                    </svg>
                    <span>Logout</span>
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
                                <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.6)'}}/>
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
