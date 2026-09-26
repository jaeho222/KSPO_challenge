// 온보딩 7단계 문제 은행.
// type: "single"(하나만 선택) | "multi"(여러개 선택) | "text"(직접 입력) | "dynamic-multi"(지역 데이터 기반 선택)
export const steps = [
  {
    type: "single",
    eyebrow: "1 / 7",
    title: "성별이 어떻게 되시나요?",
    sub: "맞춤 프로그램을 찾는 데 참고할게요.",
    key: "gender",
    options: [
      { emoji: "👨", label: "남성" },
      { emoji: "👩", label: "여성" },
    ],
  },
  {
    type: "single",
    eyebrow: "2 / 7",
    title: "연령대가 어떻게 되시나요?",
    sub: "맞춤 운동 강도를 정하는 데 사용할게요.",
    key: "age",
    options: [
      { emoji: "🧒", label: "10대" },
      { emoji: "🧑", label: "20대" },
      { emoji: "🧑‍💼", label: "30대" },
      { emoji: "🧑‍🦱", label: "40대" },
      { emoji: "🧑‍🦳", label: "50대" },
      { emoji: "🧓", label: "60대" },
      { emoji: "👴", label: "70대 이상" },
    ],
  },
  {
    type: "multi",
    eyebrow: "3 / 7",
    title: "불편하거나 아픈 부위가 있으신가요?",
    sub: "있으면 관련 스트레칭 영상도 알려드려요.",
    key: "painAreas",
    exclusive: "특별히 없음",
    options: [
      { emoji: "🦵", label: "무릎" },
      { emoji: "🧍", label: "허리" },
      { emoji: "💪", label: "어깨" },
      { emoji: "🙆", label: "특별히 없음" },
    ],
  },
  {
    type: "multi",
    eyebrow: "4 / 7",
    title: "운동으로 얻고 싶은 게 뭔가요?",
    sub: "여러 개 선택할 수 있어요.",
    key: "goals",
    options: [
      { emoji: "⚖️", label: "체중 관리 · 유산소" },
      { emoji: "💪", label: "근력 키우기" },
      { emoji: "🤸", label: "유연성 · 뻐근함 완화" },
      { emoji: "🎯", label: "균형감각 · 순발력" },
    ],
  },
  {
    type: "single",
    eyebrow: "5 / 7",
    title: "장애인 스포츠강좌 정보도 함께 찾아드릴까요?",
    sub: "선택하면 장애인 스포츠강좌 시설도 함께 안내해드려요.",
    key: "disabilityInterest",
    options: [
      { emoji: "✅", label: "예" },
      { emoji: "➖", label: "아니오" },
    ],
  },
  {
    type: "text",
    eyebrow: "6 / 7",
    title: "어디에 살고 계신가요?",
    sub: "이 지역에서 실제로 운영 중인 시설을 찾아드릴게요.",
    key: "region",
    placeholder: "예) 서울 강북구",
  },
  {
    type: "dynamic-multi",
    eyebrow: "7 / 7",
    title: "해보고 싶은 운동을 골라주세요",
    sub: "입력하신 지역에 실제로 등록된 종목만 보여드려요.",
    key: "interests",
  },
];
