import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Replace this with your own chart data
const data = [
    { date: '2020-01-01', value: 200 },
    { date: '2020-02-01', value: 300 },
    { date: '2020-03-01', value: 250 },
    { date: '2020-04-01', value: 275 },
    { date: '2020-05-01', value: 325 },
    { date: '2020-06-01', value: 350 },
    { date: '2020-07-01', value: 320 },
    { date: '2020-08-01', value: 400 },
    { date: '2020-09-01', value: 450 },
    { date: '2020-10-01', value: 500 },
    { date: '2020-11-01', value: 480 },
    { date: '2020-12-01', value: 550 },
  ];

const Chart = () => {
  return (
    <ResponsiveContainer width="60%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default Chart;
