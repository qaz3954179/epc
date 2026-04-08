import { Box, Flex, Text } from "@chakra-ui/react"
import type { HeatmapData } from "@/client"

const CELL_SIZE = 14
const GAP = 3

const getColor = (count: number): string => {
  if (count === 0) return "#ebedf0"
  if (count <= 1) return "#9be9a8"
  if (count <= 3) return "#40c463"
  if (count <= 5) return "#30a14e"
  return "#216e39"
}

const WEEKDAY_LABELS = ["一", "", "三", "", "五", "", "日"]

interface HeatmapChartProps {
  data: HeatmapData
}

const HeatmapChart = ({ data }: HeatmapChartProps) => {
  const days = data.days

  // Build weeks grid (columns of 7 rows, Mon=0 to Sun=6)
  const weeks: Array<Array<{ date: string; count: number } | null>> = []

  if (days.length > 0) {
    // Figure out what weekday the first day is (0=Mon, 6=Sun)
    const firstDate = new Date(days[0].date)
    const firstWeekday = (firstDate.getDay() + 6) % 7 // convert Sun=0 to Mon=0 system

    // Pad the first week with nulls
    let currentWeek: Array<{ date: string; count: number } | null> = []
    for (let i = 0; i < firstWeekday; i++) {
      currentWeek.push(null)
    }

    for (const day of days) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(day)
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }
  }

  // Month labels
  const monthLabels: Array<{ label: string; weekIndex: number }> = []
  let lastMonth = -1
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

  for (let wi = 0; wi < weeks.length; wi++) {
    const firstDay = weeks[wi].find((d) => d !== null)
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: monthNames[month], weekIndex: wi })
        lastMonth = month
      }
    }
  }

  return (
    <Box>
      {/* Stats row */}
      <Flex gap={6} mb={4} flexWrap="wrap">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="primary">
            {data.current_streak}
          </Text>
          <Text fontSize="xs" color="description">当前连续天数</Text>
        </Box>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="primary">
            {data.longest_streak}
          </Text>
          <Text fontSize="xs" color="description">最长连续天数</Text>
        </Box>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="primary">
            {data.total_completions}
          </Text>
          <Text fontSize="xs" color="description">总完成次数</Text>
        </Box>
      </Flex>

      {/* Heatmap grid */}
      <Box overflowX="auto" pb={2}>
        {/* Month labels */}
        <Flex ml={`${(CELL_SIZE + GAP) + GAP}px`} mb={1} position="relative" h="16px">
          {monthLabels.map((m) => (
            <Text
              key={`${m.label}-${m.weekIndex}`}
              fontSize="xs"
              color="description"
              position="absolute"
              left={`${m.weekIndex * (CELL_SIZE + GAP)}px`}
            >
              {m.label}
            </Text>
          ))}
        </Flex>

        <Flex>
          {/* Weekday labels */}
          <Flex direction="column" gap={`${GAP}px`} mr={`${GAP}px`} pt="1px">
            {WEEKDAY_LABELS.map((label, i) => (
              <Flex
                key={i}
                h={`${CELL_SIZE}px`}
                w={`${CELL_SIZE}px`}
                align="center"
                justify="center"
              >
                <Text fontSize="9px" color="description">{label}</Text>
              </Flex>
            ))}
          </Flex>

          {/* Grid */}
          <Flex gap={`${GAP}px`}>
            {weeks.map((week, wi) => (
              <Flex key={wi} direction="column" gap={`${GAP}px`}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di] ?? null
                  if (!day) {
                    return (
                      <Box
                        key={di}
                        w={`${CELL_SIZE}px`}
                        h={`${CELL_SIZE}px`}
                      />
                    )
                  }
                  return (
                    <Box
                      key={di}
                      w={`${CELL_SIZE}px`}
                      h={`${CELL_SIZE}px`}
                      bg={getColor(day.count)}
                      borderRadius="2px"
                      title={`${day.date}: ${day.count} 次`}
                      cursor="pointer"
                      _hover={{ outline: "1px solid #333" }}
                    />
                  )
                })}
              </Flex>
            ))}
          </Flex>
        </Flex>

        {/* Legend */}
        <Flex mt={2} align="center" justify="flex-end" gap={1}>
          <Text fontSize="xs" color="description" mr={1}>少</Text>
          {[0, 1, 2, 4, 6].map((c) => (
            <Box
              key={c}
              w={`${CELL_SIZE}px`}
              h={`${CELL_SIZE}px`}
              bg={getColor(c)}
              borderRadius="2px"
            />
          ))}
          <Text fontSize="xs" color="description" ml={1}>多</Text>
        </Flex>
      </Box>
    </Box>
  )
}

export default HeatmapChart
