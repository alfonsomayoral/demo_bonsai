declare module 'react-native-svg-charts' {
    import * as React from 'react';
    export const LineChart: React.ComponentType<any>;
    export const XAxis: React.ComponentType<any>;
    export const YAxis: React.ComponentType<any>;
    export const Grid: React.ComponentType<any>;

    import { ViewStyle } from 'react-native';

    // ---- PieChart ----
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