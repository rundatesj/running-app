'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const CHALLENGE_START = '2026-05-01'
const CHALLENGE_END = '2026-05-31'

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

    alert('저장 완료!')

    setMemberId('')
    setRunDate(getDefaultDate())
    setDistance('')
  }

  return (
    <main className="min-h-screen bg-gray-100 p-5">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow">
        <h1 className="mb-5 text-2xl font-bold">5월 러닝 챌린지</h1>

        <label className="mb-1 block font-semibold">이름</label>
        <select
          className="mb-4 w-full rounded border p-3"
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

        <label className="mb-1 block font-semibold">일자</label>
        <input
          type="date"
          className="mb-4 w-full rounded border p-3"
          min={CHALLENGE_START}
          max={maxDate}
          value={runDate}
          onChange={(e) => setRunDate(e.target.value)}
        />

        <label className="mb-1 block font-semibold">거리 km</label>
        <input
          type="text"
          inputMode="decimal"
          className="mb-5 w-full rounded border p-3"
          placeholder="예: 10.60"
          value={distance}
          onChange={handleDistanceChange}
        />

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mb-3 w-full rounded bg-black p-3 font-bold text-white disabled:bg-gray-400"
        >
          {saving ? '저장 중...' : '기록 저장'}
        </button>

        <Link
          href="/dashboard"
          className="block w-full rounded border p-3 text-center font-bold"
        >
          순위 대시보드 보기
        </Link>
      </div>
    </main>
  )
}