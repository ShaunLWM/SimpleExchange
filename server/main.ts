import cors from 'cors';
import express from "express";
import { createServer } from "http";
import { OrderBook } from "lob.js";
import { Server, Socket } from "socket.io";
import { USER_TYPE } from './lib/Constants';
import { getRandomFloat, getRandomInt, sleep } from "./lib/Helper";

const app = express();
app.use(cors({ origin: '*' }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

const book = new OrderBook();
const randomMaxNumber = getRandomInt(10, 100);
const randomMinNumber = getRandomInt(1, randomMaxNumber);
let startingPrice = getRandomFloat(randomMinNumber, randomMaxNumber, 2);

const users: Record<string, Socket> = {};

book.on('order:new', () => {
  io.emit("orderbook:init", book.getSimpleBook());
});

book.on("transaction:new", (tx) => {
  io.emit("transaction:new", tx);
  // console.log(`[updated] currentPrice: ${tx.price}`);
  startingPrice = tx.price as any;
  io.emit("orderbook:current", startingPrice);
});

io.on("connection", (socket) => {
  console.log(`[socket] connected ${socket.id}`);
  users[socket.id] = socket;

  socket.on("orderbook:init", () => {
    return socket.emit("orderbook:init", book.getSimpleBook());
  });

  socket.on("orderbook:current", () => {
    return socket.emit("orderbook:current", startingPrice);
  })

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected ${socket.id}`);
    delete users[socket.id];
  });
});

function createNewOrder() {
  setTimeout(async () => {
    const side = getRandomInt(0, 1);
    // side 0 = bid, 1 = ask
    const order = {
      type: "limit",
      price: Number((startingPrice + (side === 0 ? getRandomFloat(0.1, 0.2, 2) * -1 : getRandomFloat(0.1, 0.2, 2))).toFixed(2)),
      side: side === 0 ? "bid" : "ask",
      quantity: getRandomFloat(0.1, 10, 5),
    };

    const USERS = [
      USER_TYPE.NORMAL_LIMIT_ORDER_BUY, // normal buy
      USER_TYPE.NORMAL_LIMIT_ORDER_BUY,
      USER_TYPE.NORMAL_LIMIT_ORDER_BUY,
      USER_TYPE.NORMAL_LIMIT_ORDER_BUY,
      USER_TYPE.NORMAL_LIMIT_ORDER_SELL, // normal sell
      USER_TYPE.NORMAL_LIMIT_ORDER_SELL,
      USER_TYPE.NORMAL_LIMIT_ORDER_SELL,
      USER_TYPE.NORMAL_LIMIT_ORDER_SELL,
      USER_TYPE.WHALE_LIMIT_ORDER_BUY,
      USER_TYPE.WHALE_LIMIT_ORDER_SELL,
      USER_TYPE.WHALE_PUMP_BUY,
      USER_TYPE.WHALE_DUMP_SELL
    ];

    const generatedUser = USERS[getRandomInt(0, USERS.length - 1)];
    switch (generatedUser) {
      case USER_TYPE.NORMAL_LIMIT_ORDER_BUY:
        order.side = "bid";
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2))).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        console.log(`[🦐 bid]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.NORMAL_LIMIT_ORDER_SELL:
        order.side = "ask";
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        console.log(`[🦐 ask]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_LIMIT_ORDER_BUY:
        order.side = "bid";
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[🐋 bid]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_LIMIT_ORDER_SELL:
        order.side = "ask";
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[🐋 ask]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_PUMP_BUY:
        order.side = "bid";
        const bestBid = book.getBestBid()
        if (bestBid === null) {
          return;
        }

        order.price = parseFloat((bestBid - getRandomFloat(0.3, 0.5, 2)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[💰 bid]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_DUMP_SELL:
        const bestAsk = book.getBestAsk();
        if (bestAsk === null) {
          return;
        }

        order.side = "ask";
        order.price = parseFloat((bestAsk + getRandomFloat(0.3, 0.5, 2)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[💰 ask]\t\t${order.price}\t\t${order.quantity}`);
        break;
      default:
        break
    }

    // console.log(`---------- [debug] new order ----------`);
    // const bestBid = book.getBestBid();
    // const bestAsk = book.getBestAsk();
    // console.log(`[best ask]: ${book.getBestAsk()}`, `[best bid] ${book.getBestBid()}`);
    // console.log(order);
    // switch (order.side) {
    //   case "bid":
    //     if (bestAsk !== null && order.price > bestAsk) {
    //       console.log(`[op] new transaction for ${bestAsk}`);
    //     }
    //     break;
    //   case "ask":
    //     if (bestBid !== null && order.price < bestBid) {
    //       console.log(`[op] new transaction for ${bestBid}`);
    //     }
    //     break;
    // }
    // await sleep(10000);
    book.processOrder(order);
    createNewOrder();
  }, getRandomInt(500, 1000));
}

httpServer.listen(8081, () => {
  console.log("listening on port 8081");

  console.log(`[setup] min: ${randomMinNumber}, max ${randomMaxNumber}, startingPrice: ${startingPrice}`);
  const ordersCount = getRandomInt(1, 20);
  console.log(`[setup] processing ${ordersCount} orders for asks and bids respectively`);
  for (let i = 0; i < ordersCount; i++) {
    book.processOrder({
      type: "limit",
      price: Number((startingPrice + (getRandomFloat(0.1, 0.5, 2) * -1)).toFixed(2)),
      side: "bid",
      quantity: getRandomFloat(0.1, 10, 5),
    });
    book.processOrder({
      type: "limit",
      price: Number((startingPrice + getRandomFloat(0.1, 0.5, 2)).toFixed(2)),
      side: "ask",
      quantity: getRandomFloat(0.1, 10, 5),
    });
  }

  createNewOrder();
});
