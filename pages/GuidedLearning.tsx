import React from 'react';
import { Link } from 'react-router-dom';
import { ChatIcon } from '../components/icons/NavIcons';
import { guidedLearningTopicSlugs } from '../constants/topicSlugs';

const GuidedLearning: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Guided Learning</h1>
                <p className="text-gray-500 mt-1">Choose a topic to start your lesson.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guidedLearningTopicSlugs.map(topic => (
                    <Link
                        to={`/guided-learning/${topic.slug}`}
                        key={topic.id}
                        className={`block p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${topic.borderColor}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="text-3xl"><ChatIcon className="text-gray-600" /></div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{topic.title}</h3>
                                <p className="text-sm text-gray-500">{topic.description}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium opacity-80">{topic.goal}</span>
                                <span className="text-sm font-bold">{topic.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className={`${topic.progressColor} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${topic.progress}%` }}></div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default GuidedLearning;
