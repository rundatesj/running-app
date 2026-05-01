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

  const totalDistance = ranking.reduce((sum, item) => sum + item.total, 0)
  const totalAttendance = ranking.reduce((sum, item) => sum + item.attendance, 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              전체 누적 기록
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              개인별 누적거리 높은 순으로 정렬됩니다.
            </p>
          </div>

<div className="flex gap-2">
  <a href="/" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
    기록 입력
  </a>

  <a href="/dashboard" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
    대시보드
  </a>

  <a href="/stats" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow">
    통계
  </a>
<a
  href="/fair"
  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
>
  공정 랭킹
</a>
</div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <SummaryCard title="기록 인원" value={`${ranking.length}명`} color="bg-blue-600" />
          <SummaryCard title="총 출석" value={`${totalAttendance}일`} color="bg-emerald-600" />
          <SummaryCard title="총 거리" value={`${totalDistance.toFixed(2)}km`} color="bg-violet-600" />
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="bg-violet-600 px-4 py-3 text-white">
            <h2 className="text-lg font-extrabold">누적 기록 순위</h2>
            <p className="mt-1 text-sm opacity-90">5월 전체 기록 합산</p>
          </div>

          <div className="p-4">
            {ranking.length === 0 ? (
              <div className="text-gray-400">기록이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {ranking.map((item, index) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between rounded-xl border p-3 ${getRankStyle(index)}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold">
                          {getRankLabel(index)}
                        </span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>

                      <div className="mt-1 text-sm text-gray-500">
                        출석 {item.attendance}일 · 입력 {item.count}건 · 최장 {item.maxDistance}km
                      </div>
                    </div>

                    <div className="rounded-full bg-violet-50 px-3 py-1 text-sm font-extrabold text-violet-700">
                      {item.total}km
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function SummaryCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-2xl p-4 text-center text-white shadow`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  )
}

function getRankLabel(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `${index + 1}위`
}

function getRankStyle(index) {
  if (index === 0) return 'bg-yellow-50 border-yellow-300'
  if (index === 1) return 'bg-slate-50 border-slate-300'
  if (index === 2) return 'bg-orange-50 border-orange-300'
  return 'bg-white border-gray-100'
}