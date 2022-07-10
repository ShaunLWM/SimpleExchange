import { Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { OrderBook } from './components/OrderBook';
import { TransactionList } from './components/TransactionList';
import { socket } from './lib/Helper';
import { Providers } from './lib/Providers';

const MAX_ENTRIES = 5;

export function App() {
  const [book, setBook] = useState<SimpleBook | undefined>();
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected');
      socket.emit('orderbook:init');
    });

    setInterval(() => {
      socket.emit('orderbook:current');
    }, 1000);

    socket.on('orderbook:current', (price) => {
      setPrice(price);
    });

    socket.on('orderbook:init', (data) => {
      data.asks.sort((a, b) => a.price - b.price);
      data.bids.sort((a, b) => b.price - a.price);
      setBook({
        asks: data.asks.length > MAX_ENTRIES ? data.asks.slice(-MAX_ENTRIES) : data.asks,
        bids: data.bids.slice(0, MAX_ENTRIES),
      });
    });

    socket.on("transaction:new", (tx) => {
      console.log('newtx', tx);
      setTxs(prev => {
        if (prev.length === 5) {
          return [tx, ...prev.slice(0, 4)];
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
        {book && <OrderBook book={book} price={price} />}
        <TransactionList txs={txs} />
      </Flex>
    </Providers>
  );
}

export default App;
