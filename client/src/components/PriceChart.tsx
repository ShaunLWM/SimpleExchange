
import { useEffect, useState } from 'react';
import { LineChart, XAxis, YAxis, Line } from 'recharts';
import { socket } from '../lib/Helper';
interface Props {
  history: number[];
}

const MAX_TRANSACTIONS = 12;

export default function PriceChart(props: Props) {
  const [history, setHistory] = useState<{ uv: number }[]>([]);

  useEffect(() => {
    socket.on('orderbook:current', (price) => {
      setHistory(prev => {
        const newHistory = [...prev, { uv: price }];
        if (newHistory.length > MAX_TRANSACTIONS) {
          newHistory.shift();
        }
        return newHistory;
      });
    });

    return () => {
      socket.off('orderbook:current');
    }
  }, []);

  return (
    <LineChart width={500} height={300} data={history}>
      <XAxis dataKey="name" />
      <YAxis />
      <Line type="monotone" dataKey="uv" stroke="#8884d8" />
    </LineChart>
  )
}
