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
        <h2 className="font-display font-600 text-text text-[16px]">{title}</h2>
        {subtitle && <p className="text-text-muted mt-0.5 text-[12px]">{subtitle}</p>}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="font-500 text-text-sub hover:text-green text-[12px] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
