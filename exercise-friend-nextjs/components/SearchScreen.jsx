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
