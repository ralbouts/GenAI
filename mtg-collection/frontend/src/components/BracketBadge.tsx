const colors = ["", "bg-green-600", "bg-blue-600", "bg-yellow-500", "bg-orange-500", "bg-red-600"];
const labels = ["", "1", "2", "3", "4", "5"];

export default function BracketBadge({ bracket }: { bracket: number }) {
  const bg = colors[bracket] ?? "bg-gray-600";
  return (
    <span className={`${bg} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
      [{labels[bracket] ?? bracket}]
    </span>
  );
}
