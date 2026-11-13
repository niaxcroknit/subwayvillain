# Claude 임시 아트 스크립트

모두 **임시 보정용**입니다. 정식 그림을 새로 생성하면 이 스크립트는 필요 없습니다.

| 스크립트 | 만드는 파일 | 원본 |
|---|---|---|
| `fixfeet.py` | `assets/atlas/incidents.png` (발 덧그림) | `assets/v4-atlas/incidents.png` — `python3 fixfeet.py <원본> <출력> 0,1,2,3 dark 0,1,2` |
| `mkart.py` | `boss.png`(어깨·가슴 확대 + 검정 티), `herosit.png`(승객 앉은 그림 재색) | `incidents.png`, `passengers.png` (assets/atlas에서 실행) |
| `make_guard.py` | `guard.png` | `incidents.png` |
| (대화 중 인라인) | `spycam.png` = `passengers.png` 0열의 회색 후드를 남색으로 재색, 나머지 열 투명 | `passengers.png` |

순서: fixfeet → mkart → make_guard. 그 뒤 `node scripts/build.cjs`.
