export interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      {label && <p className="mt-2 text-sm text-gray-500">{label}</p>}
    </div>
  );
}

