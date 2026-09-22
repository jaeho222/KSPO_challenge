kspo_facilities - 서울올림픽기념국민체육진흥공단 스포츠강좌이용권 등록시설 정보 GW

kspo_lecture_info 스포츠강좌이용권 등록강좌 정보

kspo_disable_sports_lecture_facility   장애인스포츠강좌이용권 등록시설 정보

kspo_disable_sports_lecture_lecture 장애인스포츠강좌이용권 등록강좌 정보

kspo_korea_facility_info 서울올림픽기념국민체육진흥공단 전국체육시설 정보

kspo_health_video  서울올림픽기념국민체육진흥공단 국민체력100 동영상 정보

fitness_grade_standards.json - 서울올림픽기념국민체육진흥공단 국민체력100 인증기준 
		(https://nfa.kspo.or.kr/reserve/0/selectMeasureGradeItemListByAgeSe.kspo)
	- 공공데이터포털 Open API가 아니라, 공식 홈페이지 페이지를 저장해
  parse_fitness_grades.py로 파싱한 자체 수집 데이터
	- 내용: 연령대(유아기/유소년기/청소년기/성인기/어르신기) x 성별 x
  1~3등급별 체력 측정 기준 수치 182건
  (4~6등급은 표가 아니라 규칙으로 정의되어 derived_grade_rules에 별도 기재)
	- 용도: 사용자가 입력한 측정값(또는 자가진단)을 국민체력100 등급으로
  변환해, kspo_health_video의 ftns_lvl_nm(1~5등급)과 매칭하는 데 사용