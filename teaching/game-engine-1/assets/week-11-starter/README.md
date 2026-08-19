# Game Engine I 11주차 시작 자료

이 폴더는 11주차 개인 실습의 변경 통제와 검증 기록을 위한 시작 틀입니다. 완성 코드는 포함하지 않습니다.

## 미션

기존 30초 게임에 Time Bonus 하나를 추가합니다.

- Playing에서 Player가 처음 접촉하면 남은 시간에 5초를 더합니다.
- 남은 시간은 최대 30초를 넘지 않습니다.
- 같은 Time Bonus는 한 번만 처리합니다.
- Ready, Won, Lost에서는 시간과 오브젝트를 바꾸지 않습니다.
- 기존 수집, 성공, 실패와 재시작을 모두 보존합니다.

## Agent 구현 코드 변경 범위

허용:

- 기존 `GameManager.cs` 한 파일 수정
- 새 `TimeBonus.cs` 한 파일 생성

금지:

- Scene과 Prefab 자동 변경
- 다른 Script, `Packages/`, `ProjectSettings/` 변경
- `.meta` 파일 직접 작성 또는 편집
- package 설치, 파일 삭제와 대량 이동
- `AI_CHANGE_LOG.md`와 테스트 기록 자동 작성

Scene의 GameObject, Collider2D, Component와 GameManager 참조는 학생이 Unity Inspector에서 직접 연결합니다.

## 예상 지원 산출물

Agent가 작성하는 구현 코드는 두 C# 파일입니다. 다음 파일은 숨기거나 삭제할 대상이 아니라 작성 주체를 구분해 기록할 지원 산출물입니다.

- Plan mode가 `Assets/Plans`에 저장한 Markdown과 그 `.meta`
- Unity가 새 `TimeBonus.cs`와 Scene에 자동 생성한 `.meta`
- 학생이 Save As하고 Inspector에서 연결한 `Week11_TimeBonus` Scene

Agent는 `.meta`를 직접 편집하지 않습니다. Unity가 만든 `.meta`는 Asset과 함께 보존합니다.

## 사용 순서

1. 이 폴더를 `week11_학번_이름_evidence`로 복제합니다.
2. `AI_CHANGE_LOG-template.md`를 `AI_CHANGE_LOG.md`로 바꿉니다.
3. 변경 전 전체 게임 루프와 Console Error 0을 확인합니다.
4. Ask 원문과 실제 파일 대조 결과를 기록합니다.
5. 새 Scene을 `File → Build Profiles → Scene List → Add Open Scenes`로 등록합니다. `Week11_TimeBonus`를 첫 번째 활성 Scene으로 옮기거나 이전 Scene을 비활성화하고, 체크와 중복 여부를 확인합니다.
6. Plan을 검토하고 구현 코드 두 파일, 지원 산출물, 금지 대상, 수동 작업, 위험과 테스트를 승인합니다.
7. Route A는 Write scripts only Agent를 실행하고, Route B는 승인한 직접 작성 범위 안에서 두 Script를 작성합니다.
8. 새 파일도 diff에 포함되도록 `git add -N -- Assets/Scripts/TimeBonus.cs`를 실행합니다. 이는 내용을 stage하지 않고 intent-to-add만 표시합니다.
9. `git diff -- Assets/Scripts/GameManager.cs Assets/Scripts/TimeBonus.cs`로 구현 코드 diff를 저장하고 `git diff --cached`가 비었는지 확인합니다.
10. Unity Scene 연결을 직접 수행합니다. Player 또는 TimeBonus 중 적어도 하나에 활성 `Rigidbody2D`가 있는지도 확인하고 수동 변경에 기록합니다.
11. T01부터 T08까지 실행하고 CSV를 저장합니다. T06의 Ready, Won, Lost는 실행했다고 꾸미지 말고 상태 문부터 `return false`, 그리고 true 뒤 `SetActive`까지 코드 경로 증거로 확인합니다.
12. build, 60-90초 영상과 90초 코드 구술을 확인합니다.

## 제출 파일

- Unity project 또는 수업이 지정한 package
- 실행 가능한 build
- `AI_CHANGE_LOG.md`
- `week11_학번_이름_diff.txt`
- `week11_학번_이름_test.csv`
- `week11_학번_이름_play.mp4`

AI 사용량, subscription과 호출 횟수는 평가하지 않습니다. 문제 정의, 범위, 실제 코드 이해, 통합, 회귀 테스트와 투명한 기록을 평가합니다.
