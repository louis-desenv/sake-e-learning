import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LockedTopicCardProps {
  topicId: string;
  title: string;
  description: string;
  requiredLevel: number;
  xpRequired: number;
  borderColor: string;
}

const LockedTopicCard: React.FC<LockedTopicCardProps> = ({
  title,
  description,
  requiredLevel,
  xpRequired,
  borderColor,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`block p-6 rounded-2xl bg-white shadow-lg border-t-4 ${borderColor} opacity-60 cursor-not-allowed select-none`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Lock size={20} className="text-gray-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-500">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
          <Lock size={10} />
          {t('gamification.levelRequired', { defaultValue: 'Level {{level}} required', level: requiredLevel })}
        </span>
        {xpRequired > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Zap size={11} className="text-gray-400" />
            {t('gamification.xpNeeded', { defaultValue: '{{xp}} XP needed', xp: xpRequired })}
          </span>
        )}
      </div>
    </div>
  );
};

export default LockedTopicCard;
