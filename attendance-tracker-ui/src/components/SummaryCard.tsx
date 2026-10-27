interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
}

function SummaryCard({
  title,
  value,
  subtitle,
}: SummaryCardProps) {
  return (
    <div className="summary-card">
      <span className="summary-title">{title}</span>

      <strong>{value}</strong>

      <span className="summary-subtitle">{subtitle}</span>
    </div>
  );
}

export default SummaryCard;