
import { Box, Flex } from "@chakra-ui/react";
import { GREEN_COLOR, RED_COLOR } from "../lib/Constants";

interface Props {
  book: SimpleBook;
  price: number;
}

export function OrderBook(props: Props) {
  const { book, price } = props;

  const renderRow = (type: "bid" | "ask", record: SimpleBookRecord) => {
    return (
      <Flex flexDir="row" position="relative">
        <Flex position="absolute" top={0} bottom={0} left={0} bgColor={type === "ask" ? RED_COLOR : GREEN_COLOR} width={`${((record.incremental ?? 1) / 100) * 100}%`} />
        <Box flexBasis="100px">${record.price.toFixed(2)}</Box>
        <Box>{record.volume}</Box>
      </Flex>
    )
  }

  return (
    <Box mr="12" minWidth="400px">
      <Box>{book.asks.map((record) => renderRow("ask", record))}</Box>
      <Box mt={4} mb={4}>Current Price: ${price.toFixed(2)}</Box>
      <Box>{book.bids.map((record) => renderRow("bid", record))}</Box>
    </Box>
  )
}