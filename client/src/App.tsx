import { Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { OrderBook } from './components/OrderBook';
import PriceChart from './components/PriceChart';
import { TransactionList } from './components/TransactionList';
import { socket } from './lib/Helper';
import { Providers } from './lib/Providers';

const MAX_ENTRIES = 5;
const MAX_TRANSACTIONS = 12;

export function App() {
  const [book, setBook] = useState<SimpleBook | undefined>();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
      socket.emit('orderbook:init');
    });

    socket.on('orderbook:current', (price) => {
      setPrice(price);
      setHistory(prev => {
        const newHistory = [price, ...prev];
        return newHistory.length > MAX_TRANSACTIONS ? newHistory.slice(0, MAX_TRANSACTIONS) : newHistory;
      });
    });

    socket.on('orderbook:init', (data) => {
      data.asks.sort((a, b) => b.price - a.price);
      data.bids.sort((a, b) => b.price - a.price);
      setBook({
        asks: data.asks.length > MAX_ENTRIES ? data.asks.slice(-MAX_ENTRIES) : data.asks,
        bids: data.bids.slice(0, MAX_ENTRIES),
      });
    });

    socket.on("transaction:new", (tx) => {
      console.log('newtx', tx);
      setTxs(prev => {
        if (prev.length === MAX_TRANSACTIONS) {
          return [tx, ...prev.slice(0, MAX_TRANSACTIONS - 1)];
        }

        return [tx, ...prev];
      });
    });

    return () => {
      socket.off('orderbook:init');
    }
  }, []);

  return (
    <Providers>
      <Flex flexDir="row" justifyContent="center">
        <PriceChart history={history} />
        {book && <OrderBook book={book} price={price} />}
        <TransactionList txs={txs} />
        <Flex flexDir="column">{history.map((price, i) => <div>{price.toFixed(2)}</div>)}</Flex>
      </Flex>
    </Providers>
  );
}

export default App;
