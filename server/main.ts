import cors from 'cors';
import express from "express";
import { createServer } from "http";
import { OrderBook } from "lob.js";
import { Server, Socket } from "socket.io";
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

const users: Record<string, Socket> = {};

book.on('order:new', () => {
  for (const [, socket] of Object.entries(users)) {
    socket.emit("orderbook:init", book.getSimpleBook());
  }
});

book.on("transaction:new", (tx) => {
  for (const [, socket] of Object.entries(users)) {
    socket.emit("transaction:new", tx);
    startingPrice = tx.price as any;
  }
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
  setTimeout(() => {
    const side = getRandomInt(0, 1);
    // side 0 = bid, 1 = ask
    const order = {
      type: "limit",
      price: Number((startingPrice + (side === 0 ? getRandomFloat(0.1, 0.2, 2) * -1 : getRandomFloat(0.1, 0.2, 2))).toFixed(2)),
      side: side === 0 ? "bid" : "ask",
      quantity: getRandomFloat(0.1, 10, 5),
    };

    const TYPE_OF_USER = getRandomInt(0, 10);
    console.log(`Generated : ${TYPE_OF_USER}`);
    switch (TYPE_OF_USER) {
      case 0:
        // normal limit order buy
        order.side = "ask"; // buy bids
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        break;
      case 1:
        // normal limit order sell
        order.side = "bid"; // buy bids
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2))).toFixed(2));
        order.quantity = getRandomFloat(0.1, 5, 5);
        break;
      case 2:
        // whale limit order buy
        order.side = "ask"; // buy bids
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2) * -1)).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        break;
      case 3:
        // normal limit order sell
        order.side = "bid"; // buy bids
        order.price = Number((startingPrice + (getRandomFloat(0.1, 0.3, 2))).toFixed(2));
        order.quantity = getRandomFloat(8, 15, 5);
        break;
      default:
        break
    }


    book.processOrder(order);
    console.log(order);
    createNewOrder();
  }, getRandomInt(500, 1000));
}

httpServer.listen(8081, () => {
  console.log("listening on port 8081");

  console.log(`min: ${randomMinNumber}, max ${randomMaxNumber}, startingPrice: ${startingPrice}`);
  const ordersCount = getRandomInt(1, 20);
  console.log(`Processing ${ordersCount} orders`);
  for (let i = 0; i < ordersCount; i++) {
    const side = getRandomInt(0, 1);
    book.processOrder({
      type: "limit",
      price: Number((startingPrice + (side === 0 ? getRandomFloat(0.1, 0.5, 2) * -1 : getRandomFloat(0.1, 0.5, 2))).toFixed(2)),
      side: side === 0 ? "bid" : "ask",
      quantity: getRandomFloat(0.1, 10, 5),
    })
  }

  createNewOrder();
});
