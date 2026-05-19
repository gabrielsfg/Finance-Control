type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  action?: () => void;
  actionLabel?: string;
};

export const SectionHeader = ({ title, subtitle, subtitleClassName, action, actionLabel }: SectionHeaderProps) => {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="font-display font-700 text-text text-[18px] tracking-tight">{title}</h2>
        {subtitle && <p className={subtitleClassName ?? "text-text-muted mt-0.5 text-[13px]"}>{subtitle}</p>}
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
