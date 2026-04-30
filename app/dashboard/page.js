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

  // 🔥 연속 출석 계산
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
        streak++
        maxStreak = Math.max(maxStreak, streak)
      } else {
        streak = 1
      }
    }

    return maxStreak
  }

  // 🔥 뱃지
  function getStreakBadge(streak) {
    if (streak >= 10) return '👑 10일+'
    if (streak >= 5) return '🚀 5일+'
    if (streak >= 3) return '🔥 3일+'
    return null
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
      streak: getStreak(item.attendanceDates), // ⭐ 핵심 추가
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

        {/* 🏆 오늘의 러너 */}
        {todayWinner && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 p-5 text-white shadow">
            <div className="text-sm font-bold">🏆 오늘의 러너</div>
            <div className="mt-2 text-2xl font-extrabold">{todayWinner.name}</div>
            <div className="mt-1 text-lg font-bold">{todayWinner.total}km</div>
          </div>
        )}

        <RankingSection title="오늘 순위" data={todayRanking} />
        <RankingSection title="이번주 누적 순위" data={weekRanking} />
        <RankingSection title="전체 누적 순위" data={totalRanking} />
        <RankingSection title="출석일수 순위" data={attendanceRanking} type="attendance" />
        <RankingSection title="최장거리 순위" data={maxRanking} type="max" />

      </div>
    </main>
  )
}

function RankingSection({ title, data, type = 'total' }) {
  return (
    <div className="mb-5 rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>

      {data.slice(0, 10).map((item, index) => (
        <div key={item.name} className="mb-2 rounded-lg border p-3">
          <div className="flex justify-between">
            <div>
              <div className="font-bold">
                {index + 1}위 {item.name}
              </div>

              <div className="text-sm text-gray-500">
                출석 {item.attendance}일 · 연속 {item.streak}일 · 최장 {item.maxDistance}km
              </div>

              {item.streak >= 3 && (
                <div className="mt-1 text-xs font-bold text-red-500">
                  {item.streak >= 10 ? '👑 10일+' :
                   item.streak >= 5 ? '🚀 5일+' :
                   '🔥 3일+'}
                </div>
              )}
            </div>

            <div className="font-bold">{item.total}km</div>
          </div>
        </div>
      ))}
    </div>
  )
}