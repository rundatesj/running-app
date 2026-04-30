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

  function getToday() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
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

  function formatDate(date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
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
          count: 0,
        }
      }

      const distance = Number(run.distance)

      map[name].total += distance
      map[name].attendanceDates.add(run.run_date)
      map[name].count += 1

      if (distance > map[name].maxDistance) {
        map[name].maxDistance = distance
      }
    })

    const result = Object.values(map).map((item) => ({
      name: item.name,
      total: Number(item.total.toFixed(2)),
      attendance: item.attendanceDates.size,
      maxDistance: Number(item.maxDistance.toFixed(2)),
      avgDistance: item.attendanceDates.size
        ? Number((item.total / item.attendanceDates.size).toFixed(2))
        : 0,
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
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-5xl">
       <div className="mb-4 flex items-center justify-between gap-3">
  <h1 className="text-2xl font-bold">5월 러닝 챌린지 대시보드</h1>

  <a
    href="/"
    className="rounded border bg-white px-3 py-2 text-sm font-bold"
  >
    기록 입력
  </a>
</div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <SummaryCard title="참가자" value={`${totalMembers}명`} />
          <SummaryCard title="총 기록" value={`${totalRecords}건`} />
          <SummaryCard title="총 거리" value={`${totalDistance.toFixed(2)}km`} />
        </div>

        <RankingSection title="오늘 순위" data={todayRanking} emptyText="오늘 기록이 없습니다." />
        <RankingSection title="이번주 누적 순위" data={weekRanking} emptyText="이번주 기록이 없습니다." />
        <RankingSection title="5월 전체 누적 순위" data={totalRanking} emptyText="기록이 없습니다." />
        <RankingSection title="출석일수 순위" data={attendanceRanking} type="attendance" emptyText="기록이 없습니다." />
        <RankingSection title="최장거리 순위" data={maxRanking} type="max" emptyText="기록이 없습니다." />
      </div>
    </main>
  )
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  )
}

function RankingSection({ title, data, type = 'total', emptyText }) {
  return (
    <section className="mb-5 rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>

      {data.length === 0 ? (
        <div className="text-gray-400">{emptyText}</div>
      ) : (
        <div className="space-y-2">
      {data.slice(0, 10).map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <span className="mr-2 font-bold">{index + 1}위</span>
                <span>{item.name}</span>
              </div>

              <div className="text-right text-sm">
                {type === 'attendance' ? (
                  <>
                    <div className="font-bold">{item.attendance}일 출석</div>
                    <div className="text-gray-500">누적 {item.total}km</div>
                  </>
                ) : type === 'max' ? (
                  <>
                    <div className="font-bold">{item.maxDistance}km</div>
                    <div className="text-gray-500">누적 {item.total}km</div>
                  </>
                ) : (
                  <>
                    <div className="font-bold">{item.total}km</div>
                    <div className="text-gray-500">
                      출석 {item.attendance}일 · 최장 {item.maxDistance}km
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}