export default function SettingsLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse mb-1" />
      <div className="h-4 w-52 bg-gray-200 rounded-lg animate-pulse" />
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}
