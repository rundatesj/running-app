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
  const personalDistance = makePersonalDistance(runs)
  const attendanceRanking = makeAttendanceRanking(runs)
  const dailyParticipants = makeDailyParticipants(runs)

  const totalDistance = runs.reduce((sum, r) => sum + Number(r.distance), 0)
  const totalRecords = runs.length
  const avgDistance = totalRecords ? totalDistance / totalRecords : 0

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
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <SummaryCard title="총 거리" value={`${totalDistance.toFixed(2)}km`} color="bg-violet-600" />
          <SummaryCard title="총 기록" value={`${totalRecords}건`} color="bg-blue-600" />
          <SummaryCard title="평균 거리" value={`${avgDistance.toFixed(2)}km`} color="bg-emerald-600" />
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
          title="개인별 누적거리 TOP10"
          subtitle="5월 전체 누적거리 기준"
          data={personalDistance.slice(0, 10)}
          valueKey="distance"
          labelKey="name"
          unit="km"
          theme="blue"
        />

        <BarSection
          title="출석일수 TOP10"
          subtitle="러닝 기록이 있는 날짜 수 기준"
          data={attendanceRanking.slice(0, 10)}
          valueKey="attendance"
          labelKey="name"
          unit="일"
          theme="emerald"
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
      </div>
    </main>
  )
}

function makeDailyDistance(runs) {
  const map = {}

  runs.forEach((run) => {
    if (!map[run.run_date]) {
      map[run.run_date] = 0
    }
    map[run.run_date] += Number(run.distance)
  })

  return Object.entries(map)
    .map(([date, distance]) => ({
      date,
      distance: Number(distance.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function makePersonalDistance(runs) {
  const map = {}

  runs.forEach((run) => {
    const name = run.members?.name || '이름없음'
    if (!map[name]) {
      map[name] = 0
    }
    map[name] += Number(run.distance)
  })

  return Object.entries(map)
    .map(([name, distance]) => ({
      name,
      distance: Number(distance.toFixed(2)),
    }))
    .sort((a, b) => b.distance - a.distance)
}

function makeAttendanceRanking(runs) {
  const map = {}

  runs.forEach((run) => {
    const name = run.members?.name || '이름없음'
    if (!map[name]) {
      map[name] = new Set()
    }
    map[name].add(run.run_date)
  })

  return Object.entries(map)
    .map(([name, dates]) => ({
      name,
      attendance: dates.size,
    }))
    .sort((a, b) => b.attendance - a.attendance)
}

function makeDailyParticipants(runs) {
  const map = {}

  runs.forEach((run) => {
    if (!map[run.run_date]) {
      map[run.run_date] = new Set()
    }
    map[run.run_date].add(run.member_id)
  })

  return Object.entries(map)
    .map(([date, members]) => ({
      date,
      participants: members.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
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
    blue: {
      header: 'bg-blue-600',
      bar: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-700',
    },
    emerald: {
      header: 'bg-emerald-600',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    amber: {
      header: 'bg-amber-500',
      bar: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700',
    },
  }

  return themes[theme] || themes.blue
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
                      {labelKey === 'name' ? `${index + 1}위 ` : ''}
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