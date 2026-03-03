declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface Layouts {
    [P: string]: LayoutItem[];
  }

  export interface ResponsiveGridLayoutProps {
    className?: string;
    layouts?: Layouts;
    breakpoints?: Record<string, number>;
    cols?: Record<string, number>;
    rowHeight?: number;
    width?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    draggableHandle?: string;
    draggableCancel?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    margin?: [number, number];
    onLayoutChange?: (layout: LayoutItem[], layouts: Layouts) => void;
    children?: React.ReactNode;
  }

  export const ResponsiveGridLayout: React.ComponentType<ResponsiveGridLayoutProps>;

  export function useContainerWidth(
    ref: React.RefObject<HTMLElement | null>,
    options?: { debounceMs?: number }
  ): number;
}

declare module 'react-grid-layout/css/styles.css' {}
declare module 'react-resizable/css/styles.css' {}
