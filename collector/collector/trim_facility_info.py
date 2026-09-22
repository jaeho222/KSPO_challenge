"""
전국체육시설 정보 원본 JSON을 가볍게 정제하는 스크립트

- 폐업 시설 제외 (faci_stat_nm == '정상운영'만 남김)
- 좌표 없는 시설 제외
- 서비스에 안 쓰는 컬럼 제거

사용법:
1. 이 스크립트를 원본 kspo_korea_facility_info.json 파일과 같은 폴더에 둬
   (보통 collector/collector/ 안에 있을 거야)
2. 실행: python trim_facility_info.py
3. 같은 폴더에 kspo_korea_facility_info.json 을 덮어씀 (원본은 자동 백업됨)
"""

import json
import os
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, "kspo_korea_facility_info.json")
BACKUP_FILE = os.path.join(SCRIPT_DIR, "kspo_korea_facility_info.raw.json")

KEEP_FIELDS = [
    "faci_cd", "faci_nm", "ftype_nm",
    "addr_ctpv_nm", "addr_cpb_nm", "addr_emd_nm",
    "faci_road_addr", "faci_addr", "faci_zip", "faci_road_zip",
    "faci_lat", "faci_lot", "faci_gfa",
    "nation_yn", "cp_nm", "fmng_cp_nm",
]


def main():
    if not os.path.exists(INPUT_FILE):
        print(f"파일을 찾을 수 없어: {INPUT_FILE}")
        return

    print("원본 로딩 중...")
    with open(INPUT_FILE, encoding="utf-8") as f:
        data = json.load(f)
    print(f"원본 건수: {len(data)}")

    slim = []
    for x in data:
        if x.get("faci_stat_nm") != "정상운영":
            continue
        if not x.get("faci_lat") or not x.get("faci_lot"):
            continue
        slim.append({k: x.get(k) for k in KEEP_FIELDS})

    print(f"정제 후 건수: {len(slim)}")

    # 원본은 백업으로 남기고 (이미 백업 있으면 건너뜀), .gitignore로 관리
    if not os.path.exists(BACKUP_FILE):
        shutil.copy(INPUT_FILE, BACKUP_FILE)
        print(f"원본 백업: {BACKUP_FILE}")

    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(slim, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = os.path.getsize(INPUT_FILE) / 1024 / 1024
    print(f"\n완료! {INPUT_FILE}")
    print(f"파일 크기: {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
