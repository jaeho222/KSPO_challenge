// ============================================================
// [통합검색 결과 화면] 지역명+종목명+시설명을 자유 조합으로 검색
// - 렌더링 위치: App.jsx가 screenMode==='search'일 때 렌더링
// - 이 화면에 처음 들어올 때만 App.jsx가 전국 259개 지역 전체 데이터
//   (kspo_data.json, 5.5MB)를 그제서야 불러옴 (검색 안 쓰면 평생 안 받는 구조)
// - 실제 검색 로직은 lib/logic.js 의 searchFacilities() 함수가 담당
// ============================================================

"use client";

import { searchFacilities } from "../lib/logic";
import FacilityCard from "./FacilityCard";

export default function SearchScreen({ data, query }) {
  const { results, total } = searchFacilities(data.kspo, query, 30);
  const q = (query || "").trim();

  return (
    <>
      <p className="eyebrow">검색 결과</p>
      <h1>{q ? `"${q}" 검색 결과` : "시설이나 종목을 검색해보세요"}</h1>
      <p className="sub">
        지역명("강동구"), 종목명("태권도"), 시설명 중 뭐든 입력해보세요. 조합도 가능해요(예: "강동구
        태권도").
      </p>

      {!q ? (
        <p className="hint">예) 태권도, 강북구, 강동구 검도, 필라테스</p>
      ) : results.length ? (
        <>
          {total > results.length ? (
            <p className="hint" style={{ marginBottom: 12 }}>
              전체 {total}개 중 {results.length}개를 보여드려요.
            </p>
          ) : null}
          <div className="facility-list">
            {results.map((f, i) => (
              <FacilityCard key={i} f={f} />
            ))}
          </div>
        </>
      ) : (
        <p className="hint">검색 결과가 없어요. 다른 이름으로 다시 찾아보세요.</p>
      )}
    </>
  );
}
