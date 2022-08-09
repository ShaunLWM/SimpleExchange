import { Box, Flex, Text } from "@chakra-ui/react";
import { formatTime } from "../lib/Helper";

interface Props {
  txs: TransactionRecord[];
}

export function TransactionList(props: Props) {
  const { txs } = props;

  const renderTxRow = (tx: TransactionRecord, i: number) => {
    return (
      <Flex flexDir="row" minWidth="400px" key={`${i}-${tx.time}-${tx.txId}`} bgColor={tx.side === "ask" ? "#f29191" : "#b3f291"}>
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