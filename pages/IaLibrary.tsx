/**
 * AI Library Page
 *
 * Displays curated learning resources including videos and daily tips.
 * Features embedded YouTube videos with modal playback and AI-powered tips.
 *
 * @fileoverview This page showcases educational content including a "Tip of the Day"
 * from the AI and a gallery of YouTube videos for English learning.
 *
 * @dependencies react, ../services/geminiService
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { getTipOfTheDay } from '../services/geminiService';

// ============================================================================
// DATA
// ============================================================================

/**
 * Video configuration structure.
 *
 * @interface Video
 */
interface Video {
  /** YouTube video ID */
  id: string;
  /** Display title of the video */
  title: string;
  /** URL to the thumbnail image */
  thumbnail: string;
}

/**
 * Featured learning videos.
 * Curated collection of YouTube videos for English learning.
 *
 * @constant {Video[]}
 */
const videos: Video[] = [
    { id: 'pFAhr_b5E5U', title: 'Learn Colors with Ms Monica', thumbnail: 'https://i.ytimg.com/vi/pFAhr_b5E5U/hqdefault.jpg' },
    { id: 'ALcL3MuU4hA', title: 'Learn The Alphabet', thumbnail: 'https://i.ytimg.com/vi/ALcL3MuU4hA/hqdefault.jpg' },
    { id: '7n0h52ppA-I', title: 'Learn to Count to 20', thumbnail: 'https://i.ytimg.com/vi/7n0h52ppA-I/hqdefault.jpg' },
    { id: 'VtK24A0p2BU', title: 'The Wheels On The Bus', thumbnail: 'https://i.ytimg.com/vi/VtK24A0p2BU/hqdefault.jpg' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Video modal component for YouTube playback.
 *
 * @component VideoModal
 * @param {string} videoId - YouTube video ID to play
 * @param {() => void} onClose - Callback when modal is closed
 * @returns {JSX.Element} Modal with embedded YouTube player
 */
const VideoModal = ({ videoId, onClose }: { videoId: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-4 shadow-2xl relative w-11/12 max-w-4xl" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg">&times;</button>
            <div className="aspect-w-16 aspect-h-9">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-md"
                ></iframe>
            </div>
        </div>
    </div>
);

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * AI Library page component.
 *
 * Displays the AI "Tip of the Day" and a gallery of educational YouTube videos.
 * Videos open in a modal for playback without leaving the page.
 *
 * @component IaLibrary
 * @returns {JSX.Element} AI Library page
 *
 * @example
 * ```tsx
 * <Route path="/library" element={<IaLibrary />} />
 * ```
 *
 * @remarks
 * - Tip is fetched from Gemini AI on component mount
 * - Videos open in modal with autoplay enabled
 * - Responsive grid layout for video gallery
 */
const IaLibrary: React.FC = () => {
    const [tip, setTip] = useState('Loading tip...');
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    /**
     * Fetch tip of the day on mount.
     */
    useEffect(() => {
        getTipOfTheDay().then(setTip);
    }, []);

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">IA Library</h1>
                <p className="text-gray-500 mt-1">Expand your knowledge with curated resources.</p>
            </header>

            {/* Tip of the Day */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg text-gray-800">💡 Tip of the Day</h3>
                <p className="text-gray-600 mt-2">{tip}</p>
            </div>

            {/* Featured Videos */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video: Video) => (
                        <div key={video.id} className="cursor-pointer group" onClick={() => setSelectedVideo(video.id)}>
                            <div className="relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-auto" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 p-3">
                                    <h4 className="text-white font-semibold text-sm">{video.title}</h4>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && <VideoModal videoId={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default IaLibrary;
