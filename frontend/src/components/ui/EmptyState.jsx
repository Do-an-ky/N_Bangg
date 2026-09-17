export default function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-gray-700 font-medium text-lg">{title}</p>
      {description && <p className="text-gray-500 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
