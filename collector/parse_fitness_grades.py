"""
국민체력100 인증기준 HTML -> JSON 변환 스크립트

사용법:
1. https://nfa.kspo.or.kr/reserve/0/selectMeasureGradeItemListByAgeSe.kspo
   페이지를 Ctrl+S ("웹페이지, HTML만")로 저장해서 이 스크립트와 같은 폴더에 둬
2. 아래 INPUT_HTML 에 저장한 파일 이름을 적어
3. 실행:
   pip install beautifulsoup4
   python parse_fitness_grades.py
4. collector/fitness_grade_standards.json 생성됨

페이지 구조 메모:
- 연령대(h5)마다 [항목명 표 / 남자 표 / 여자 표] 3개가 한 세트이고,
  이 세트가 1등급, 2등급, 3등급 순서로 반복된다.
- 4~6등급은 표가 아니라 규칙으로 정의됨 (아래 DERIVED_GRADE_RULES 참고).
- 어르신기는 측정항목이 다른 부가 기준표가 뒤에 더 붙는다.
"""

from bs4 import BeautifulSoup
import json
import os
import re

INPUT_HTML = "kspo_grade.html"  # 저장한 HTML 파일 이름

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "collector")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "fitness_grade_standards.json")

# 표로 제공되지 않고 규칙으로 정해지는 등급 (참고용으로 JSON에 같이 넣음)
DERIVED_GRADE_RULES = {
    "4등급": "심폐지구력과 근력이 3등급 인증기준 이상",
    "5등급": "심폐지구력 또는 근력이 3등급 인증기준 이상",
    "6등급": "5등급 인증기준 이하인 경우",
}


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def get_item_names(table):
    """표 헤더에서 측정항목명 목록을 뽑는다.

    헤더가 3줄(구분 / 체력요인 / 실제 측정항목명)로 병합돼 있어서,
    th만으로 이루어진 마지막 줄이 실제 측정항목명이다.
    """
    last_header = None
    for tr in table.find_all("tr"):
        cells = tr.find_all(["th", "td"])
        if not cells:
            continue
        texts = [clean(c.get_text(" ")) for c in cells]
        # 첫 칸이 성별(남/여)이면 여기서부터 데이터 행이므로 헤더 탐색 종료
        if re.fullmatch(r"[남여]", texts[0]):
            break
        last_header = texts
    if not last_header:
        return []
    # '성별', '연령' 같은 헤더는 측정항목이 아니므로 제외
    return [n for n in last_header if not re.fullmatch(r"성별|연령\s*\(?만\)?", n)]


def parse(html_path: str):
    with open(html_path, encoding="utf-8", errors="replace") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # 연령대별로 표를 순서대로 모은다
    stages = []  # [(stage_name, [table, ...]), ...]
    current = None
    for el in soup.find_all(["h5", "table"]):
        if el.name == "h5":
            name = clean(el.get_text(" ")).replace(" 인증기준", "")
            current = (name, [])
            stages.append(current)
        elif current is not None:
            current[1].append(el)

    records = []
    for stage_name, tables in stages:
        # 3개씩(항목명/남/여) 묶어서 한 등급 세트로 처리
        for gi in range(0, len(tables) // 3):
            header_tbl = tables[gi * 3]
            data_tbls = tables[gi * 3 + 1 : gi * 3 + 3]

            header_names = get_item_names(header_tbl)
            grade = f"{gi + 1}등급" if gi < 3 else f"부가기준{gi - 2}"

            for tbl in data_tbls:
                # 데이터 표에도 같은 헤더가 들어있어서 그쪽을 우선 사용 (열 수가 정확히 맞음)
                item_names = get_item_names(tbl) or header_names
                # 성별 칸은 rowspan으로 첫 행에만 있으므로 이어서 기억해둔다
                current_sex = None
                for tr in tbl.find_all("tr"):
                    tds = tr.find_all("td")
                    if len(tds) < 2:
                        continue
                    values = [clean(td.get_text(" ")) for td in tds]

                    if re.fullmatch(r"[남여]", values[0]):
                        current_sex = values[0]
                        values = values[1:]
                    if current_sex is None:
                        continue

                    sex = current_sex
                    age_range = values[0]
                    nums = values[1:]
                    if not nums:
                        continue

                    items = {}
                    for i, v in enumerate(nums):
                        key = item_names[i] if i < len(item_names) else f"항목{i + 1}"
                        items[key] = v

                    records.append(
                        {
                            "age_stage": stage_name,
                            "grade": grade,
                            "sex": sex,
                            "age_range": age_range,
                            "items": items,
                        }
                    )

    return records


def main():
    html_path = os.path.join(SCRIPT_DIR, INPUT_HTML)
    if not os.path.exists(html_path):
        print(f"HTML 파일을 찾을 수 없어: {html_path}")
        print("INPUT_HTML 값을 실제 저장한 파일 이름으로 바꿔줘.")
        return

    records = parse(html_path)
    if not records:
        print("추출된 데이터가 없어. HTML이 제대로 저장됐는지 확인해줘.")
        return

    output = {
        "source": "https://nfa.kspo.or.kr/reserve/0/selectMeasureGradeItemListByAgeSe.kspo",
        "derived_grade_rules": DERIVED_GRADE_RULES,
        "standards": records,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"총 {len(records)}건 추출 -> {OUTPUT_FILE}\n")
    seen = {}
    for r in records:
        seen.setdefault(r["age_stage"], set()).add(r["grade"])
    for stage, grades in seen.items():
        n = sum(1 for r in records if r["age_stage"] == stage)
        print(f"  {stage}: {n}건 (등급: {', '.join(sorted(grades))})")


if __name__ == "__main__":
    main()
