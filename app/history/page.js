'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function History() {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data } = await supabase
      .from('runs')
      .select('distance, run_date, members(name)')
      .gte('run_date', '2026-05-01')
      .lte('run_date', '2026-05-31')

    const map = {}

    ;(data || []).forEach((run) => {
      const name = run.members?.name || '이름없음'
      const distance = Number(run.distance)

      if (!map[name]) {
        map[name] = {
          name,
          total: 0,
          count: 0,
          dates: new Set(),
          maxDistance: 0,
        }
      }

      map[name].total += distance
      map[name].count += 1
      map[name].dates.add(run.run_date)

      if (distance > map[name].maxDistance) {
        map[name].maxDistance = distance
      }
    })

    const result = Object.values(map)
      .map((item) => ({
        name: item.name,
        total: Number(item.total.toFixed(2)),
        count: item.count,
        attendance: item.dates.size,
        maxDistance: Number(item.maxDistance.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)

    setRanking(result)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-2">
          <Link href="/" className="rounded border bg-white px-3 py-2 text-sm font-bold">
            기록 입력
          </Link>
          <Link href="/dashboard" className="rounded border bg-white px-3 py-2 text-sm font-bold">
            순위 대시보드
          </Link>
          <Link href="/history" className="rounded bg-black px-3 py-2 text-sm font-bold text-white">
            누적 기록
          </Link>
        </div>

        <h1 className="mb-4 text-2xl font-bold">전체 누적 기록</h1>

        <div className="rounded-xl bg-white p-4 shadow">
          {ranking.length === 0 ? (
            <div className="text-gray-400">기록이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {ranking.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-bold">
                      {index + 1}위 {item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      출석 {item.attendance}일 · 입력 {item.count}건 · 최장 {item.maxDistance}km
                    </div>
                  </div>

                  <div className="text-right font-bold">
                    {item.total}km
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}