import { Box, Flex, Text } from "@chakra-ui/react";
import { formatTime } from "../lib/Helper";

interface Props {
  txs: TransactionRecord[];
}

export function TransactionList(props: Props) {
  const { txs } = props;

  const renderTxRow = (tx: TransactionRecord, i: number) => {
    // if tx.side === "ask", means user is selling and someone bought from him - so it's #b3f291 green since someone bought
    return (
      <Flex flexDir="row" minWidth="400px" key={`${i}-${tx.time}-${tx.txId}`} bgColor={tx.side === "ask" ? "#b3f291" : "#f29191"}>
        <Box flexBasis="100px">${tx.price.toFixed(2)}</Box>
        <Box flexBasis="100px">{tx.quantity}</Box>
        <Box>{formatTime(tx.time)}</Box>
      </Flex>
    )
  }

  return (
    <Flex flexDir="column">
      <Text>Transactions</Text>
      {txs.map(renderTxRow)}
    </Flex>
  )
}