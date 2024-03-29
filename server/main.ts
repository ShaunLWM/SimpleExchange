import cors from 'cors';
import express from "express";
import { createServer } from "http";
import { OrderBook } from "lob.js";
import { Server, Socket } from "socket.io";
import { USER_TYPE } from './lib/Constants';
import { getRandomFloat, getRandomInt } from "./lib/Helper";

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
const ITERATIONS_BEFORE_WHALES_ENTER = 50;
let currentIterations = 0;

const users: Record<string, Socket> = {};

book.on('order:new', () => {
  io.emit("orderbook:init", book.getSimpleBook());
});

book.on("transaction:new", (tx) => {
  io.emit("transaction:new", tx);
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
    const order = {
      type: "limit",
      price: 0,
      side: "bid",
      quantity: 0,
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
    ];

    if (currentIterations >= ITERATIONS_BEFORE_WHALES_ENTER) {
      USERS.push(...[
        USER_TYPE.WHALE_LIMIT_ORDER_BUY,
        USER_TYPE.WHALE_LIMIT_ORDER_SELL,
        USER_TYPE.WHALE_PUMP_BUY,
        USER_TYPE.WHALE_DUMP_SELL
      ]);
    }

    const generatedUser = USERS[getRandomInt(0, USERS.length - 1)];
    switch (generatedUser) {
      case USER_TYPE.NORMAL_LIMIT_ORDER_BUY:
        order.side = "bid";
        order.price = Number((startingPrice + (getRandomFloat(3, 10, 2))).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        console.log(`[🦐 bid]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.NORMAL_LIMIT_ORDER_SELL:
        order.side = "ask";
        order.price = Number((startingPrice + (getRandomFloat(3, 10, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        console.log(`[🦐 ask]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_LIMIT_ORDER_BUY:
        order.side = "bid";
        order.price = Number((startingPrice + (getRandomFloat(3, 10, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[🐋 bid]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_LIMIT_ORDER_SELL:
        order.side = "ask";
        order.price = Number((startingPrice + (getRandomFloat(3, 10, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        console.log(`[🐋 ask]\t\t${order.price}\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_PUMP_BUY:
        // TODO: Properly get orderbook steps and add them all up instead of using random
        // when you want price to pump, you need to submit a BID order to buy all the ASKs
        // current ASK -> $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        // buy everything at $100 each, essentially buying all the ASKs and making the last transaction price $10
        const bestAsk = book.getBestAsk();
        if (bestAsk === null) {
          return;
        }

        order.type = "market";
        order.side = "bid";
        order.quantity = book.getSimpleAsks().slice(Math.min(3, book.getSimpleAsks().length) * -1).reduce((acc, ask) => acc + ask.volume, 0);
        console.log(`[💰 pump]\t\t-\t\t${order.quantity}`);
        break;
      case USER_TYPE.WHALE_DUMP_SELL: {
        // TODO: Properly get orderbook steps and add them all up instead of using random
        // when you want price to dump, you need to submit a ASK order to buy all the BIDs
        // current BID -> $5, $4, $3, $2, $1
        // buy everything at $10 each, essentially buying all the BIDs and making the last transaction price $1
        const bestBid = book.getBestBid();
        if (bestBid === null) {
          break;
        }

        order.type = "market";
        order.side = "ask";
        order.quantity = book.getSimpleBids().slice(Math.min(5, book.getSimpleBids().length) * -1).reduce((acc, bid) => acc + bid.volume, 0);
        console.log(`[💰 dump]\t\t-\t\t${order.quantity}`);
        break;
      }
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
    if (order.price !== 0 && order.quantity !== 0) {
      const { trades } = book.processOrder(order);
      if (Array.isArray(trades) && trades.length > 0) {
        startingPrice = trades[trades.length - 1].price;
        io.emit("orderbook:current", startingPrice);
      }
      currentIterations += 1;
    }
    createNewOrder();
  }, getRandomInt(100, 500));
}

httpServer.listen(8081, () => {
  console.log("listening on port 8081");

  console.log(`[setup] min: ${randomMinNumber}, max ${randomMaxNumber}, startingPrice: ${startingPrice}`);
  for (let i = 0; i < 100; i++) {
    book.processOrder({
      type: "limit",
      price: Number((startingPrice + (getRandomFloat(3, 10, 2) * -1)).toFixed(2)),
      side: "bid",
      quantity: getRandomFloat(0.1, 10, 5),
    });
    book.processOrder({
      type: "limit",
      price: Number((startingPrice + getRandomFloat(3, 10, 2)).toFixed(2)),
      side: "ask",
      quantity: getRandomFloat(0.1, 10, 5),
    });
  }

  createNewOrder();
});
