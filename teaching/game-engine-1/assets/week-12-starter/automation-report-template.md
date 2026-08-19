# Week 12 · Automation Readiness Report

## A. Route와 환경

- Route: A Connected / B Partial / C Offline fixture
- 경로를 선택하거나 전환한 이유:
- Unity Editor version:
- Assistant package version 또는 해당 없음:
- Unity CLI version 또는 fixture version:
- `--help`에서 실제로 확인한 명령:

## B. Manual baseline

| 관찰 항목 | 실행 전 수동 값 | 증거 파일 | 비고 |
|---|---|---|---|
| active Scene |  |  |  |
| root GameObject count |  |  |  |
| `Player` 수와 path |  |  |  |
| `AutomationProbe` 수 |  |  |  |
| Probe Position / Rotation / Scale |  |  |  |
| Console Error / Warning / Log count |  |  |  |
| 미저장 Scene·예상 밖 file diff |  |  |  |

## C. Connection 또는 fixture 판독

- command 또는 fixture 이름:
- command / success / target project:
- errors / warnings:
- exit code 또는 fixture 표기:
- 실제 environment 출력인지 교육용 fixture인지:
- 수동 Unity 상태와 일치하는가:

## D. Read-only evidence 01 · Console

- 사용 방법: MCP / manual / fixture
- 읽은 Error·Warning count:
- 한 줄 요약:
- 수동 Console count:
- 일치 / 불일치와 근거:
- read 단계의 project diff가 0인가:

## E. Read-only evidence 02 · Player Components

- 사용 방법: MCP / manual / fixture
- 읽은 exact GameObject path:
- 읽은 Component 이름:
- 수동 Inspector의 path·Component:
- 일치 / 불일치와 근거:
- read 단계의 project diff가 0인가:

## F. Authorization contract 요약

- 정확한 target:
- 허용 tool·property·횟수:
- before / expected after:
- 금지 범위:
- 중단 조건:
- rollback과 재검사:

## G. Before → After → Rollback

| 항목 | Before | After one write | After rollback | baseline과 일치 |
|---|---|---|---|---|
| Probe Position X | 0 | 1 | 0 |  |
| Probe Position Y·Z |  |  |  |  |
| Probe Rotation / Scale |  |  |  |  |
| root GameObject count |  |  |  |  |
| Console Error / Warning |  |  |  |  |
| Scene·file diff |  |  |  |  |

## H. 최종 판정

- T01–T08: PASS / FAIL
- 실제로 발생한 FAIL과 가장 가까운 수정 단계:
- final project가 baseline과 일치함:
- 제출 증거에서 key·token·계정·불필요한 개인정보가 없음:
- 자동화가 성공했다고 판단한 근거를 두 문장으로 설명:
