type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: () => void;
  actionLabel?: string;
};

export const SectionHeader = ({ title, subtitle, action, actionLabel }: SectionHeaderProps) => {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="font-display text-[16px] font-600 text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-text-muted">{subtitle}</p>}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="text-[12px] font-500 text-text-sub transition-colors hover:text-green"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
