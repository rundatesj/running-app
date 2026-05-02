'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const CHALLENGE_START = '2026-05-01'
const CHALLENGE_END = '2026-05-31'

const successMessages = [
  {
    title: '저장완료🏃‍♂️🏃‍♀️',
    text: '오늘 나 꽤 멋있다😎',
  },
  {
    title: '기록 저장 완료🔥',
    text: '이제 누워도 합법🛌',
  },
  {
    title: '오늘도 해냈다💪',
    text: '작은 습관이 큰 변화를 만들어요❤️',
  },
]

function formatDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getDefaultDate() {
  const today = formatDate(new Date())
  if (today < CHALLENGE_START) return CHALLENGE_START
  if (today > CHALLENGE_END) return CHALLENGE_END
  return today
}

export default function Home() {
  const [members, setMembers] = useState([])
  const [memberId, setMemberId] = useState('')
  const [runDate, setRunDate] = useState(getDefaultDate())
  const [distance, setDistance] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const maxDate = getDefaultDate()

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      alert('이름 목록 불러오기 실패')
      return
    }

    setMembers(data || [])
  }

  function handleDistanceChange(e) {
    const value = e.target.value
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setDistance(value)
    }
  }

  async function handleSubmit() {
    if (saving) return

    if (!memberId || !runDate || !distance) {
      alert('이름, 날짜, 거리를 모두 입력해주세요.')
      return
    }

    const numberDistance = Number(distance)

    if (numberDistance <= 0) {
      alert('거리는 0보다 크게 입력해주세요.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('runs').insert({
      member_id: memberId,
      run_date: runDate,
      distance: numberDistance,
    })

    setSaving(false)

    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    const random =
      successMessages[Math.floor(Math.random() * successMessages.length)]

    setSuccessMessage(random)

    setMemberId('')
    setRunDate(getDefaultDate())
    setDistance('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-4">
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mb-2 text-2xl font-extrabold text-slate-900">
              {successMessage.title}
            </div>

            <div className="mb-5 text-base font-bold text-slate-600">
              {successMessage.text}
            </div>

            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full rounded-xl bg-blue-600 p-3 font-extrabold text-white shadow"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900">
            5월 마일리지 대전 개인전
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            이름, 날짜, 거리만 입력하면 순위에 자동 반영됩니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="bg-blue-600 px-5 py-4 text-white">
            <h2 className="text-lg font-extrabold">러닝 기록 입력</h2>
            <p className="mt-1 text-sm opacity-90">
              5월 1일 ~ 5월 31일 기록만 입력 가능
            </p>
          </div>

          <div className="p-5">
            <label className="mb-1 block font-bold text-slate-700">이름</label>
            <select
              className="mb-4 w-full rounded-xl border border-blue-100 bg-blue-50 p-3 outline-none"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">이름 선택</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <label className="mb-1 block font-bold text-slate-700">일자</label>
            <input
              type="date"
              className="mb-4 w-full rounded-xl border border-emerald-100 bg-emerald-50 p-3 outline-none"
              min={CHALLENGE_START}
              max={maxDate}
              value={runDate}
              onChange={(e) => setRunDate(e.target.value)}
            />

            <label className="mb-1 block font-bold text-slate-700">거리 km</label>
            <input
              type="text"
              inputMode="decimal"
              className="mb-5 w-full rounded-xl border border-violet-100 bg-violet-50 p-3 outline-none"
              placeholder="예: 10.60"
              value={distance}
              onChange={handleDistanceChange}
            />

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="mb-3 w-full rounded-xl bg-slate-900 p-3 font-extrabold text-white shadow disabled:bg-gray-400"
            >
              {saving ? '저장 중...' : '기록 저장'}
            </button>

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
        </div>
      </div>
    </main>
  )
}