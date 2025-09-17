import { BackButton } from "./BackButton";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  fallbackBackTo?: string; // dónde caer si no hay history
  actions?: React.ReactNode; // botones a la derecha
  sticky?: boolean; // encabezado pegajoso
};

export function PageHeader({
  title,
  subtitle,
  fallbackBackTo = "/",
  actions,
  sticky = true,
}: PageHeaderProps) {
  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
          : ""
      }
    >
      <div className="container mx-auto mb-2">
        <div className="flex items-center gap-3 ">
          <BackButton fallback={fallbackBackTo} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
