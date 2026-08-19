# Game Engine I · Week 12 Automation Readiness Starter

이 묶음은 Unity MCP, Unity CLI와 수동 Unity 관찰을 같은 검증 기준으로 연습하기 위한 수업 자료입니다. 새로운 기능을 만드는 starter project가 아닙니다. 교수자가 제공한 `Week12_AutomationLab` 복제본과 함께 사용하세요.

## 고정 목표

1. 자동화 도구를 열기 전에 active Scene, `Player`, `AutomationProbe`, Transform과 Console count를 수동으로 기록합니다.
2. Console error·warning과 `Player`의 Component 목록을 읽고 실제 Unity 화면과 대조합니다.
3. 권한 계약을 쓴 뒤 `AutomationProbe.Transform.Position.x`만 `0 → 1`로 한 번 바꿉니다.
4. 실제 차이가 X 하나뿐인지 확인하고 `1 → 0`으로 복구합니다.
5. final project가 baseline과 같고 새 Console Error가 없음을 확인합니다.
6. report, automation log, evidence video와 T01–T08 CSV를 제출합니다.

## 경로 선택

- Route A · Connected: MCP read·단일 write와 Unity CLI status를 사용합니다.
- Route B · Partial: Unity CLI와 수동 Console·Inspector를 사용합니다.
- Route C · Offline: `fixtures/`의 교육용 sample을 판독하고 실제 Unity에서는 수동으로 같은 상태를 검사합니다.

연결이 5분 안에 해결되지 않으면 다음 경로로 전환하고 시각과 이유를 automation log에 한 줄 남기세요. 개인 계정 생성, 결제, API key 발급과 package 재설치는 완료 조건이 아닙니다.

## 포함 파일

- `AUTOMATION_CONTRACT-template.md` · 실행 전 대상, 권한, 예상 차이와 복구 계약
- `automation-report-template.md` · baseline, read 대조와 before·after·rollback 보고서
- `automation-log-template.md` · MCP prompt·tool, CLI command·exit 또는 수동 행동의 시간순 기록
- `automation-verification-template.csv` · T01–T08 판정 기록의 오프라인 사본
- `fixtures/unity-status-fixture.json` · 연결된 Editor status 판독 sample
- `fixtures/pipeline-list-fixture.json` · Pipeline target 판독 sample
- `fixtures/mcp-console-fixture.json` · Console read 결과 판독 sample
- `fixtures/mcp-player-components-fixture.json` · Player path·Component 판독 sample

## fixture 주의

`fixtures/`의 파일은 실제 Unity CLI 또는 MCP 출력이 아닙니다. 구조화된 출력에서 command, success, target, errors와 warnings를 찾는 연습을 위해 단순화한 교육용 sample입니다. 자신의 환경 출력처럼 제출하지 말고 report의 Route를 `C / Offline fixture`로 표시하세요. 실제 설치의 field와 option은 `unity --help`, 각 subcommand의 `--help`와 Unity 공식 문서를 우선합니다.

## 보안

API key, access token, credential file, password, 전체 account email과 불필요한 개인 경로를 project, Markdown, CSV, screenshot 또는 video에 넣지 마세요. 노출이 의심되면 파일을 제출하지 말고 key를 폐기·재발급한 뒤 담당자에게 알리세요.

## 제출 파일명

- `Week12_학번_이름/`
- `week12_학번_이름_report.md`
- `week12_학번_이름_automation-log.md`
- `week12_학번_이름_evidence.mp4`
- `week12_학번_이름_test.csv`
