import React from 'react';
import { createPortal } from 'react-dom';
import { EntitlementDecision } from '../../hooks/useEntitlements';
import { FeatureLockScreen } from './FeatureLockScreen';

interface EntitlementPaywallModalProps {
  decision: EntitlementDecision | null;
  onClose: () => void;
}

export const EntitlementPaywallModal: React.FC<EntitlementPaywallModalProps> = ({ decision, onClose }) => {
  if (!decision) return null;

  return createPortal(
    <div data-paywall-ignore="true" className="fixed inset-0 z-[260] flex items-center justify-center p-4 md:pl-[240px]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[400px]">
        <FeatureLockScreen decision={decision} onBack={onClose} onClose={onClose} variant="modal" />
      </div>
    </div>,
    document.body,
  );
};
