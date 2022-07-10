import dayjs from 'dayjs';
import { Socket, io } from "socket.io-client";
import RelativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(RelativeTime);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:8081');

export function timeAgo(time: number) {
  return dayjs().to(time);
}