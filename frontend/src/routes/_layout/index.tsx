import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from "@tanstack/react-query"
import { ErpcCoins, ErpcListAll, ErpcWithdraw } from "erpc-icons/erpc"
import bannerImg from '../../../public/assets/images/banner_4x.png'
import useAuth from "@/hooks/useAuth"
import { TaskCompletionsService } from "@/client"
import { Box, Button, Container, Flex, Input, List, Span, Text } from '@chakra-ui/react'

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const coins = user?.coins ?? 0

  const { data: coinLogs } = useQuery({
    queryKey: ["coinLogs", "today"],
    queryFn: TaskCompletionsService.getTodayCoinLogs,
  })

  const logs = coinLogs?.data ?? []

  return (
    <>
      <Container maxW="full" padding={0}>
        <Flex bgImg={`url(${bannerImg})`} direction={'column'} justify={'center'} align={'flex-start'} px={12} h={300} bgSize={'cover'} marginBottom={6} rounded={6}>
          <Text marginBottom={4} fontSize={36} fontWeight={"bolder"} color={'white'}>神奇玩具城</Text>
          <Text fontSize={20} marginBottom={6} color={'white'}>用学习币兑换你喜欢的玩具</Text>
          <Button bg={"primary"}>立即兑换</Button>
        </Flex>
        <Box
          h={192}
          bg={'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0)), linear-gradient(90deg, #FF6B6B 0%, #4A90E2 100%);'}
          rounded={16}
          padding={8}
          boxSizing={'border-box'}
        >
          <Flex
            direction={"row"}
            justify={'space-between'}
          >
            <Box>
              <Text color={'white'} fontWeight={'bold'} fontSize={'lg'}>学习币余额</Text>
              <Text color={'white'} fontWeight={'bold'} fontSize={'xxx-large'}>{coins}</Text>
              <Text color={'whiteAlpha.800'} fontSize={'sm'}>快去完成任务赚取学习币吧~</Text>
            </Box>
            <Box aspectRatio={"square"} w={128} borderRadius={64} bg={"whiteAlpha.200"}>
              <Flex align={'center'} justify={'center'} h={"full"} w={'full'}>
                <ErpcCoins size={60} fill="white" />
              </Flex>
            </Box>
          </Flex>
        </Box>
        <Flex h={372} marginTop={6} gap={6}>
          <Box bg="white" w={'1/2'} borderRadius={16} padding={6} boxSizing={'border-box'}>
            <Flex h={6} justify={'space-between'} align={'center'} marginBottom={6}>
              <Span fontWeight={'bolder'} fontSize={20} color={'black'}>学习币明细</Span>
              <Flex asChild justify={'center'} align={'center'} color="primary">
                <Link to={'/coins/logs'}>
                  <ErpcListAll color="primary" size={16} />
                  <Span fontWeight={'bolder'} fontSize={16} color={'primary'} marginLeft={2}>查看全部</Span>
                </Link>
              </Flex>
            </Flex>
            {logs.length === 0 ? (
              <Flex justify={'center'} align={'center'} h={200} color="description">
                <Text>今天还没有学习币记录哦~</Text>
              </Flex>
            ) : (
              <Flex align={'center'} direction={"column"} overflow={'auto'} h={280} width={'100%'} color="description">
                {
                  logs.map((item, i) => (
                    <Flex key={i} marginBottom={4} bg="content.bg" flex={1} w={'100%'} p={4} borderRadius={8} h={76}>
                      <Box flex="1">
                        <Text fontWeight={'bold'} fontSize={16}>{item.name}</Text>
                        <Text color={"description"} fontSize={14}>{new Date(item.completed_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </Box>
                      <Flex justify={'flex-end'} align={'center'} fontSize={16} color="primary" fontWeight={'bold'}>
                        {item.amount < 0 ? item.amount : `+${item.amount}`}
                      </Flex>
                    </Flex>
                  ))
                }
              </Flex>

            )}
          </Box>
          <Box bg="white" w={'1/2'} borderRadius={16} padding={6} boxSizing={'border-box'}>
            <Flex h={6} justify={'space-between'} align={'center'} marginBottom={6}>
              <Span fontWeight={'bolder'} fontSize={20} color={'black'}>学习币提现</Span>
              <Flex asChild justify={'center'} align={'center'} color="primary">
                <Link to={'/'}>
                  <ErpcWithdraw color="primary" size={16} />
                  <Span fontWeight={'bolder'} fontSize={16} color={'primary'} marginLeft={2}>提现记录</Span>
                </Link>
              </Flex>
            </Flex>
            <Flex marginBottom={4}>
              <Input marginRight={4} placeholder="请输入提现金额" _focus={{
                borderColor: "primary",
              }} _focusVisible={{
                outlineColor: "primary",
              }}></Input>
              <Button bg={"primary"}>申请提现</Button>
            </Flex>
            <Text color="description" marginBottom={2}>提现规则：</Text>
            <List.Root>
              <List.Item color="description" marginBottom={1}>最低提现金额为 100 学习币</List.Item>
              <List.Item color="description" marginBottom={1}>提现申请将在 1-3 个工作日内处理</List.Item>
              <List.Item color="description" marginBottom={1}>如有疑问请联系班主任</List.Item>
            </List.Root>
          </Box>
        </Flex>
      </Container>
    </>
  )
}
