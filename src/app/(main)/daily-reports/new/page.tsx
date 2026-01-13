'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2 } from 'lucide-react'

interface Customer {
  id: number
  companyName: string
}

interface VisitRecord {
  customerId: string
  visitTime: string
  visitContent: string
}

export default function NewDailyReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [problem, setProblem] = useState('')
  const [plan, setPlan] = useState('')
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([
    { customerId: '', visitTime: '', visitContent: '' }
  ])

  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await fetch('/api/v1/masters/customers')
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data.items)
      }
    }
    fetchCustomers()
  }, [])

  const addVisitRecord = () => {
    setVisitRecords([...visitRecords, { customerId: '', visitTime: '', visitContent: '' }])
  }

  const removeVisitRecord = (index: number) => {
    setVisitRecords(visitRecords.filter((_, i) => i !== index))
  }

  const updateVisitRecord = (index: number, field: keyof VisitRecord, value: string) => {
    const newRecords = [...visitRecords]
    newRecords[index][field] = value
    setVisitRecords(newRecords)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validVisitRecords = visitRecords
        .filter(vr => vr.customerId && vr.visitContent)
        .map(vr => ({
          customerId: parseInt(vr.customerId),
          visitTime: vr.visitTime || null,
          visitContent: vr.visitContent,
        }))

      const response = await fetch('/api/v1/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportDate,
          problem: problem || null,
          plan: plan || null,
          visitRecords: validVisitRecords,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'エラー',
          description: result.error?.message || '日報の作成に失敗しました',
        })
        return
      }

      toast({
        title: '成功',
        description: '日報を作成しました',
      })
      router.push(`/daily-reports/${result.data.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '日報の作成に失敗しました',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日報作成</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reportDate">報告日 *</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">訪問記録</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVisitRecord}>
              <Plus className="h-4 w-4 mr-2" />
              行追加
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {visitRecords.map((record, index) => (
              <div key={index} className="flex gap-4 items-start p-4 border rounded-md">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>顧客 *</Label>
                      <Select
                        value={record.customerId}
                        onValueChange={(value) => updateVisitRecord(index, 'customerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>訪問時刻</Label>
                      <Input
                        type="time"
                        value={record.visitTime}
                        onChange={(e) => updateVisitRecord(index, 'visitTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>訪問内容 *</Label>
                    <Textarea
                      value={record.visitContent}
                      onChange={(e) => updateVisitRecord(index, 'visitContent', e.target.value)}
                      placeholder="訪問内容を入力してください"
                    />
                  </div>
                </div>
                {visitRecords.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVisitRecord(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">課題・相談（Problem）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="現在の課題や相談事項を入力してください"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">明日やること（Plan）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="明日の予定を入力してください"
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </div>
  )
}
