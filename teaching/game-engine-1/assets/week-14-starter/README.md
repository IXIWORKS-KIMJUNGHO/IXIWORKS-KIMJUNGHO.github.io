# Game Engine I Week 14 mentoring starter

이 폴더는 14주차 기말 프로젝트 1차 면담과 개인 체크포인트 기록용입니다. 완성 코드나 정답 에셋은 포함하지 않습니다.

## 수업 전 준비

1. 13주차 `Alpha_v1` build를 다른 폴더에서 실행합니다.
2. 최근 작동 Unity project를 `Week14_학번_이름`으로 복사합니다.
3. 이 폴더의 세 파일을 `Evidence/Week14/`에 복사합니다.
4. 이름과 학번은 제출 파일명에만 사용하고 면담 CSV 본문에는 불필요한 개인정보를 넣지 않습니다.
5. 핵심 Scene, Prefab, Script 1-2개와 13주차 플레이테스트 기록을 바로 열 수 있게 준비합니다.

## 파일 역할

- `MENTORING_CHECKPOINT-template.md`: 면담 결정, 변경 계약, 결과와 15주차 첫 행동을 기록합니다.
- `week14-interview-template.csv`: 교수자와 학생이 면담에서 확인한 사실과 결정을 한 행씩 기록합니다.
- `architecture-map-template.md`: 핵심 mechanic이 Scene에서 피드백까지 이동하는 실제 구조를 정리합니다.

## 면담 완료 기준

- 학생이 Alpha build를 직접 실행합니다.
- 핵심 mechanic을 행동, 조건, 상태 변화와 목표로 설명합니다.
- Scene, Prefab, 핵심 Script와 피드백의 실제 이름을 연결합니다.
- 핵심 Script 한 건을 owner, event, condition, state, feedback과 proof로 설명합니다.
- 13주차 플레이테스트 증거와 AI 사용 또는 미사용 기록을 확인합니다.
- blocking issue 하나, 허용 변경, 완료 조건과 회귀 검사를 승인합니다.

## 3교시 작업 경로

### FIX

P0 또는 P1이고 수정과 재검사를 20분 안에 끝낼 수 있으며 되돌리기 쉽습니다. 승인 범위 안에서 한 번 수정하고 같은 조건을 재검사합니다.

### DIAGNOSE

원인이 불명확하거나 구조 변경 위험이 큽니다. 안전한 build를 보존하고 재현 조건, 최초 다른 상태, 확인한 소유자와 다음 진단 행동을 기록합니다.

### DEFER

P2 또는 P3이거나 핵심 한 판의 완료를 막지 않습니다. 15주차 검증표 또는 Drop으로 옮기고 새 기능을 시작하지 않습니다.

## 제출 폴더 예시

```text
Week14_학번_이름/
  UnityProject/
  Build/
    Week14_Checkpoint/
  Evidence/
    Week14/
      before.png
      after.png
      console.png
      architecture-map.md
      week14_학번_이름_mentoring-tests.csv
      week14-interview.csv
      MENTORING_CHECKPOINT.md
```

## 개인정보와 AI 기록

- 다른 학생의 이름, 학번, 연락처와 계정 정보를 적지 않습니다.
- AI를 사용하지 않아도 불이익이 없습니다.
- 사용했다면 요청, 제안 중 선택, 실제 변경과 사람의 검증을 구분합니다.
- 설명할 수 없는 생성 코드는 핵심 기능에 남기지 않습니다.
- 계정, API key, 개인 경로와 권리가 불분명한 에셋을 AI 대화나 제출 기록에 포함하지 않습니다.
