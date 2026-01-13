'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  id?: number
  customerId: string
  visitTime: string
  visitContent: string
}

export default function EditDailyReportPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])

  const [reportDate, setReportDate] = useState('')
  const [problem, setProblem] = useState('')
  const [plan, setPlan] = useState('')
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, customersRes] = await Promise.all([
          fetch(`/api/v1/daily-reports/${params.id}`),
          fetch('/api/v1/masters/customers'),
        ])

        const reportResult = await reportRes.json()
        const customersResult = await customersRes.json()

        if (customersResult.success) {
          setCustomers(customersResult.data.items)
        }

        if (reportResult.success) {
          const report = reportResult.data
          setReportDate(report.reportDate)
          setProblem(report.problem || '')
          setPlan(report.plan || '')
          setVisitRecords(
            report.visitRecords.map((vr: { id: number; customer: { id: number }; visitTime: string | null; visitContent: string }) => ({
              id: vr.id,
              customerId: vr.customer.id.toString(),
              visitTime: vr.visitTime || '',
              visitContent: vr.visitContent,
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [params.id])

  const addVisitRecord = () => {
    setVisitRecords([...visitRecords, { customerId: '', visitTime: '', visitContent: '' }])
  }

  const removeVisitRecord = (index: number) => {
    setVisitRecords(visitRecords.filter((_, i) => i !== index))
  }

  const updateVisitRecord = (index: number, field: keyof VisitRecord, value: string) => {
    const newRecords = [...visitRecords]
    newRecords[index] = { ...newRecords[index], [field]: value }
    setVisitRecords(newRecords)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validVisitRecords = visitRecords
        .filter(vr => vr.customerId && vr.visitContent)
        .map(vr => ({
          id: vr.id,
          customerId: parseInt(vr.customerId),
          visitTime: vr.visitTime || null,
          visitContent: vr.visitContent,
        }))

      const response = await fetch(`/api/v1/daily-reports/${params.id}`, {
        method: 'PUT',
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
          description: result.error?.message || '日報の更新に失敗しました',
        })
        return
      }

      toast({
        title: '成功',
        description: '日報を更新しました',
      })
      router.push(`/daily-reports/${params.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '日報の更新に失敗しました',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">読み込み中...</p></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日報編集</h1>

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
            {visitRecords.length === 0 ? (
              <p className="text-gray-500">訪問記録がありません</p>
            ) : (
              visitRecords.map((record, index) => (
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVisitRecord(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
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
