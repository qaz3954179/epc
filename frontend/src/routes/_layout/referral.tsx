import { Box, Container, Flex, Heading, Text, Input, Table, Badge } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ReferralsService } from "@/client"
import { Button } from "@/components/ui/button"
import PendingItems from "@/components/Pending/PendingItems"

const Referral = () => {
  const [copied, setCopied] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => ReferralsService.getStats(),
  })

  const { data: referrals, isLoading: listLoading } = useQuery({
    queryKey: ["referrals", "list"],
    queryFn: () => ReferralsService.getList(),
  })

  if (statsLoading && listLoading) {
    return <PendingItems />
  }

  const referralLink = stats
    ? `${window.location.origin}/signup?ref=${stats.referral_code}`
    : ""

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Container maxW="full" pb={8}>
      <Heading size="lg" mb={6}>
        推广
      </Heading>

      {/* 推荐码和链接 */}
      <Box bg="white" borderRadius={16} p={6} mb={6} boxShadow="sm">
        <Text fontWeight="bold" fontSize="lg" mb={4}>
          📣 我的邀请链接
        </Text>
        <Flex direction="column" gap={4}>
          <Flex align="center" gap={3}>
            <Text fontSize="sm" color="description" whiteSpace="nowrap">
              推荐码：
            </Text>
            <Badge
              fontSize="md"
              px={3}
              py={1}
              borderRadius={8}
              colorPalette="purple"
              variant="subtle"
              letterSpacing="wider"
            >
              {stats?.referral_code || "---"}
            </Badge>
          </Flex>
          <Flex align="center" gap={3}>
            <Input
              value={referralLink}
              readOnly
              size="sm"
              borderRadius={8}
              bg="content.bg"
              flex={1}
            />
            <Button
              size="sm"
              onClick={handleCopy}
              variant={copied ? "outline" : "solid"}
              minW="80px"
            >
              {copied ? "已复制 ✓" : "复制链接"}
            </Button>
          </Flex>
          <Text fontSize="xs" color="description">
            分享这个链接给朋友，他们注册后你将获得{" "}
            <Text as="span" fontWeight="bold" color="orange.500">
              {stats?.coins_per_referral || 50} 学习币
            </Text>{" "}
            奖励！
          </Text>
        </Flex>
      </Box>

      {/* 推荐统计 */}
      <Flex gap={6} mb={6} direction={{ base: "column", md: "row" }}>
        <Box flex={1} bg="white" borderRadius={16} p={6} boxShadow="sm" textAlign="center">
          <Text fontSize="sm" color="description" mb={2}>
            已邀请人数
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="purple.500">
            {stats?.total_referred || 0}
          </Text>
        </Box>
        <Box flex={1} bg="white" borderRadius={16} p={6} boxShadow="sm" textAlign="center">
          <Text fontSize="sm" color="description" mb={2}>
            每次邀请奖励
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="orange.500">
            {stats?.coins_per_referral || 50}
          </Text>
          <Text fontSize="xs" color="description">学习币</Text>
        </Box>
        <Box flex={1} bg="white" borderRadius={16} p={6} boxShadow="sm" textAlign="center">
          <Text fontSize="sm" color="description" mb={2}>
            累计获得奖励
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="green.500">
            {stats?.total_coins_earned || 0}
          </Text>
          <Text fontSize="xs" color="description">学习币</Text>
        </Box>
      </Flex>

      {/* 推荐列表 */}
      <Box bg="white" borderRadius={16} p={6} boxShadow="sm">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight="bold" fontSize="lg">
            👥 已邀请用户
          </Text>
          <Text fontSize="xs" color="description">
            共 {referrals?.count || 0} 人
          </Text>
        </Flex>

        {referrals && referrals.count > 0 ? (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>用户名</Table.ColumnHeader>
                <Table.ColumnHeader>邮箱</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {referrals.data.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.full_name || "-"}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <Flex justify="center" align="center" h="100px" color="description">
            <Text>还没有邀请记录，快去分享你的邀请链接吧！</Text>
          </Flex>
        )}
      </Box>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/referral")({
  component: Referral,
})
