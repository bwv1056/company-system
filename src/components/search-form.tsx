'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchField {
  name: string
  label: string
  type?: 'text' | 'date'
  placeholder?: string
}

interface SearchFormProps {
  fields: SearchField[]
  basePath: string
}

export function SearchForm({ fields, basePath }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    fields.forEach((field) => {
      initial[field.name] = searchParams.get(field.name) || ''
    })
    return initial
  })

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`)
    })
  }, [values, basePath, router])

  const handleClear = useCallback(() => {
    const cleared: Record<string, string> = {}
    fields.forEach((field) => {
      cleared[field.name] = ''
    })
    setValues(cleared)
    startTransition(() => {
      router.push(basePath)
    })
  }, [fields, basePath, router])

  return (
    <form onSubmit={handleSearch} className="flex items-end gap-4 flex-wrap">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="text-sm font-medium">{field.label}</label>
          <Input
            type={field.type || 'text'}
            value={values[field.name]}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-48"
          />
        </div>
      ))}
      <Button type="submit" disabled={isPending}>
        <Search className="h-4 w-4 mr-2" />
        {isPending ? '検索中...' : '検索'}
      </Button>
      <Button type="button" variant="outline" onClick={handleClear} disabled={isPending}>
        クリア
      </Button>
    </form>
  )
}
