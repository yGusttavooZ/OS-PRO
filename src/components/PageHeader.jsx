export default function PageHeader({ title, subtitle, eyebrow, actions, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-1.5">{eyebrow}</p>
          )}
          <h1 className="text-[25px] sm:text-[30px] font-heading font-extrabold leading-tight tracking-[-0.025em] text-foreground">
            {title}
          </h1>
          {subtitle && <p className="text-[13.5px] text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
