declare module "next/server" {
  export type NextRequest = unknown;

  export class NextResponse {
    static next(): NextResponse;
    static redirect(input: URL | string): NextResponse;
    cookies: {
      set: (options: { name: string; value: string; [key: string]: unknown }) => void;
    };
  }
}

declare module "next/headers" {
  export function cookies(): unknown;
}

declare module "next/link" {
  interface LinkProps {
    href: string;
    className?: string;
    children?: import("react").ReactNode;
  }

  const Link: (props: LinkProps) => React.ReactElement;
  export default Link;
}

declare module "@supabase/supabase-js" {
  export interface SupabaseClient<Database = unknown> {
    auth: {
      getUser: () => Promise<{
        data: { user: unknown | null };
      }>;
      signOut?: () => Promise<unknown>;
      signInWithPassword?: (params: { email: string; password: string }) => Promise<{ error: unknown | null }>;
      signUp?: (params: { email: string; password: string }) => Promise<{ error: unknown | null }>;
      signInWithOAuth?: (params: { provider: string; options?: { redirectTo?: string } }) => Promise<{ error: unknown | null }>;
    };
    from: (table: string) => unknown;
  }
}

declare module "@supabase/ssr" {
  export type CookieOptions = Record<string, unknown>;

  export function createBrowserClient<Database = unknown>(
    supabaseUrl: string,
    supabaseAnonKey: string
  ): unknown;

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseAnonKey: string,
    options?: {
      cookies?: {
        get?: (name: string) => string | undefined;
        set?: (name: string, value: string, options: CookieOptions) => void;
        remove?: (name: string, options: CookieOptions) => void;
      };
    }
  ): {
    auth: {
      getUser: () => Promise<{
        data: { user: unknown | null };
      }>;
    };
  };
}

declare module "react" {
  export type ReactNode = {} | null | undefined;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);

  export interface InputHTMLAttributes<T> {
    id?: string;
    name?: string;
    className?: string;
    [key: string]: unknown;
  }

  export interface ButtonHTMLAttributes<T> {
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    [key: string]: unknown;
  }

  export function useState<S>(initialState: S): [S, (value: S | ((prev: S) => S)) => void];

  export function useTransition(): [boolean, (callback: () => void) => void];

  export interface FormEvent<T = unknown> {
    currentTarget: T;
    target: T;
    preventDefault: () => void;
  }

  export function createContext<T>(initialValue: T): unknown;
  export function useContext<T>(context: unknown): T;
  export function useCallback<F extends (...args: unknown[]) => unknown>(
    callback: F,
    deps: unknown[]
  ): F;
  export function useEffect(effect: () => void | (() => void), deps: unknown[]): void;
}

declare module "next/navigation" {
  export function useRouter(): {
    push: (href: string) => void;
  };
}

declare module "next/cache" {
  export function revalidatePath(path: string): void;
}

declare module "next/navigation" {
  export function redirect(path: string): never;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

declare module "zustand" {
  export type ZustandSet<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  export type ZustandGet<T> = () => T;

  export function create<T>(
    initializer: (set: ZustandSet<T>, get: ZustandGet<T>) => T
  ): () => T;
}

