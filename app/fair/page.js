'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const MAX_DAYS = 31

export default function FairRankingPage() {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data } = await supabase
      .from('runs')
      .select('distance, run_date, member_id, members(name)')
      .gte('run_date', '2026-05-01')
      .lte('run_date', '2026-05-31')

    setRuns(data || [])
  }

  const ranking = makeFairRanking(runs)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              공정 랭킹
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              거리·출석·연속출석을 점수화한 종합 순위입니다.
            </p>
          </div>

<div className="grid grid-cols-5 gap-2">
  <a href="/" className="rounded-xl bg-blue-100 px-3 py-2 text-center text-sm font-extrabold text-blue-700 shadow">
    기록입력
  </a>

  <a href="/dashboard" className="rounded-xl bg-emerald-100 px-3 py-2 text-center text-sm font-extrabold text-emerald-700 shadow">
    순위
  </a>

  <a href="/history" className="rounded-xl bg-violet-100 px-3 py-2 text-center text-sm font-extrabold text-violet-700 shadow">
    누적기록
  </a>

  <a href="/stats" className="rounded-xl bg-amber-100 px-3 py-2 text-center text-sm font-extrabold text-amber-700 shadow">
    통계
  </a>

  <a href="/fair" className="rounded-xl bg-rose-100 px-3 py-2 text-center text-sm font-extrabold text-rose-700 shadow">
    랭킹
  </a>
</div>
        </div>

        <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow">
          <div className="bg-slate-900 px-5 py-4 text-white">
            <h2 className="text-lg font-extrabold">점수 계산 기준</h2>
            <p className="mt-1 text-sm opacity-90">
              실력 차이를 줄이고 꾸준함을 반영하기 위한 보정 랭킹입니다.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <ScoreRule title="거리 점수" value="70%" desc="√누적거리 / √1위거리 × 70" color="bg-blue-50 text-blue-700" />
            <ScoreRule title="출석 점수" value="20%" desc="출석일 / 31일 × 20" color="bg-emerald-50 text-emerald-700" />
            <ScoreRule title="연속출석 점수" value="10%" desc="연속일 / 31일 × 10" color="bg-amber-50 text-amber-700" />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="bg-violet-600 px-5 py-4 text-white">
            <h2 className="text-lg font-extrabold">종합 점수 순위</h2>
            <p className="mt-1 text-sm opacity-90">
              총점 = 거리점수 + 출석점수 + 연속출석점수
            </p>
          </div>

          <div className="p-4">
            {ranking.length === 0 ? (
              <div className="text-gray-400">기록이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {ranking.map((item, index) => (
                  <div
                    key={item.name}
                    className={`rounded-2xl border p-4 ${getRankStyle(index)}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold">
                          {getRankLabel(index)}
                        </span>
                        <span className="text-lg font-extrabold text-slate-800">
                          {item.name}
                        </span>
                      </div>

                      <div className="rounded-full bg-violet-50 px-4 py-2 text-lg font-extrabold text-violet-700">
                        {item.totalScore.toFixed(1)}점
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      <MiniScore title="거리" score={item.distanceScore} color="text-blue-700 bg-blue-50" />
                      <MiniScore title="출석" score={item.attendanceScore} color="text-emerald-700 bg-emerald-50" />
                      <MiniScore title="연속" score={item.streakScore} color="text-amber-700 bg-amber-50" />
                    </div>

                    <div className="text-sm text-gray-500">
                      누적 {item.totalDistance.toFixed(2)}km · 출석 {item.attendance}일 · 연속 {item.streak}일
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

function makeFairRanking(runs) {
  const map = {}

  runs.forEach((run) => {
    const name = run.members?.name || '이름없음'
    const distance = Number(run.distance)

    if (!map[name]) {
      map[name] = {
        name,
        totalDistance: 0,
        dates: new Set(),
      }
    }

    map[name].totalDistance += distance
    map[name].dates.add(run.run_date)
  })

  const base = Object.values(map).map((item) => ({
    name: item.name,
    totalDistance: item.totalDistance,
    attendance: item.dates.size,
    streak: getStreak(item.dates),
  }))

  const maxRootDistance = Math.max(
    ...base.map((item) => Math.sqrt(item.totalDistance)),
    1
  )

  return base
    .map((item) => {
      const distanceScore =
        (Math.sqrt(item.totalDistance) / maxRootDistance) * 70

      const attendanceScore = (item.attendance / MAX_DAYS) * 20
      const streakScore = (item.streak / MAX_DAYS) * 10
      const totalScore = distanceScore + attendanceScore + streakScore

      return {
        ...item,
        distanceScore,
        attendanceScore,
        streakScore,
        totalScore,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
}

function getStreak(datesSet) {
  const dates = Array.from(datesSet).sort()
  if (dates.length === 0) return 0

  let streak = 1
  let maxStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (curr - prev) / (1000 * 60 * 60 * 24)

    if (diff === 1) {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 1
    }
  }

  return maxStreak
}

function ScoreRule({ title, value, desc, color }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs opacity-80">{desc}</div>
    </div>
  )
}

function MiniScore({ title, score, color }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="text-xs font-bold">{title}</div>
      <div className="mt-1 text-lg font-extrabold">
        {score.toFixed(1)}
      </div>
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