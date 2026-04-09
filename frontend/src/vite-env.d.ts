/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module 'react' {
  export type ReactNode = any;
  export interface ButtonHTMLAttributes<T = any> {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
  }
  export interface InputHTMLAttributes<T = any> {
    className?: string;
    [key: string]: any;
  }
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useState<T>(initial: T): [T, (value: any) => void];
  export function useEffect(effect: any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
}

declare namespace React {
  type ReactNode = any;
  interface ButtonHTMLAttributes<T = any> {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
  }
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
