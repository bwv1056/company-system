'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    companyName: '',
    companyPerson: '',
    email: '',
    address: '',
    phone: '',
  })

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/v1/customers/${params.id}`)
        const result = await response.json()
        if (result.success) {
          setFormData({
            companyName: result.data.companyName || '',
            companyPerson: result.data.companyPerson || '',
            email: result.data.email || '',
            address: result.data.address || '',
            phone: result.data.phone || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchCustomer()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/v1/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()

      if (!result.success) {
        toast({ variant: 'destructive', title: 'エラー', description: result.error?.message })
        return
      }

      toast({ title: '成功', description: '顧客情報を更新しました' })
      router.push('/customers')
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: '顧客情報の更新に失敗しました' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">読み込み中...</p></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">顧客編集</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">顧客情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">会社名 *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPerson">担当者名</Label>
              <Input
                id="companyPerson"
                value={formData.companyPerson}
                onChange={(e) => setFormData({ ...formData, companyPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '更新中...' : '更新'}
          </Button>
        </div>
      </form>
    </div>
  )
}
