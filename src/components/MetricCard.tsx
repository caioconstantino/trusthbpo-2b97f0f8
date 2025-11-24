import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  variant: "sales" | "receivable" | "expenses";
}

const variantStyles = {
  sales: "bg-sales text-sales-foreground",
  receivable: "bg-receivable text-receivable-foreground",
  expenses: "bg-expenses text-expenses-foreground",
};

export const MetricCard = ({ title, value, subtitle, variant }: MetricCardProps) => {
  return (
    <div className={cn("rounded-lg p-6 shadow-sm", variantStyles[variant])}>
      <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
    </div>
  );
};
