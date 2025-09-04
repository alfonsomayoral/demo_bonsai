declare module 'react-native-svg-charts' {
  import * as React from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export const LineChart: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;

  // Añadimos Direction para poder usar Grid.Direction.HORIZONTAL / VERTICAL
  export const Grid: React.ComponentType<any> & {
    Direction: { HORIZONTAL: number; VERTICAL: number };
  };

  // ---- Tipos compartidos (mínimos) ----
  export interface ChartContentInset {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }

  // ---- BarChart (mínimo necesario para tu uso) ----
  export interface BarChartProps<T = any> {
    style?: StyleProp<ViewStyle>;
    data: T[];
    svg?: Record<string, any>;
    yAccessor?: (props: { item: T; index: number }) => number;
    xAccessor?: (props: { item: T; index: number }) => number;
    contentInset?: ChartContentInset;
    spacingInner?: number;
    spacingOuter?: number;
    gridMin?: number;
    gridMax?: number;
    yMin?: number;
    yMax?: number;
    extras?: Array<(
      args: {
        x: (index: number) => number;
        y: (value: number) => number;
        bandwidth: number;
        data: T[];
      }
    ) => React.ReactNode>;
    children?: React.ReactNode;
  }

  export class BarChart<T = any> extends React.Component<BarChartProps<T>> {}

  // ---- PieChart (lo que ya tenías, lo dejamos tal cual) ----
  export interface PieChartDataItem {
    value: number;
    svg?: { fill?: string } & Record<string, any>;
    key?: string | number;
  }

  export interface PieChartProps {
    style?: ViewStyle;
    data: PieChartDataItem[];
    innerRadius?: number | string;
    outerRadius?: number | string;
    padAngle?: number;
    sort?: (a: any, b: any) => number;
  }

  export class PieChart extends React.Component<PieChartProps> {}
}
