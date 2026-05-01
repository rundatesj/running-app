'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function StatsPage() {
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

  const dailyDistance = makeDailyDistance(runs)
  const dailyParticipants = makeDailyParticipants(runs)
  const weekdayDistance = makeWeekdayDistance(runs)

  const totalDistance = runs.reduce((sum, r) => sum + Number(r.distance), 0)
  const totalRecords = runs.length
  const avgDistance = totalRecords ? totalDistance / totalRecords : 0
  const crewLevel = getCrewLevel(totalDistance)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              통계 그래프
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              5월 러닝 챌린지 기록을 그래프로 확인합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
              기록 입력
            </Link>
            <Link href="/dashboard" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
              대시보드
            </Link>
            <Link href="/history" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow">
              누적 기록
            </Link>
<Link
  href="/fair"
  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
>
  랭킹
</Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <SummaryCard title="총 거리" value={`${totalDistance.toFixed(2)}km`} color="bg-violet-600" />
          <SummaryCard title="총 기록" value={`${totalRecords}건`} color="bg-blue-600" />
          <SummaryCard title="평균 거리" value={`${avgDistance.toFixed(2)}km`} color="bg-emerald-600" />
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow">
          <div className="bg-slate-900 px-5 py-4 text-white">
            <div className="text-sm font-bold opacity-90">🏆 크루 누적 레벨</div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-extrabold">
  <span>LV.{crewLevel.level} {crewLevel.name}</span>

  <details className="relative inline-block">
    <summary className="cursor-pointer list-none rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
      !
    </summary>

    <div className="absolute left-0 z-50 mt-2 w-64 rounded-xl bg-white p-4 text-sm text-slate-800 shadow-xl">
      <div className="mb-2 font-extrabold">레벨 기준</div>
      <div>LV.1 워밍업: 0 ~ 200km</div>
      <div>LV.2 러닝 시작: 200 ~ 500km</div>
      <div>LV.3 중독 단계: 500 ~ 1000km</div>
      <div>LV.4 크루 각성: 1000 ~ 2000km</div>
      <div>LV.5 괴물 집단: 2000 ~ 3000km</div>
      <div>LV.6 인간 아님: 3000km 이상</div>
    </div>
  </details>
</div>
            <div className="mt-1 text-sm opacity-90">
              우리가 함께 달린 거리 {totalDistance.toFixed(2)}km
            </div>
          </div>

          <div className="p-5">
            <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
              <span>다음 레벨 진행률</span>
              <span>{crewLevel.progress.toFixed(1)}%</span>
            </div>

            <div className="mb-4 h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: `${crewLevel.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <div className="text-sm font-bold text-blue-700">운동장</div>
                <div className="mt-1 text-xl font-extrabold text-blue-900">
                  {crewLevel.trackLaps.toFixed(0)}바퀴
                </div>
              </div>

              <div className="rounded-xl bg-violet-50 p-4 text-center">
                <div className="text-sm font-bold text-violet-700">다음 레벨까지</div>
                <div className="mt-1 text-xl font-extrabold text-violet-900">
                  {crewLevel.remain.toFixed(1)}km
                </div>
              </div>
            </div>
          </div>
        </div>

        <BarSection
          title="날짜별 전체 거리"
          subtitle="날짜별 크루 전체 누적 거리"
          data={dailyDistance}
          valueKey="distance"
          labelKey="date"
          unit="km"
          theme="violet"
        />

        <BarSection
          title="날짜별 참여자 수"
          subtitle="날짜별 기록을 남긴 인원 수"
          data={dailyParticipants}
          valueKey="participants"
          labelKey="date"
          unit="명"
          theme="amber"
        />

        <BarSection
          title="요일별 누적거리"
          subtitle="월~일 요일별 전체 러닝거리"
          data={weekdayDistance}
          valueKey="distance"
          labelKey="day"
          unit="km"
          theme="emerald"
        />
      </div>
    </main>
  )
}

function getCrewLevel(totalDistance) {
  const levels = [
    { level: 1, name: '워밍업', min: 0, max: 200 },
    { level: 2, name: '러닝 시작', min: 200, max: 500 },
    { level: 3, name: '중독 단계', min: 500, max: 1000 },
    { level: 4, name: '크루 각성', min: 1000, max: 2000 },
    { level: 5, name: '괴물 집단', min: 2000, max: 3000 },
    { level: 6, name: '인간 아님', min: 3000, max: null },
  ]

  const current =
    levels.find((item) =>
      item.max === null
        ? totalDistance >= item.min
        : totalDistance >= item.min && totalDistance < item.max
    ) || levels[0]

  const progress =
    current.max === null
      ? 100
      : ((totalDistance - current.min) / (current.max - current.min)) * 100

  const remain = current.max === null ? 0 : current.max - totalDistance
  const trackLaps = totalDistance / 0.4

  return {
    ...current,
    progress: Math.min(100, Math.max(0, progress)),
    remain: Math.max(0, remain),
    trackLaps,
  }
}

function makeDailyDistance(runs) {
  const map = {}

  runs.forEach((run) => {
    if (!map[run.run_date]) map[run.run_date] = 0
    map[run.run_date] += Number(run.distance)
  })

  return Object.entries(map)
    .map(([date, distance]) => ({
      date,
      distance: Number(distance.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function makeDailyParticipants(runs) {
  const map = {}

  runs.forEach((run) => {
    if (!map[run.run_date]) map[run.run_date] = new Set()
    map[run.run_date].add(run.member_id)
  })

  return Object.entries(map)
    .map(([date, members]) => ({
      date,
      participants: members.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function makeWeekdayDistance(runs) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const map = {
    월: 0,
    화: 0,
    수: 0,
    목: 0,
    금: 0,
    토: 0,
    일: 0,
  }

  runs.forEach((run) => {
    const day = weekdays[new Date(run.run_date).getDay()]
    map[day] += Number(run.distance)
  })

  return ['월', '화', '수', '목', '금', '토', '일'].map((day) => ({
    day,
    distance: Number(map[day].toFixed(2)),
  }))
}

function SummaryCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-2xl p-4 text-center text-white shadow`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  )
}

function getTheme(theme) {
  const themes = {
    violet: {
      header: 'bg-violet-600',
      bar: 'bg-violet-500',
      badge: 'bg-violet-50 text-violet-700',
    },
    amber: {
      header: 'bg-amber-500',
      bar: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700',
    },
    emerald: {
      header: 'bg-emerald-600',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700',
    },
  }

  return themes[theme] || themes.violet
}

function BarSection({ title, subtitle, data, valueKey, labelKey, unit, theme }) {
  const style = getTheme(theme)
  const maxValue = Math.max(...data.map((item) => item[valueKey]), 0)

  return (
    <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow">
      <div className={`${style.header} px-4 py-3 text-white`}>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="mt-1 text-sm opacity-90">{subtitle}</p>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="text-gray-400">기록이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => {
              const value = item[valueKey]
              const percent = maxValue ? Math.max((value / maxValue) * 100, 4) : 0

              return (
                <div key={`${item[labelKey]}-${index}`}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">
                      {item[labelKey]}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-extrabold ${style.badge}`}>
                      {value}{unit}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}