"""
국민체육진흥공단 공공데이터 여러 API를 한 번에 받는 스크립트

사용법:
1. 아래 SERVICE_KEY 에 네 인증키를 붙여넣어
2. APIS 리스트에 받고 싶은 API를 하나씩 추가
   - name: 저장될 파일 이름 (확장자 없이)
   - endpoint: 개발계정 상세 페이지의 "End Point" + "상세기능" 주소를 합친 값
   - extra_params: serviceKey/pageNo/numOfRows/resultType 말고 그 API만의 조회조건
     (필수 아니면 빈 딕셔너리 {} 로 둬도 됨)
3. 터미널에서 실행:
   pip install requests
   python fetch_kspo_apis.py
4. collector/ 폴더 안에 API별로 파일이 각각 생성됨
   예: collector/kspo_facilities.json, collector/kspo_courses.json ...
"""

import requests
import json
import time
import os

# ↓↓↓ 여기에 네 인증키 붙여넣기 ↓↓↓
SERVICE_KEY = "12d5b503cc1a072544a255853a2697df7f8927f0541f9a4a8c13186aa3fe8fee"
# ↑↑↑ 여기에 네 인증키 붙여넣기 ↑↑↑

ROWS_PER_PAGE = 1000

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "collector")


# ============================================================
# 받고 싶은 API를 여기 계속 추가하면 돼 (지금은 1개만 있음)
# ============================================================
APIS = [
    {
        "name": "kspo_health_video_ALL_LIST",  # -> collector/kspo_facilities.json
        "endpoint": "https://apis.data.go.kr/B551014/SRVC_TODZ_VDO_PKG/TODZ_VDO_VIEW_ALL_LIST_I",
        "extra_params": {},  # city_cd, local_cd, main_event_cd 등은 필수 아니라 비워둠
    },
    # {
    #     "name": "kspo_courses",
    #     "endpoint": "여기에_등록강좌_정보_API_주소",
    #     "extra_params": {},
    # },
]
# ============================================================


def fetch_page(endpoint: str, extra_params: dict, page_no: int, num_of_rows: int):
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": page_no,
        "numOfRows": num_of_rows,
        "resultType": "json",
        **extra_params,
    }
    res = requests.get(endpoint, params=params, timeout=15)
    res.raise_for_status()
    return res.json()


def extract_items(response_json: dict):
    """body.items.item 이 실제 데이터 배열임 (items 바로가 아님).
    항목이 1건뿐일 땐 item이 배열이 아니라 딕셔너리 하나로 올 수도 있어서 방어."""
    body = response_json.get("response", {}).get("body", {})
    items_wrapper = body.get("items") or {}
    if not isinstance(items_wrapper, dict):
        return []
    item = items_wrapper.get("item") or []
    if isinstance(item, dict):
        return [item]
    return item


def fetch_all(name: str, endpoint: str, extra_params: dict):
    print(f"\n=== [{name}] 시작 ===")
    rows = ROWS_PER_PAGE
    first = fetch_page(endpoint, extra_params, 1, rows)

    header = first.get("response", {}).get("header", {})
    if header.get("resultCode") != "00":
        print(f"[{name}] API 에러:", header)
        return

    body = first["response"]["body"]
    total_count = int(body.get("totalCount", 0))
    print(f"[{name}] 전체 데이터 수: {total_count}건")

    if total_count == 0:
        print(f"[{name}] 데이터 0건 — 필수 조회조건이 빠졌을 수 있어. extra_params 확인해줘.")
        return

    all_items = extract_items(first)
    total_pages = (total_count + rows - 1) // rows
    print(f"[{name}] {rows}건씩 총 {total_pages}페이지를 받습니다...")

    for page in range(2, total_pages + 1):
        data = fetch_page(endpoint, extra_params, page, rows)
        all_items.extend(extract_items(data))
        print(f"  [{name}] {page}/{total_pages} 페이지 완료 (누적 {len(all_items)}건)")
        time.sleep(0.2)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_file = os.path.join(OUTPUT_DIR, f"{name}.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"[{name}] 완료! {len(all_items)}건을 {output_file} 에 저장했어.")


def main():
    if SERVICE_KEY == "여기에_인증키_붙여넣기":
        print("먼저 스크립트 안의 SERVICE_KEY 값을 네 인증키로 바꿔줘.")
        return

    for api in APIS:
        fetch_all(api["name"], api["endpoint"], api["extra_params"])


if __name__ == "__main__":
    main()
