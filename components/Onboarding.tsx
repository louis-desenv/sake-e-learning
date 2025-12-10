
import React, { useState } from 'react';
import type { UserProfile, LearningGoal } from '../types';
import { EnglishLevel } from '../types';
import { ENGLISH_LEVELS, LEARNING_GOALS, LANGUAGES } from '../constants';
import { CheckCircleIcon } from './icons/NavIcons';

interface OnboardingProps {
    onOnboardingComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<Partial<UserProfile>>({ name: '', goals: [] });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleGoalToggle = (goal: LearningGoal) => {
        setProfile(p => {
            const currentGoals = p.goals || [];
            const newGoals = currentGoals.includes(goal)
                ? currentGoals.filter(g => g !== goal)
                : [...currentGoals, goal];
            return { ...p, goals: newGoals };
        });
    };

    const handleSubmit = () => {
        if (profile.name && profile.level && profile.goals?.length && profile.nativeLanguage) {
            onOnboardingComplete(profile as UserProfile);
        } else {
            alert("Please complete all fields.");
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to SAke!</h2>
                        <p className="text-gray-600 mb-6">Let's get to know you. What's your name?</p>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            placeholder="Your name"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your English level?</h2>
                        <p className="text-gray-600 mb-6">This helps us tailor the lessons for you.</p>
                        <div className="space-y-3">
                            {ENGLISH_LEVELS.map(level => (
                                <button key={level} onClick={() => setProfile({ ...profile, level })} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${profile.level === level ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white hover:bg-gray-50 border-gray-300'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What are your learning goals?</h2>
                        <p className="text-gray-600 mb-6">Select all that apply.</p>
                        <div className="space-y-3">
                            {LEARNING_GOALS.map(goal => (
                                <button key={goal} onClick={() => handleGoalToggle(goal)} className={`w-full text-left p-4 rounded-lg border-2 transition-all flex justify-between items-center ${profile.goals?.includes(goal) ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white hover:bg-gray-50 border-gray-300'}`}>
                                    <span>{goal}</span>
                                    {profile.goals?.includes(goal) && <CheckCircleIcon />}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your native language?</h2>
                        <p className="text-gray-600 mb-6">This allows for adaptive bilingual support.</p>
                        <select
                            value={profile.nativeLanguage}
                            onChange={(e) => setProfile({ ...profile, nativeLanguage: e.target.value as any })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Select a language</option>
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                )
            default:
                return null;
        }
    };
    
    const progress = (step / 4) * 100;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md m-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="min-h-[250px]">{renderStep()}</div>
            
            <div className="flex justify-between mt-8">
                {step > 1 && <button onClick={handleBack} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition">Back</button>}
                {step < 4 && <button onClick={handleNext} disabled={!profile.name && step ===1} className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-blue-300 ml-auto">Next</button>}
                {step === 4 && <button onClick={handleSubmit} className="px-6 py-2 rounded-lg text-white bg-green-500 hover:bg-green-600 transition ml-auto">Finish</button>}
            </div>
        </div>
    );
};

export default Onboarding;
