# public/data 폴더 설명

이 폴더 안의 JSON 파일들은 주석을 달 수 없는 형식이라, 여기에 각 파일이 뭔지 정리해둠.
(어떤 파일이 언제 로드되는지는 components/App.jsx 상단 주석의 "3단계 로딩" 설명 참고)

## 1단계에서 로드 (앱 켜자마자, 항상)

| 파일 | 내용 | 어디서 쓰는지 |
|---|---|---|
| `region_index.json` | 전국 259개 지역 이름 목록(regions), 지역별 종목 목록(regionSports), 지역별 시설개수(regionFacilityCounts, 형평성지수 계산용), 지역이름→숫자파일ID 매핑(regionFileMap) | App.jsx 1단계 로딩, lib/logic.js의 findRegionKey·getRegionSports·getRegionEquity |

## 2단계에서 로드 (온보딩 끝나고 "완료" 화면 진입 시, 백그라운드)

| 파일 | 내용 | 어디서 쓰는지 |
|---|---|---|
| `fitness_standards.json` | 국민체력100 등급 기준표 (자체수집 데이터 - Open API 미제공, nfa.kspo.or.kr 직접 수집) | lib/logic.js의 getFitnessItemDetails, InfoCards.jsx의 FitnessRefCard |
| `guide_data.json` | 목적별 운동가이드 영상 목록 | lib/logic.js의 getGuideVideos, HomeScreen.jsx "목적에 맞는 운동 가이드" 섹션 |
| `mscl_data.json` | 재활 스트레칭 영상 목록 | lib/logic.js의 getRehabVideos, HomeScreen.jsx "통증 완화 스트레칭" 섹션 |
| `std_ftns_data.json` | 국민체력100 표준운동프로그램 (연령대별 4주차 준비/본/정리운동) | lib/logic.js의 getWeeklyRoutine, InfoCards.jsx의 RoutineCard |
| `cert_data.json` | 체력측정 방법 안내 영상 | lib/logic.js의 findCertVideo, CertChallenge.jsx "측정 방법 보기" 버튼 |
| `routine_goal_data.json` | 목표별(요통예방/낙상예방 등 16종) 맞춤 루틴 영상 | lib/logic.js의 getGoalRoutine, HomeScreen.jsx "목표별 맞춤 루틴" 섹션 (미활용 데이터셋이었다가 추가 활용함) |
| `disable_facilities.json` | 장애인 이용 가능 시설 목록 (온보딩에서 "예" 선택한 사람만 로드, 870KB라 조건부) | lib/logic.js의 getDisableFacilities, HomeScreen.jsx "장애인 이용 가능 시설 안내" 섹션. ⚠️ 강좌 데이터와 조인 불가(원본 데이터에 공통 키 없음)해서 시설명/주소/종목만 있음 |
| `region_facilities/*.json` (259개 파일, 숫자 이름) | 지역 1곳의 시설 목록 전체 (강�적정보 포함). 파일명이 지역명이 아니라 숫자인 이유: 한글 파일명이 Windows 압축해제 시 깨지는 문제가 있어서 region_index.json의 regionFileMap으로 매핑함 | App.jsx가 내 지역 것만 딱 1개 불러옴 |

## 3단계에서 로드 (검색 탭 처음 열 때만, 5.5MB라 제일 무거움)

| 파일 | 내용 | 어디서 쓰는지 |
|---|---|---|
| `kspo_data.json` | 전국 259개 지역의 시설 전체(region_facilities/*.json 259개를 합친 것과 사실상 같은 내용) + regions/regionSports | App.jsx 3단계 로딩, SearchScreen.jsx의 전국 통합검색 |

## 영상 재생 관련 (2026-09-29 추가)

`guide_data.json`, `mscl_data.json`, `cert_data.json`, `routine_goal_data.json`에는
`vid`(영상 URL), `thumb`(썸네일 URL) 필드가 들어있음 — 원본 공공데이터의 `file_url`+
`file_nm` 필드를 조합해서 만든 실제 KSPO 영상 서버 주소임.

⚠️ **이 URL이 `http://`(암호화 안 됨)라서, `https://`로 배포하면 브라우저가
"혼합 콘텐츠"로 재생을 차단할 수 있음.** VideoCard.jsx가 재생 실패 시 자동으로
"새 탭에서 열기" 링크를 대신 보여주긴 하지만, **배포 후 실제로 인라인 재생이
되는지 친구(백엔드)가 꼭 확인해야 함.** 안 되면 서버에서 영상을 프록시하거나
자체 호스팅하는 방안을 검토해야 함.

## 참고: 왜 kspo_data.json과 region_facilities/*.json이 내용이 겹치나요?

`kspo_data.json`은 원본 그대로 두고(검색 전용, 지연로딩), `region_facilities/*.json`은
거기서 지역 1곳씩 잘라낸 것 + 숫자 파일명으로 만든 파생 파일임. 데이터 자체를 두 번
관리하는 게 아니라, "성능을 위해 같은 데이터를 두 가지 접근 방식으로 잘라둔 것"임.

