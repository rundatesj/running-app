'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data, error } = await supabase
      .from('runs')
      .select('distance, run_date, member_id, members(name)')
      .gte('run_date', '2026-05-01')
      .lte('run_date', '2026-05-31')

    if (error) {
      alert('데이터 불러오기 실패: ' + error.message)
      setLoading(false)
      return
    }

    setRuns(data || [])
    setLoading(false)
  }

  function formatDate(date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function getToday() {
    return formatDate(new Date())
  }

  function getWeekRange() {
    const today = new Date()
    const day = today.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day

    const monday = new Date(today)
    monday.setDate(today.getDate() + diffToMonday)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      start: formatDate(monday),
      end: formatDate(sunday),
    }
  }

  function makeRanking(filteredRuns, type = 'total') {
    const map = {}

    filteredRuns.forEach((run) => {
      const name = run.members?.name || '이름없음'

      if (!map[name]) {
        map[name] = {
          name,
          total: 0,
          attendanceDates: new Set(),
          maxDistance: 0,
        }
      }

      const distance = Number(run.distance)

      map[name].total += distance
      map[name].attendanceDates.add(run.run_date)

      if (distance > map[name].maxDistance) {
        map[name].maxDistance = distance
      }
    })

    const result = Object.values(map).map((item) => ({
      name: item.name,
      total: Number(item.total.toFixed(2)),
      attendance: item.attendanceDates.size,
      maxDistance: Number(item.maxDistance.toFixed(2)),
    }))

    if (type === 'attendance') {
      result.sort((a, b) => b.attendance - a.attendance || b.total - a.total)
    } else if (type === 'max') {
      result.sort((a, b) => b.maxDistance - a.maxDistance || b.total - a.total)
    } else {
      result.sort((a, b) => b.total - a.total || b.attendance - a.attendance)
    }

    return result
  }

  const today = getToday()
  const week = getWeekRange()

  const todayRuns = runs.filter((r) => r.run_date === today)
  const weekRuns = runs.filter(
    (r) => r.run_date >= week.start && r.run_date <= week.end
  )

  const todayRanking = makeRanking(todayRuns)
const todayWinner = todayRanking[0]
  const weekRanking = makeRanking(weekRuns)
  const totalRanking = makeRanking(runs)
  const attendanceRanking = makeRanking(runs, 'attendance')
  const maxRanking = makeRanking(runs, 'max')

  const totalDistance = runs.reduce((sum, r) => sum + Number(r.distance), 0)
  const totalRecords = runs.length
  const totalMembers = new Set(runs.map((r) => r.member_id)).size

  if (loading) {
    return <div className="p-5">불러오는 중...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              5월 러닝 챌린지 대시보드
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              거리 · 출석 · 최장거리 기준 실시간 순위
            </p>
          </div>

          <div className="flex gap-2">
            <a href="/" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
              기록 입력
            </a>
            <a href="/history" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow">
              누적 기록
            </a>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
{todayWinner && (
  <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 p-5 text-white shadow">
    <div className="text-sm font-bold opacity-90">🏆 오늘의 러너</div>
    <div className="mt-2 text-2xl font-extrabold">{todayWinner.name}</div>
    <div className="mt-1 text-lg font-bold">{todayWinner.total}km</div>
    <div className="mt-2 text-sm opacity-90">
      오늘 가장 많이 달린 러너입니다.
    </div>
  </div>
)}

          <SummaryCard title="참가자" value={`${totalMembers}명`} color="bg-blue-600" />
          <SummaryCard title="총 기록" value={`${totalRecords}건`} color="bg-emerald-600" />
          <SummaryCard title="총 거리" value={`${totalDistance.toFixed(2)}km`} color="bg-violet-600" />
        </div>

        <RankingSection
          title="오늘 순위"
          subtitle="오늘 입력된 러닝 기록 기준"
          data={todayRanking}
          emptyText="오늘 기록이 없습니다."
          theme="blue"
        />

        <RankingSection
          title="이번주 누적 순위"
          subtitle={`${week.start} ~ ${week.end}`}
          data={weekRanking}
          emptyText="이번주 기록이 없습니다."
          theme="emerald"
        />

        <RankingSection
          title="5월 전체 누적 순위"
          subtitle="5월 1일 ~ 5월 31일 전체 거리 합산"
          data={totalRanking}
          emptyText="기록이 없습니다."
          theme="violet"
        />

        <RankingSection
          title="출석일수 순위"
          subtitle="러닝한 날짜 수 기준"
          data={attendanceRanking}
          type="attendance"
          emptyText="기록이 없습니다."
          theme="amber"
        />

        <RankingSection
          title="최장거리 순위"
          subtitle="1회 입력 기준 가장 긴 거리"
          data={maxRanking}
          type="max"
          emptyText="기록이 없습니다."
          theme="rose"
        />
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

function getTheme(theme) {
  const themes = {
    blue: {
      header: 'bg-blue-600',
      badge: 'text-blue-700 bg-blue-50',
      border: 'border-blue-100',
    },
    emerald: {
      header: 'bg-emerald-600',
      badge: 'text-emerald-700 bg-emerald-50',
      border: 'border-emerald-100',
    },
    violet: {
      header: 'bg-violet-600',
      badge: 'text-violet-700 bg-violet-50',
      border: 'border-violet-100',
    },
    amber: {
      header: 'bg-amber-500',
      badge: 'text-amber-700 bg-amber-50',
      border: 'border-amber-100',
    },
    rose: {
      header: 'bg-rose-500',
      badge: 'text-rose-700 bg-rose-50',
      border: 'border-rose-100',
    },
  }

  return themes[theme] || themes.blue
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

function RankingSection({ title, subtitle, data, type = 'total', emptyText, theme }) {
  const style = getTheme(theme)

  return (
    <section className={`mb-5 overflow-hidden rounded-2xl bg-white shadow ${style.border}`}>
      <div className={`${style.header} px-4 py-3 text-white`}>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="mt-1 text-sm opacity-90">{subtitle}</p>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="text-gray-400">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((item, index) => (
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
                    출석 {item.attendance}일 · 최장 {item.maxDistance}km
                  </div>
                </div>

                <div className="text-right">
                  {type === 'attendance' ? (
                    <>
                      <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${style.badge}`}>
                        {item.attendance}일
                      </div>
                      <div className="mt-1 text-xs text-gray-500">누적 {item.total}km</div>
                    </>
                  ) : type === 'max' ? (
                    <>
                      <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${style.badge}`}>
                        {item.maxDistance}km
                      </div>
                      <div className="mt-1 text-xs text-gray-500">누적 {item.total}km</div>
                    </>
                  ) : (
                    <>
                      <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${style.badge}`}>
                        {item.total}km
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        출석 {item.attendance}일
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}