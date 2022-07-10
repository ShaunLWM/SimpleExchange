
import { Box, Flex } from "@chakra-ui/react";

interface Props {
  book: SimpleBook;
  price: number;
}

export function OrderBook(props: Props) {
  const { book, price } = props;

  const renderRow = (type: "bid" | "ask", record: SimpleBookRecord) => {
    return (
      <Flex flexDir="row">
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