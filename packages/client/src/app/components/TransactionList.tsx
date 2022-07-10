import { Box, Flex, Text } from "@chakra-ui/react";
import { timeAgo } from "../lib/Helper";

interface Props {
  txs: TransactionRecord[];
}

export function TransactionList(props: Props) {
  const { txs } = props;

  const renderTxRow = (tx: TransactionRecord) => {
    return (
      <Flex flexDir="row" minWidth="400px">
        <Box flexBasis="100px">${tx.price.toFixed(2)}</Box>
        <Box flexBasis="100px">{tx.quantity}</Box>
        <Box>{timeAgo(tx.time)}</Box>
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