export default function CalendarLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse mb-1" />
      <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
