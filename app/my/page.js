return (
  <main className="min-h-screen p-4">

    <h1 className="mb-4 text-2xl font-extrabold">
      개인 러닝 리포트
    </h1>

    <select
      value={selectedName}
      onChange={(e)=>setSelectedName(e.target.value)}
      className="mb-5 w-full rounded-xl border p-3"
    >
      <option value="">
        닉네임 선택
      </option>

      {names.map(name => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>

    {selectedName && (
      <>
        <div className="grid grid-cols-3 gap-3">

          <Card
            title="누적거리"
            value={`${totalDistance.toFixed(1)}km`}
          />

          <Card
            title="출석일수"
            value={`${attendance}일`}
          />

          <Card
            title="최장거리"
            value={`${maxDistance}km`}
          />

        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow">

          <h2 className="mb-3 font-bold">
            러닝 기록
          </h2>

          {myRuns.map((run, idx) => (
            <div
              key={idx}
              className="flex justify-between border-b py-2"
            >
              <span>{run.run_date}</span>
              <span>{run.distance}km</span>
            </div>
          ))}

        </div>

      </>
    )}

  </main>
)
