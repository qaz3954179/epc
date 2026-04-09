import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import {
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiGift,
  FiHeart,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi"

import { Button } from "@/components/ui/button"
import Logo from "/assets/images/logo.svg"

export const Route = createFileRoute("/landing/parent")({
  component: ParentLanding,
  validateSearch: (search: Record<string, unknown>) => ({
    ref: (search.ref as string) || "",
  }),
})

/* ───── 数据 ───── */

const painPoints = [
  { icon: "😩", text: "催了100遍，作业还是没动" },
  { icon: "😤", text: "说好的学半小时，5分钟就跑了" },
  { icon: "😰", text: "奖励给了，下次还是不想学" },
  { icon: "🤯", text: "吼完孩子，自己也后悔" },
]

const features = [
  {
    icon: FiCheckCircle,
    title: "任务驱动",
    desc: "把学习拆成小任务，完成就得币，孩子看得见进步",
    color: "#FF6B35",
  },
  {
    icon: FiGift,
    title: "奖品兑换",
    desc: "攒够学习币换心仪奖品，比直接给零花钱更有动力",
    color: "#06D6A0",
  },
  {
    icon: FiBarChart2,
    title: "成长可视化",
    desc: "热力图记录每一天的努力，连续打卡超有成就感",
    color: "#FFD60A",
  },
  {
    icon: FiTrendingUp,
    title: "习惯养成",
    desc: "日常任务+周任务，21天养成好习惯不是梦",
    color: "#8B5CF6",
  },
]

const testimonials = [
  {
    name: "乐乐妈",
    avatar: "👩",
    text: "用了两周，孩子居然主动说「妈妈我要做任务」，差点感动哭",
    tag: "小学三年级",
  },
  {
    name: "小鱼爸",
    avatar: "👨",
    text: "以前每天为作业吵架，现在他自己规划任务，我只负责确认完成",
    tag: "小学五年级",
  },
  {
    name: "糖糖妈",
    avatar: "👩‍🦰",
    text: "女儿攒了200个币换了一套画笔，那个开心劲儿比直接买给她强多了",
    tag: "小学一年级",
  },
]

const steps = [
  { num: "1", title: "注册账号", desc: "30秒完成，邮箱验证即可" },
  { num: "2", title: "设置任务", desc: "根据孩子情况自定义学习任务和奖励" },
  { num: "3", title: "开始学习", desc: "孩子完成任务获得学习币" },
  { num: "4", title: "兑换奖品", desc: "攒够学习币，换取心仪奖品" },
]

/* ───── 组件 ───── */

function ParentLanding() {
  const search = Route.useSearch()
  const signupLink = search.ref ? `/signup?ref=${search.ref}` : "/signup"

  return (
    <Box minH="100vh" bg="white" overflow="hidden">
      {/* Hero */}
      <Box
        bg="linear-gradient(135deg, #FFF8F0 0%, #FFF0FA 50%, #F0FFF8 100%)"
        pt={{ base: 12, md: 20 }}
        pb={{ base: 16, md: 24 }}
        position="relative"
      >
        {/* 装饰元素 */}
        <Box
          position="absolute"
          top="10%"
          left="5%"
          fontSize="4xl"
          opacity={0.15}
          transform="rotate(-15deg)"
        >
          ⭐
        </Box>
        <Box
          position="absolute"
          top="20%"
          right="8%"
          fontSize="3xl"
          opacity={0.15}
          transform="rotate(10deg)"
        >
          🎯
        </Box>
        <Box
          position="absolute"
          bottom="15%"
          left="10%"
          fontSize="3xl"
          opacity={0.12}
        >
          🏆
        </Box>

        <Container maxW="4xl" textAlign="center">
          <Image
            src={Logo}
            alt="学习币"
            h="48px"
            mx="auto"
            mb={6}
          />
          <Heading
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="800"
            lineHeight="1.3"
            mb={4}
          >
            不吼不骂
            <Text as="span" color="#FF6B35">
              ，
            </Text>
            <br />
            让孩子
            <Text as="span" color="#FF6B35">
              自己抢着学
            </Text>
          </Heading>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="#6B7280"
            mb={8}
            maxW="lg"
            mx="auto"
          >
            用游戏化的学习币系统，把「要我学」变成「我要学」
            <br />
            已有超过 1000+ 家庭在使用
          </Text>
          <Flex gap={4} justify="center" flexWrap="wrap">
            <RouterLink to={signupLink}>
              <Button
                size="lg"
                bg="#FF6B35"
                color="white"
                px={8}
                rounded="full"
                _hover={{ bg: "#E55A2B", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                boxShadow="0 4px 14px rgba(255,107,53,0.4)"
              >
                🎉 免费注册体验
              </Button>
            </RouterLink>
            <Button
              size="lg"
              variant="outline"
              borderColor="#FF6B35"
              color="#FF6B35"
              px={8}
              rounded="full"
              _hover={{ bg: "rgba(255,107,53,0.05)" }}
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              了解更多 ↓
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* 痛点共鸣 */}
      <Box py={{ base: 12, md: 16 }} bg="#FAFAFA">
        <Container maxW="4xl">
          <Heading
            textAlign="center"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={2}
          >
            这些场景，是不是很熟悉？
          </Heading>
          <Text textAlign="center" color="#9CA3AF" mb={8} fontSize="sm">
            每个家长都经历过的崩溃瞬间
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap={4}
          >
            {painPoints.map((p) => (
              <Flex
                key={p.text}
                bg="white"
                p={5}
                rounded="16px"
                align="center"
                gap={4}
                boxShadow="0 1px 3px rgba(0,0,0,0.06)"
              >
                <Text fontSize="2xl">{p.icon}</Text>
                <Text fontSize="md" color="#374151">
                  {p.text}
                </Text>
              </Flex>
            ))}
          </Grid>
          <Text
            textAlign="center"
            mt={8}
            fontSize="lg"
            fontWeight="600"
            color="#FF6B35"
          >
            试试换个方式 👇
          </Text>
        </Container>
      </Box>

      {/* 功能亮点 */}
      <Box id="features" py={{ base: 12, md: 16 }}>
        <Container maxW="4xl">
          <Heading
            textAlign="center"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={2}
          >
            学习币，怎么让孩子爱上学习？
          </Heading>
          <Text textAlign="center" color="#9CA3AF" mb={10} fontSize="sm">
            四个核心能力，构建正向激励闭环
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
            gap={6}
          >
            {features.map((f) => (
              <Box
                key={f.title}
                p={6}
                rounded="20px"
                bg="white"
                boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                }}
                transition="all 0.3s"
              >
                <Flex
                  w="48px"
                  h="48px"
                  rounded="12px"
                  bg={`${f.color}15`}
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <f.icon size={22} color={f.color} />
                </Flex>
                <Text fontWeight="700" fontSize="lg" mb={2}>
                  {f.title}
                </Text>
                <Text color="#6B7280" fontSize="sm" lineHeight="1.6">
                  {f.desc}
                </Text>
              </Box>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 用户评价 */}
      <Box py={{ base: 12, md: 16 }} bg="#FAFAFA">
        <Container maxW="4xl">
          <Heading
            textAlign="center"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={2}
          >
            听听其他家长怎么说
          </Heading>
          <Text textAlign="center" color="#9CA3AF" mb={10} fontSize="sm">
            真实用户反馈
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap={5}
          >
            {testimonials.map((t) => (
              <Box
                key={t.name}
                bg="white"
                p={6}
                rounded="16px"
                boxShadow="0 1px 3px rgba(0,0,0,0.06)"
              >
                <Flex align="center" gap={3} mb={4}>
                  <Text fontSize="2xl">{t.avatar}</Text>
                  <Box>
                    <Text fontWeight="600" fontSize="sm">
                      {t.name}
                    </Text>
                    <Text fontSize="xs" color="#9CA3AF">
                      {t.tag}
                    </Text>
                  </Box>
                </Flex>
                <Text fontSize="sm" color="#4B5563" lineHeight="1.7">
                  "{t.text}"
                </Text>
                <Flex mt={3} gap={1}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar
                      key={i}
                      size={14}
                      color="#FFD60A"
                      fill="#FFD60A"
                    />
                  ))}
                </Flex>
              </Box>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 使用步骤 */}
      <Box py={{ base: 12, md: 16 }}>
        <Container maxW="4xl">
          <Heading
            textAlign="center"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={10}
          >
            4步开始，超简单
          </Heading>
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
            gap={6}
          >
            {steps.map((s, idx) => (
              <VStack key={s.num} textAlign="center" gap={3}>
                <Flex
                  w="56px"
                  h="56px"
                  rounded="full"
                  bg="#FF6B35"
                  color="white"
                  align="center"
                  justify="center"
                  fontSize="xl"
                  fontWeight="800"
                >
                  {s.num}
                </Flex>
                <Text fontWeight="700">{s.title}</Text>
                <Text fontSize="sm" color="#6B7280">
                  {s.desc}
                </Text>
                {idx < steps.length - 1 && (
                  <Text
                    display={{ base: "none", md: "block" }}
                    position="absolute"
                    color="#D1D5DB"
                    fontSize="xl"
                  >
                    →
                  </Text>
                )}
              </VStack>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        py={{ base: 12, md: 16 }}
        bg="linear-gradient(135deg, #FF6B35 0%, #FF8F65 100%)"
      >
        <Container maxW="3xl" textAlign="center">
          <Flex justify="center" gap={2} mb={4}>
            <FiHeart size={24} color="white" />
            <FiAward size={24} color="white" />
          </Flex>
          <Heading
            color="white"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={3}
          >
            给孩子一个爱上学习的理由
          </Heading>
          <Text color="rgba(255,255,255,0.85)" mb={8} fontSize="md">
            完全免费，注册即用，不满意随时走
          </Text>
          <RouterLink to={signupLink}>
            <Button
              size="lg"
              bg="white"
              color="#FF6B35"
              px={10}
              rounded="full"
              fontWeight="700"
              _hover={{ transform: "translateY(-2px)" }}
              transition="all 0.2s"
              boxShadow="0 4px 14px rgba(0,0,0,0.15)"
            >
              立即免费注册 →
            </Button>
          </RouterLink>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={8} textAlign="center">
        <Text fontSize="xs" color="#9CA3AF">
          © {new Date().getFullYear()} 学习币 Education Reward Plan of Children
        </Text>
      </Box>
    </Box>
  )
}

export default ParentLanding
