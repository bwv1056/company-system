'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface CommentFormProps {
  reportId: number
}

export function CommentForm({ reportId }: CommentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/v1/daily-reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coment: newComment }),
      })
      const result = await response.json()

      if (result.success) {
        setNewComment('')
        toast({ title: '成功', description: 'コメントを投稿しました' })
        router.refresh()
      } else {
        toast({ variant: 'destructive', title: 'エラー', description: result.error?.message })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: 'コメントの投稿に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-4 border-t">
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="コメントを入力..."
        rows={3}
      />
      <Button
        className="mt-2"
        onClick={handleSubmitComment}
        disabled={isSubmitting || !newComment.trim()}
      >
        {isSubmitting ? '投稿中...' : 'コメント投稿'}
      </Button>
    </div>
  )
}
