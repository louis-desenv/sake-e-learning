
import React from 'react';
import { Link } from 'react-router-dom';

const subjects = [
    { name: 'Grammar Essentials', progress: 75, color: 'from-blue-400 to-blue-600' },
    { name: 'Vocabulary Builder', progress: 40, color: 'from-green-400 to-green-600' },
    { name: 'Pronunciation Practice', progress: 60, color: 'from-purple-400 to-purple-600' },
    { name: 'Business English', progress: 25, color: 'from-yellow-400 to-yellow-600' },
    { name: 'Travel Phrases', progress: 90, color: 'from-red-400 to-red-600' },
    { name: 'Idioms & Slang', progress: 15, color: 'from-indigo-400 to-indigo-600' },
];

const GuidedLearning: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Guided Learning</h1>
                <p className="text-gray-500 mt-1">Choose a topic to start your lesson.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(subject => (
                    <Link to="/chat" state={{ mode: 'text' }} key={subject.name} className={`block p-6 rounded-2xl text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${subject.color}`}>
                        <h3 className="font-bold text-xl">{subject.name}</h3>
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium opacity-80">Progress</span>
                                <span className="text-sm font-bold">{subject.progress}%</span>
                            </div>
                            <div className="w-full bg-white/30 rounded-full h-2.5">
                                <div className="bg-white h-2.5 rounded-full" style={{ width: `${subject.progress}%` }}></div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default GuidedLearning;
