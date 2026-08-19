# Game Engine I, Week 10 Asset Kit Starter

이 폴더는 10주차 3교시 개인 목표지향 실습의 기록 틀입니다. 생성형 AI 사용 여부와 관계없이 같은 파일을 사용합니다.

## 고정 결과

1. `Player_Walk_4x1.png`: 512×128px, 128×128px 프레임 4개, 투명 배경
2. `Interactables_3x1.png`: 384×128px, Collectible, Hazard, Goal 128×128px 셀 3개, 투명 배경
3. `UI_Panel_512x256.png`: 512×256px, 텍스트를 위한 내부 여백과 보호된 모서리
4. Unity Scene `Week10_AssetIntegration`: Animator, 세 역할, UI와 기존 게임 루프가 작동하는 장면

## 시작 순서

1. 현재 작동하는 Scene을 실행해 baseline 기능과 Console Error 0을 확인합니다.
2. Scene을 `Week10_AssetIntegration`으로 복제합니다.
3. `asset-spec-template.csv`를 복제해 학번, 이름과 세 target file 규격을 채웁니다.
4. 9주차 source 또는 사용이 허락된 기존 asset을 보존하고 작업본을 만듭니다.
5. AI-assisted 또는 manual/offline 경로 중 하나를 선택합니다.
6. 적어도 두 가지 문제를 사람이 직접 수정하고 `AI_ASSET_LOG-template.md`에 전후와 이유를 기록합니다.
7. Unity에서 128 PPU, Sprite Mode Multiple, 128×128 Grid를 적용합니다.
8. 수업 페이지의 T01-T08을 모두 PASS한 뒤 CSV와 45-60초 영상을 저장합니다.

## 평가하지 않는 것

- 생성 횟수
- 유료 도구 사용 여부
- 작업 속도
- AI-assisted 경로와 manual/offline 경로의 차이

## 평가하는 것

- 파일 규격과 역할 가독성
- 프레임, 팔레트, 빛의 일관성
- 사람의 수정 두 가지 이상과 제작 경로
- Unity import, slicing, Animator, UI 연결
- 기존 게임 루프 보존과 필수 테스트 8개

원본을 덮어쓰지 말고 `source`, `edited`, `final`을 구분합니다. 권리를 확인하지 않은 참조 이미지, 개인정보, 비공개 작품은 AI 서비스에 입력하지 않습니다. 이번 실습에서는 Agent가 Scene, Prefab 또는 Script를 직접 수정하게 하지 않습니다.
