import React from 'react';
import { BaseButton, IconText } from '../atoms';

interface ActionItem {
  key: string;
  icon: string;
  label: string;
  className?: string;
  onClick: () => void;
}

interface Props {
  actions: ActionItem[];
}

export const QuickActionGrid: React.FC<Props> = ({ actions }) => (
  <section className="grid grid-cols-2 gap-3">
    {actions.map((action) => (
      <BaseButton
        key={action.key}
        onClick={action.onClick}
        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-1 h-24 ${action.className || ''}`}
      >
        <IconText icon={<span className="text-lg">{action.icon}</span>} text={<span className="text-sm">{action.label}</span>} className="flex-col gap-1" />
      </BaseButton>
    ))}
  </section>
);
