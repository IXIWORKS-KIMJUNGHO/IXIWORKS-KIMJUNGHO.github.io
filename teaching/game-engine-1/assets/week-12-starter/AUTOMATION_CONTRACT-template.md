# Week 12 · Automation Authorization Contract

## 1. 실행 환경

- 학번 / 이름:
- 선택 경로: Route A / Route B / Route C
- Unity Editor version:
- Assistant package version 또는 해당 없음:
- Unity CLI version 또는 fixture version:
- project 식별명: `Week12_AutomationLab`
- active Scene:
- checkpoint 위치와 시각:

## 2. 정확한 대상

- GameObject: `AutomationProbe`
- active Scene에서 같은 이름의 수: 반드시 1
- Component: `Transform`
- property: `Position.x`
- 실행 전 수동 Inspector 값: 0 / 다른 값이면 중단

## 3. 허용한 실행

- Route A: Probe Transform read와 Position X set tool만 허용
- Route B·C: Inspector의 Position X field와 Unity Undo만 허용
- 예상 변경: `Position.x 0 → 1`
- 실행 횟수: 변경 1회
- 실행자와 승인 시각:

## 4. 금지한 실행

- Position Y·Z, Rotation, Scale 변경
- 다른 GameObject·Component 생성, 삭제, 이동 또는 수정
- Script, Prefab, Scene 구조, Package와 ProjectSettings 변경
- build, license, account와 credential 변경
- 모호한 대상의 임의 선택과 자동 반복 실행

## 5. 중단 조건

- `AutomationProbe`가 없거나 둘 이상임
- active Scene 또는 project가 계약과 다름
- 실행 전 Position X가 0이 아님
- X 외의 상태가 바뀌거나 새 Console Error·Warning이 생김
- tool이 다른 대상을 읽거나 쓰려고 함

중단했을 때의 실제 관찰과 시각:

## 6. 실행 뒤 검증

- Position X: 1
- Position Y·Z / Rotation / Scale: baseline과 일치
- Hierarchy와 Component: baseline과 일치
- Console Error·Warning: 새 항목 0
- Scene·file diff: 예상 밖 변경 0

## 7. Rollback

- 방법: Unity Undo / 승인된 명시적 X=0
- 예상 복구: `Position.x 1 → 0`
- 실행 횟수: 복구 1회
- 복구 뒤 Transform·Scene·Console·file 재검사 결과:
- baseline과 일치함: PASS / FAIL
