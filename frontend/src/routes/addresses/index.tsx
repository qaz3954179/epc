import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Box,
  Card,
  Text,
  Button,
  Badge,
  Heading,
  VStack,
  HStack,
  Input,
  Textarea,
  Checkbox,
  Spinner,
  Center
} from '@chakra-ui/react'
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa'
import { addressService } from '@/client/services'
import type { ShippingAddress } from '@/client/types'

export const Route = createFileRoute('/addresses/')({
  component: AddressesPage,
})

function AddressesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    postal_code: '',
    is_default: false
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.list()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        await addressService.update(editingId, formData)
        alert('更新成功！✅')
      } else {
        await addressService.create(formData)
        alert('添加成功！✅')
      }
      setShowForm(false)
      setEditingId(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败')
    }
  }

  const handleEdit = (address: ShippingAddress) => {
    setEditingId(address.id)
    setFormData({
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      province: address.province,
      city: address.city,
      district: address.district || '',
      detail_address: address.detail_address,
      postal_code: address.postal_code || '',
      is_default: address.is_default
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return

    try {
      await addressService.delete(id)
      alert('删除成功！🗑️')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefault(id)
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    } catch (error: any) {
      alert(error.response?.data?.detail || '设置失败')
    }
  }

  const resetForm = () => {
    setFormData({
      recipient_name: '',
      recipient_phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
      postal_code: '',
      is_default: false
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    )
  }

  const addresses = data?.data.data || []

  return (
    <Box>
      <VStack align="stretch" gap={6} mb={8}>
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <Heading size="2xl" color="purple.600">
              <HStack>
                <FaMapMarkerAlt />
                <Text>收货地址</Text>
              </HStack>
            </Heading>
            <Text color="gray.600" fontSize="lg">管理您的收货地址</Text>
          </VStack>
          {!showForm && (
            <Button
              colorPalette="blue"
              size="lg"
              onClick={() => setShowForm(true)}
            >
              <FaPlus /> 添加地址
            </Button>
          )}
        </HStack>
      </VStack>

      {showForm && (
        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="lg">{editingId ? '编辑地址' : '添加地址'}</Heading>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit}>
              <VStack align="stretch" gap={4}>
                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">收件人 <Text as="span" color="red.500">*</Text></Text>
                    <Input
                      required
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      placeholder="请输入收件人姓名"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">手机号 <Text as="span" color="red.500">*</Text></Text>
                    <Input
                      type="tel"
                      required
                      value={formData.recipient_phone}
                      onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                      placeholder="请输入手机号"
                    />
                  </Box>
                </HStack>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">省份 <Text as="span" color="red.500">*</Text></Text>
                    <Input
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="如：广东省"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">城市 <Text as="span" color="red.500">*</Text></Text>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="如：深圳市"
                    />
                  </Box>
                </HStack>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">区/县</Text>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="如：南山区"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={2} fontWeight="medium">邮政编码</Text>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="如：518000"
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text mb={2} fontWeight="medium">详细地址 <Text as="span" color="red.500">*</Text></Text>
                  <Textarea
                    required
                    rows={3}
                    value={formData.detail_address}
                    onChange={(e) => setFormData({ ...formData, detail_address: e.target.value })}
                    placeholder="街道、门牌号等详细信息"
                  />
                </Box>

                <Checkbox
                  checked={formData.is_default}
                  onCheckedChange={(e) => setFormData({ ...formData, is_default: e.checked as boolean })}
                >
                  设为默认地址
                </Checkbox>

                <HStack gap={3}>
                  <Button flex={1} variant="outline" onClick={handleCancel}>取消</Button>
                  <Button flex={1} colorPalette="blue" type="submit">
                    {editingId ? '保存' : '添加'}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Card.Body>
        </Card.Root>
      )}

      <VStack align="stretch" gap={4}>
        {addresses.map(address => (
          <Card.Root key={address.id}>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <Text fontWeight="bold" fontSize="lg">{address.recipient_name}</Text>
                    <Text color="gray.600">{address.recipient_phone}</Text>
                    {address.is_default && (
                      <Badge colorPalette="blue">
                        <HStack gap={1}>
                          <FaStar />
                          <Text>默认</Text>
                        </HStack>
                      </Badge>
                    )}
                  </HStack>
                </HStack>
                <Text color="gray.600">
                  📍 {address.province} {address.city} {address.district} {address.detail_address}
                  {address.postal_code && ` (${address.postal_code})`}
                </Text>
                <HStack gap={3}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(address)}
                  >
                    <FaEdit /> 编辑
                  </Button>
                  {!address.is_default && (
                    <Button
                      size="sm"
                      colorPalette="green"
                      variant="outline"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <FaStar /> 设为默认
                    </Button>
                  )}
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => handleDelete(address.id)}
                  >
                    <FaTrash /> 删除
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>

      {addresses.length === 0 && !showForm && (
        <Center h="300px">
          <VStack>
            <Text fontSize="xl" color="gray.400">暂无收货地址</Text>
            <Text fontSize="sm" color="gray.400">点击上方按钮添加您的第一个地址</Text>
          </VStack>
        </Center>
      )}
    </Box>
  )
}
