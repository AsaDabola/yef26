import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsChart({ data, chartType = 'bar', title, xKey, yKey, color = '#3b82f6' }) {
  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <DataComponent 
              dataKey={yKey} 
              fill={color}
              stroke={color}
              strokeWidth={chartType === 'line' ? 2 : 0}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}