'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function EditSalesPersonPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    isManager: false,
  })

  useEffect(() => {
    const fetchSalesPerson = async () => {
      try {
        const response = await fetch(`/api/v1/sales-persons/${params.id}`)
        const result = await response.json()
        if (result.success) {
          setFormData({
            name: result.data.name || '',
            email: result.data.email || '',
            password: '',
            department: result.data.department || '',
            isManager: result.data.isManager || false,
          })
        }
      } catch (error) {
        console.error('Failed to fetch sales person:', error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchSalesPerson()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        department: formData.department || null,
        isManager: formData.isManager,
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/v1/sales-persons/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      const result = await response.json()

      if (!result.success) {
        toast({ variant: 'destructive', title: 'エラー', description: result.error?.message })
        return
      }

      toast({ title: '成功', description: '営業担当者情報を更新しました' })
      router.push('/sales-persons')
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: '営業担当者情報の更新に失敗しました' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">読み込み中...</p></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">営業担当者編集</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">担当者情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード（変更する場合のみ入力）</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">部署</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isManager"
                checked={formData.isManager}
                onChange={(e) => setFormData({ ...formData, isManager: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isManager">管理者権限</Label>
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
