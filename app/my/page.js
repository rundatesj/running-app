'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function MyPage() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedName, setSelectedName] = useState('')

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data, error } = await supabase
      .from('runs')
      .select('distance, run_date, member_id, members(name)')
      .gte('run_date', '2026-05-01')
      .lte('run_date', '2026-05-31')
      .order('run_date', { ascending: true })

    if (error) {
      alert('데이터 불러오기 실패: ' + error.message)
      setLoading(false)
      return
    }

    setRuns(data || [])
    setLoading(false)
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
      streak: getStreak(item.attendanceDates),
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

  function getRank(name, ranking) {
    const index = ranking.findIndex((item) => item.name === name)
    return index >= 0 ? index + 1 : '-'
  }

  const names = [
    ...new Set(runs.map((run) => run.members?.name).filter(Boolean)),
  ].sort()

  const myRuns = runs
    .filter((run) => run.members?.name === selectedName)
    .sort((a, b) => new Date(a.run_date) - new Date(b.run_date))

  const totalDistance = myRuns.reduce(
    (sum, run) => sum + Number(run.distance || 0),
    0
  )

  const attendanceDates = new Set(myRuns.map((run) => run.run_date))
  const attendance = attendanceDates.size
  const maxDistance =
    myRuns.length > 0
      ? Math.max(...myRuns.map((run) => Number(run.distance || 0)))
      : 0
  const averageDistance = attendance > 0 ? totalDistance / attendance : 0
  const streak = getStreak(attendanceDates)

  const totalRanking = makeRanking(runs)
  const attendanceRanking = makeRanking(runs, 'attendance')
  const maxRanking = makeRanking(runs, 'max')

  const totalRank = getRank(selectedName, totalRanking)
  const attendanceRank = getRank(selectedName, attendanceRanking)
  const maxRank = getRank(selectedName, maxRanking)

  if (loading) {
    return <div className="p-5">불러오는 중...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              나의 5월 러닝 리포트
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              닉네임을 선택하면 개인별 기록을 확인할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-2">
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

            <a href="/my" className="rounded-xl bg-cyan-100 px-3 py-2 text-center text-sm font-extrabold text-cyan-700 shadow">
              내기록
            </a>
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            닉네임 선택
          </label>

          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 font-bold text-slate-800"
          >
            <option value="">닉네임을 선택하세요</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {!selectedName ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow">
            닉네임을 선택하면 개인 기록이 표시됩니다.
          </div>
        ) : (
          <>
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 p-5 text-white shadow">
              <div className="text-sm font-bold opacity-90">🏃 개인 리포트</div>
              <div className="mt-2 text-2xl font-extrabold">
                {selectedName}
              </div>
              <div className="mt-1 text-sm opacity-90">
                총 {attendance}일 참여 · 누적 {totalDistance.toFixed(2)}km
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryCard title="누적거리" value={`${totalDistance.toFixed(2)}km`} color="bg-blue-600" />
              <SummaryCard title="출석일수" value={`${attendance}일`} color="bg-emerald-600" />
              <SummaryCard title="최장거리" value={`${maxDistance.toFixed(2)}km`} color="bg-violet-600" />
              <SummaryCard title="평균거리" value={`${averageDistance.toFixed(2)}km`} color="bg-amber-500" />
            </div>

            <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow">
              <div className="bg-slate-800 px-4 py-3 text-white">
                <h2 className="text-lg font-extrabold">나의 순위</h2>
                <p className="mt-1 text-sm opacity-90">
                  5월 전체 기록 기준
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4">
                <RankCard title="거리랭킹" rank={totalRank} />
                <RankCard title="출석랭킹" rank={attendanceRank} />
                <RankCard title="최장거리랭킹" rank={maxRank} />
              </div>
            </section>

            <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow">
              <div className="bg-cyan-600 px-4 py-3 text-white">
                <h2 className="text-lg font-extrabold">활동 요약</h2>
                <p className="mt-1 text-sm opacity-90">
                  나의 5월 러닝 패턴
                </p>
              </div>

              <div className="p-4 text-sm font-bold text-slate-700">
                <p className="mb-2">
                  ✅ 총 {myRuns.length}건의 기록을 남겼습니다.
                </p>
                <p className="mb-2">
                  ✅ 최장 연속 출석은 {streak}일입니다.
                </p>
                <p>
                  ✅ 1회 평균 러닝 거리는 {averageDistance.toFixed(2)}km입니다.
                </p>
              </div>
            </section>

            <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow">
              <div className="bg-blue-600 px-4 py-3 text-white">
                <h2 className="text-lg font-extrabold">러닝 기록 내역</h2>
                <p className="mt-1 text-sm opacity-90">
                  날짜별 입력 기록
                </p>
              </div>

              <div className="p-4">
                {myRuns.length === 0 ? (
                  <div className="text-gray-400">기록이 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {myRuns.map((run, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3"
                      >
                        <div>
                          <div className="font-extrabold text-slate-800">
                            {run.run_date}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {index + 1}번째 기록
                          </div>
                        </div>

                        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-extrabold text-blue-700">
                          {Number(run.distance).toFixed(2)}km
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
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

function RankCard({ title, rank }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center shadow-sm">
      <div className="text-sm font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">
        {rank}위
      </div>
    </div>
  )
}
