import { PrizesService } from "@/client"
import type { PrizePublic } from "@/client"
import AddPrize from "@/components/Prizes/AddPrize"
import EditPrize from "@/components/Prizes/EditPrize"
import DeletePrize from "@/components/Prizes/DeletePrize"
import PendingItems from "@/components/Pending/PendingItems"
import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

function getPrizesQueryOptions() {
  return {
    queryFn: () => PrizesService.readPrizes({}),
    queryKey: ["prizes"],
  }
}

const PrizeCard = ({ prize }: { prize: PrizePublic }) => {
  return (
    <Box
      bg="white"
      borderRadius={16}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
    >
      {prize.image_url ? (
        <Image
          src={prize.image_url}
          alt={prize.name}
          w="100%"
          h="200px"
          objectFit="cover"
        />
      ) : (
        <Flex
          w="100%"
          h="200px"
          bg="gray.100"
          align="center"
          justify="center"
        >
          <Text color="gray.400" fontSize="3xl">
            🎁
          </Text>
        </Flex>
      )}
      <Box p={4}>
        <Flex justify="space-between" align="start" mb={2}>
          <Text fontWeight="bold" fontSize="lg" flex={1} lineClamp={2}>
            {prize.name}
          </Text>
          {prize.stock > 0 ? (
            <Badge colorPalette="green" ml={2}>
              库存 {prize.stock}
            </Badge>
          ) : (
            <Badge colorPalette="red" ml={2}>
              缺货
            </Badge>
          )}
        </Flex>

        {prize.description && (
          <Text color="gray.600" fontSize="sm" mb={3} lineClamp={2}>
            {prize.description}
          </Text>
        )}

        <Flex justify="space-between" align="center" mb={3}>
          {prize.price && (
            <Text color="orange.500" fontWeight="medium">
              ¥{prize.price.toFixed(2)}
            </Text>
          )}
          <Badge colorPalette="blue" fontSize="md" px={2} py={1}>
            {prize.coins_cost} 学习币
          </Badge>
        </Flex>

        <Flex gap={2}>
          <EditPrize prize={prize} />
          <DeletePrize id={prize.id} />
        </Flex>
      </Box>
    </Box>
  )
}

const Prizes = () => {
  const { data, isLoading } = useQuery(getPrizesQueryOptions())

  const prizes = data?.data ?? []

  if (isLoading) {
    return <PendingItems />
  }

  return (
    <Container maxW="full">
      <Heading size="lg" mb={6}>
        <Flex justifyContent="space-between" alignItems="center">
          奖品管理
          <AddPrize />
        </Flex>
      </Heading>

      {prizes.length === 0 ? (
        <Flex
          bg="white"
          borderRadius={16}
          p={10}
          justifyContent="center"
          alignItems="center"
          direction="column"
          gap={2}
        >
          <Text color="gray.400" fontSize="lg">
            🎁 暂无奖品
          </Text>
          <Text color="gray.400" fontSize="sm">
            点击右上角添加奖品
          </Text>
        </Flex>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
          }}
          gap={6}
        >
          {prizes.map((prize) => (
            <PrizeCard key={prize.id} prize={prize} />
          ))}
        </Grid>
      )}
    </Container>
  )
}

export const Route = createFileRoute("/_layout/prizes")({
  component: Prizes,
})
