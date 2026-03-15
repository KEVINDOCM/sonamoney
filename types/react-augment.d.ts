// React hooks type declarations - augmenting React module
declare module "react" {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useState<T = undefined>(): [T | undefined, (value: T | ((prev: T | undefined) => T | undefined) | undefined) => void];
  
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]): T;
  
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  
  export function useContext<T>(context: { _value: T }): T;
  
  export function useRef<T>(initialValue: T | null): { current: T | null };
  
  export function Suspense(props: { children: React.ReactNode; fallback?: React.ReactNode }): React.ReactElement;
  
  type DependencyList = readonly unknown[];
  type EffectCallback = () => void | (() => void);
}
