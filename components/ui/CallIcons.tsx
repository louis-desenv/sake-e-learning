import React from 'react';

export const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10l4-2v8l-4-2M5 6h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
    />
  </svg>
);

export const CameraOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3l18 18M10 6h5a2 2 0 012 2v1l4-2v8l-4-2v1a2 2 0 01-2 2H6"
    />
  </svg>
);

export const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 10-6 0v5a3 3 0 003 3zm0 0v4m-4 0h8"
    />
  </svg>
);

export const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 5.5C2 4.1 3.1 3 4.5 3h2a1 1 0 011 1l1 4a1 1 0 01-.3.95l-1.7 1.7a16 16 0 007.6 7.6l1.7-1.7a1 1 0 01.95-.3l4 1a1 1 0 011 1v2A2.5 2.5 0 0119.5 22C10.4 22 2 13.6 2 5.5z" />
  </svg>
);  