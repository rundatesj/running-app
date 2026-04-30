'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function History() {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data } = await supabase
      .from('runs')
      .select('distance, run_date, created_at, members(name)')
      .gte('run_date', '2026-05-01')
      .lte('run_date', '2026-05-31')
      .order('run_date', { ascending: false })

    setRuns(data || [])
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-2">
          <Link href="/" className="rounded bg-white px-3 py-2 text-sm font-bold border">기록 입력</Link>
          <Link href="/dashboard" className="rounded bg-white px-3 py-2 text-sm font-bold border">순위 대시보드</Link>
          <Link href="/history" className="rounded bg-black px-3 py-2 text-sm font-bold text-white">전체 기록</Link>
        </div>

        <h1 className="mb-4 text-2xl font-bold">전체 러닝 기록</h1>

        <div className="rounded-xl bg-white p-4 shadow">
          {runs.length === 0 ? (
            <div className="text-gray-400">기록이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {runs.map((run, index) => (
                <div key={index} className="flex justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-bold">{run.members?.name}</div>
                    <div className="text-sm text-gray-500">{run.run_date}</div>
                  </div>
                  <div className="font-bold">{run.distance}km</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
