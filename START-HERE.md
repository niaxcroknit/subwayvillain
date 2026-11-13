# 코덱스 인수인계 — 2호선 격돌 v5

코덱스가 만든 v4에 Claude가 사용자 요청을 반영한 v5 전체 프로젝트입니다. 이 폴더만으로 이어서 작업할 수 있습니다.

## 바로 실행

`game/index.html`을 브라우저에서 엽니다. 이미지 8장은 HTML 안에 들어 있습니다. three.js r128과 Google Fonts를 불러오려면 인터넷 연결이 필요합니다.

## 먼저 읽을 파일 (순서대로)

1. `AGENTS.md`: 현재 확정 규칙과 사용자 피드백 이력
2. `docs/V5-CHANGES.md`: v5에서 바뀐 것, 코드 위치, **새로 그려야 할 임시 아트**, 열린 과제
3. `source/index.html`: 수정용 소스(이미지 대신 짧은 자리표시자)
4. `docs/HANDOFF.md`: v4 기술 인수인계와 v5 작업 로그

`references/history/`의 문서(v4 AGENTS, 초기 지시서, 이전 메시지)는 과거 자료라 현재 기준보다 우선하지 않습니다.

## 빌드 · 검사

```sh
node scripts/build.cjs      # source + assets/atlas/*.png → game/index.html
npm install
npm test                    # 전부 PASS여야 함
npm run test:render         # outputs/*-models-check.png 재생성
npm start                   # http://127.0.0.1:8765
```

## 구성

- `game/`: 바로 실행하는 완성 HTML
- `source/`: 수정용 HTML
- `assets/atlas/`: 실제 쓰는 아틀라스 8장(hero-male, hero-female, passengers, incidents, spycam, boss, herosit, guard). 뒤의 4장과 incidents의 발 보정은 **임시**입니다.
- `assets/v4-atlas/`: 발 보정 전 v4 incidents 원본
- `assets/original/`: 코덱스가 처음 생성한 원본
- `scripts/claude-art/`: 임시 아트 만드는 스크립트와 설명
- `references/approved/`: 승인 스타일
- `outputs/claude-v5/`: v5 화면 캡처
- `tests/`: 자동 검사(v5 기준으로 갱신됨)

사용자가 보낼 첫 메시지 예시는 `CODEX-MESSAGE.txt`에 있습니다.
