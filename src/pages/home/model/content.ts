/** 360도 분해 구간의 설명. from~to는 구간 스크롤 진행도(0~1)입니다. */
export interface AnatomyCaption {
  id: string
  from: number
  to: number
  kicker: string
  title: string
  body: string
  /** 화면 왼쪽(start)과 오른쪽(end) 중 어디에 둘지 */
  side: 'start' | 'end'
}

export const ANATOMY_CAPTIONS: readonly AnatomyCaption[] = [
  {
    id: 'case',
    from: 0,
    to: 0.17,
    kicker: 'Case · 41.5 mm',
    title: '장갑을 끼고도 돌리는 양파 크라운',
    body: '비드블라스트 스테인리스 케이스의 3시 방향에 홈이 깊은 큰 양파 모양 크라운을, 그 위아래에 크로노그래프 푸셔를 달아 비행 장갑을 낀 손으로도 맞추고 잽니다.',
    side: 'start',
  },
  {
    id: 'caseback',
    from: 0.2,
    to: 0.42,
    kicker: 'Caseback · 20 bar',
    title: '나사로 잠그는 케이스백',
    body: '뒷면에는 크림슨 호 상징과 CA-01 각인, 200m 방수와 80,000 A/m 내자성 표기를 새겼습니다.',
    side: 'end',
  },
  {
    id: 'bezel',
    from: 0.66,
    to: 0.82,
    kicker: 'Bezel · 0–15 min',
    title: '15분을 크림슨으로 칠한 베젤',
    body: '양방향 회전 베젤의 처음 15분을 크림슨으로 칠해 비행 구간의 남은 시간을 한눈에 읽습니다. 이름도 이 호에서 왔습니다.',
    side: 'start',
  },
  {
    id: 'movement',
    from: 0.85,
    to: 1.01,
    kicker: 'Movement · 4 Hz',
    title: '크림슨 호 브리지 아래의 심장',
    body: '초당 8번 뛰는 밸런스와 42시간 파워 리저브의 자동 크로노그래프 무브먼트를 붉은 호 모양 브리지가 붙잡고 있습니다.',
    side: 'end',
  },
]

export type DetailShape = 'silhouette' | 'text'

export interface DetailStep {
  id: string
  /** 입자가 만들 모양 */
  shape: DetailShape
  /** shape가 text일 때 그릴 글자 */
  glyphs?: string
  kicker: string
  title: string
  body: string
}

export const DETAIL_STEPS: readonly DetailStep[] = [
  {
    id: 'silhouette',
    shape: 'silhouette',
    kicker: 'CA-01',
    title: '수천 개의 점으로 그린 실루엣',
    body: '시퀀스 첫 프레임의 밝은 부분만 골라 입자 수천 개의 목표점으로 썼습니다. 마우스를 올리면 흩어졌다가 제자리로 돌아옵니다.',
  },
  {
    id: 'magnetic',
    shape: 'text',
    glyphs: '80K',
    kicker: 'Anti-magnetic',
    title: '80,000A/m 내자성',
    body: '무브먼트를 감싼 연철 케이지가 조종석 계기와 스피커의 자기장을 막아, 비행 중에도 오차가 흐트러지지 않습니다.',
  },
  {
    id: 'beat',
    shape: 'text',
    glyphs: '4Hz',
    kicker: 'Frequency',
    title: '초당 8번 뛰는 크로노그래프 초침',
    body: '28,800 vph로 진동하는 밸런스 덕분에 크로노그래프 초침이 1초를 여덟 걸음으로 나눠 재고, 6시 적산계가 30분까지 셉니다.',
  },
  {
    id: 'reserve',
    shape: 'text',
    glyphs: '42H',
    kicker: 'Power reserve',
    title: '이틀 가까이 가는 태엽',
    body: '손목에서 풀어 두어도 42시간 동안 멈추지 않아 금요일 밤에 벗어 둔 시계가 일요일 오후까지 갑니다.',
  },
]

export interface SpecGroup {
  id: string
  title: string
  items: readonly { term: string; detail: string }[]
}

export const SPEC_GROUPS: readonly SpecGroup[] = [
  {
    id: 'case',
    title: '케이스',
    items: [
      { term: '지름 · 두께', detail: '41.5mm · 13.6mm' },
      { term: '러그 너비', detail: '22mm' },
      {
        term: '소재',
        detail: '비드블라스트 스틸, 그레이드 5 티타늄, 블랙 DLC',
      },
      { term: '방수', detail: '200m (20bar)' },
      { term: '크라운', detail: '3시 방향 양파 모양, 나사식' },
      { term: '푸셔', detail: '2시 시작·정지, 4시 초기화' },
    ],
  },
  {
    id: 'movement',
    title: '무브먼트',
    items: [
      { term: '칼리버', detail: 'CA-01 자동 크로노그래프 (가상)' },
      { term: '기능', detail: '시·분·초, 날짜, 30분 크로노그래프' },
      { term: '진동수', detail: '28,800vph (4Hz)' },
      { term: '파워 리저브', detail: '42시간' },
      { term: '보석', detail: '26개' },
      { term: '내자성', detail: '80,000A/m (연철 케이지)' },
    ],
  },
  {
    id: 'dial',
    title: '문자판 · 베젤',
    items: [
      {
        term: '배치',
        detail: '12시 삼각형과 두 점, 큰 아라비아 숫자, 철길 분 눈금 (Type A)',
      },
      {
        term: '적산계',
        detail: '6시 30분 크로노그래프, 윗선을 감싼 크림슨 호',
      },
      { term: '베젤', detail: '양방향 회전 비행 시간 베젤, 0–15분 크림슨 호' },
      {
        term: '문자판',
        detail: '매트 블랙, 크림슨 래커, 딥 네이비, 스노우 화이트',
      },
      { term: '야광', detail: '숫자·12시 삼각형·핸즈·베젤 삼각형' },
      { term: '크리스털', detail: '돔형 사파이어, 안쪽 무반사 코팅' },
    ],
  },
  {
    id: 'strap',
    title: '스트랩',
    items: [
      {
        term: '종류',
        detail: '리벳을 박은 블랙·크림슨 가죽, H-링크 브레이슬릿',
      },
      {
        term: '버클',
        detail:
          '가죽은 핀 버클, 브레이슬릿은 비행 재킷 위에 차는 연장 장치가 달린 폴딩 클래스프',
      },
    ],
  },
]
