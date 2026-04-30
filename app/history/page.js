'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function History() {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    fetchRuns()
  }, [])

  async function fetchRuns() {
    const { data } = await supabase
      .from('runs')
      .select('distance, run_date, members(name)')
      .order('run_date', { ascending: false })

    setRuns(data || [])
  }

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">전체 기록</h1>

      {runs.map((run, index) => (
        <div key={index} className="border p-3 mb-2">
          <div>{run.members.name}</div>
          <div>{run.run_date}</div>
          <div>{run.distance} km</div>
        </div>
      ))}
    </div>
  )
}