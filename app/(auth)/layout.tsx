export interface AuthLayoutProps {
  children?: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {children}
      </div>
    </main>
  );
}

