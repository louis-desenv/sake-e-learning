import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';

interface XpGainToastProps {
  xpGained: number;
  onDismiss: () => void;
}

const XpGainToast: React.FC<XpGainToastProps> = ({ xpGained, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-bounce">
      <div className="bg-blue-600 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        <Zap size={16} className="fill-white" />
        <span>+{xpGained} XP</span>
      </div>
    </div>
  );
};

export default XpGainToast;
