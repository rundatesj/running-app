"use client";

import { useEffect, useState } from "react";

export default function MyPage() {
  const [records, setRecords] = useState([]);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    // 기존에 dashboard/stats에서 쓰던 데이터 불러오는 코드 그대로 가져오기
  }, []);

  const names = [...new Set(records.map(item => item.nickname))];

  const myRecords = records.filter(
    item => item.nickname === selectedName
  );

  const totalDistance = myRecords.reduce(
    (sum, item) => sum + Number(item.distance || 0),
    0
  );

  return (
    <main>
      <h1>나의 러닝 기록</h1>

      <select
        value={selectedName}
        onChange={(e) => setSelectedName(e.target.value)}
      >
        <option value="">닉네임을 선택하세요</option>
        {names.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {selectedName && (
        <>
          <h2>{selectedName}님의 기록</h2>

          <div>
            <p>누적거리: {totalDistance.toFixed(1)}km</p>
            <p>출석일수: {myRecords.length}일</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>거리</th>
                <th>시간</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.date}</td>
                  <td>{record.distance}km</td>
                  <td>{record.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
