# Unity 2D 생성형 AI 활용 방법론과 Game Engine I 커리큘럼 제안

> 조사 기준일: 2026-08-12
>
> 수업 조건: Unity 6.3 LTS, 2D 중심, 비전공자·초보자 혼합, 저사양 실습실, 주 3시간 16주
>
> 고정 일정: 1주차 OT, 8주차 중간고사, 14~15주차 프로젝트 면담, 16주차 기말 프로젝트 제출
>
> 조사 원칙: Unity 공식 문서·공식 블로그·공식 약관과 교육 자료를 중심으로 검토

## 1. 요약 결론

이 수업은 **“AI가 게임을 대신 만드는 수업”이 아니라 “Unity의 기초를 이해한 학생이 AI를 통제하며 작은 2D 게임을 완성하는 수업”**으로 설계하는 것이 타당하다.

권장 구조는 명확하다.

- **2~7주차:** Unity와 C#의 기초를 직접 익히는 구간이다. AI는 설명과 오류 해석을 위한 읽기 전용 보조 도구로 제한한다.
- **8주차:** Agent나 에셋 생성기 없이 기초 구현 능력을 확인하는 작은 2D 게임 중간고사를 진행한다.
- **9~13주차:** 생성형 AI를 기획, 임시 에셋, 코드 계획, 제한적 구현, 디버깅, 테스트에 적용한다.
- **14~15주차:** 개별 면담을 통해 코드 이해, AI 사용 내역, 저작권·출처, 플레이테스트 증거를 확인한다.
- **16주차:** 실행 빌드와 프로젝트, 플레이 영상, AI 활용 기록을 함께 제출한다.

Unity의 현재 도구 구조는 교육적으로도 이 단계와 잘 맞는다. in-Editor AI Assistant는 **Ask → Plan → Agent** 순서로 자율성이 높아지며, Ask는 읽기 전용이고 Agent는 스크립트·씬·프리팹까지 변경할 수 있다. 따라서 기초 수업에서는 도구 사용법보다 **언제 자율성을 높이고, 무엇을 확인한 뒤 변경을 승인할 것인가**를 가르치는 것이 핵심이다. [Unity 공식 Assistant 모드 설명](https://unity.com/blog/unity-ai-assistant-ask-plan-agent-mode-explained)

단, Unity의 AI 도구는 2026년 현재 베타이고 계정·클라우드 연결·크레딧 조건이 있다. 특정 유료 도구의 사용량을 성적 기준으로 삼아서는 안 된다. **AI 활용 방법과 검증 기록은 공통 학습 성과로 두되, 특정 생성기의 결제 여부는 평가에서 분리**해야 한다.

## 2. Unity에서 생성형 AI를 사용하는 현재 방식

### 2.1 in-Editor AI Assistant: Ask, Plan, Agent

Unity의 Assistant는 일반적인 외부 챗봇과 달리 현재 프로젝트의 씬 계층, GameObject와 Component, 설치 패키지, 빌드 설정, Console 메시지를 문맥으로 사용할 수 있다. 현재 공식 설명에서 제공되는 세 모드는 다음과 같다. [Unity 공식 Assistant 소개](https://unity.com/blog/unity-ai-assistant-ask-plan-agent-mode-explained)

| 모드 | 프로젝트 변경 | 공식적 용도 | 수업에서의 위치 |
| --- | --- | --- | --- |
| Ask | 없음. 읽기 전용 | API·Component 설명, Console 오류 진단, 접근 방법 추천, 프로젝트 상태 질의 | 2주차부터 허용 가능한 학습 보조 |
| Plan | 승인 전 변경 없음 | 여러 단계의 기능, 리팩터링, 씬 재구성에 대한 실행 계획 작성 | 9주차 이후 기획·설계 훈련 |
| Agent | 권한 범위 안에서 변경 | C# 작성·수정, Component와 Scene 변경, Prefab·Asset 생성, Editor 동작과 검증 | 11주차 이후 제한적 실습 |

Agent 모드는 읽기 전용, 스크립트 쓰기 전용, 전체 권한처럼 자율성 범위를 조절할 수 있고 작업 내역을 확인할 수 있다. 공식 안내상 변경은 되돌릴 수 있지만, 수업에서는 이를 백업의 대체로 간주하면 안 된다. 학생은 작업 전에 씬을 저장하고 프로젝트 체크포인트를 만든 뒤, **한 번에 하나의 검증 가능한 작업만 Agent에게 허용**해야 한다.

교육적 순서는 다음과 같이 잡는다.

1. Ask로 개념과 오류를 설명하게 한다.
2. 학생이 자신의 말로 문제를 다시 정의한다.
3. Plan으로 예상 변경 파일과 순서를 작성하게 한다.
4. 학생이 계획에서 불필요하거나 위험한 변경을 제거한다.
5. Agent에는 우선 “스크립트 쓰기 전용”처럼 최소 권한을 부여한다.
6. 변경 후 Console, Inspector, Play Mode를 학생이 직접 확인한다.

초보자에게 처음부터 Agent 전체 권한을 주면, 기능은 빠르게 생기지만 GameObject·Component·참조 관계와 C# 흐름을 학습할 기회가 사라진다. 따라서 2~7주차에는 Agent를 사용하지 않고, 9주차 이후에도 **Ask와 Plan을 거치지 않은 Agent 실행은 과제 증거로 인정하지 않는 방식**이 적절하다.

### 2.2 Sprite Generator

2D 수업에서 가장 직접적으로 쓸 수 있는 생성기이다. 텍스트 프롬프트와 참조 이미지를 이용해 캐릭터, 아이콘, 오브젝트, UI용 Sprite를 만들 수 있고, 배경 제거, 업스케일, 픽셀화, 재채색, 인페인팅과 animation-ready spritesheet 생성 기능을 제공한다. 생성 결과는 프로젝트 루트의 `GeneratedAssets`에 저장되고, 에셋으로 지정한 결과에는 검색 가능한 Unity AI 라벨이 붙는다. [Unity 공식 Sprite Generator 안내](https://unity.com/blog/unity-ai-sprite-generator)

그러나 Unity는 이 도구를 명시적으로 **프로토타이핑 단계의 placeholder 제작 도구**로 설명하며, 출시 전에는 사람이 제작한 최종 에셋으로 교체할 것을 안내한다. 따라서 이 수업에서는 다음 용도가 적합하다.

- 레벨 블록아웃 단계의 캐릭터·수집물·장애물 대체 이미지
- 동일한 기능에 대한 서로 다른 아트 방향 비교
- UI 아이콘의 가독성 테스트
- 배경 제거·재채색을 포함한 에셋 정리 실습
- 생성 spritesheet의 프레임 일관성을 검사하고 직접 수정하는 실습

생성 이미지의 화려함이나 생성 횟수를 평가하지 않는다. **게임 안에서 읽히는 크기, 충돌 영역과의 일치, 애니메이션 일관성, 스타일 통일, 사람이 가한 수정**을 평가해야 한다.

### 2.3 Texture2D Generator와 UI 프로토타이핑

Unity의 UI Generator는 독립된 단일 생성기가 아니라 **Sprite Generator + Texture2D Generator + Assistant**를 조합한 워크플로이다. Sprite Generator는 아이콘과 독립된 UI 그래픽에, Texture2D Generator는 패널·배경·backdrop에 사용한다. 생성 결과를 uGUI 또는 UI Toolkit에 배치하고 Assistant로 버튼 이벤트나 레이아웃 연결을 보조할 수 있다. [Unity 공식 UI Generator 워크플로](https://unity.com/blog/unity-ai-ui-generator)

Game Engine I에서는 uGUI를 공통 기반으로 유지하는 것이 좋다. 학생은 먼저 흰색 박스와 기본 Text·Button으로 기능적 UI를 완성한 뒤, 생성 에셋을 교체 적용한다. 이 순서를 지켜야 “UI가 작동하는 것”과 “UI가 보기 좋은 것”을 분리해 학습할 수 있다.

### 2.4 Sound Generator

Sound Generator는 텍스트 설명이나 선택적 참조 사운드를 바탕으로 환경음·효과음을 만들고 `.wav`로 프로젝트에 저장할 수 있다. 길이와 생성 개수를 조절하고, 생성 후 시작·끝 구간과 페이드를 편집할 수 있다. Unity의 현재 초급 공식 튜토리얼은 바람, 새소리, 기계음 같은 환경 효과에 이를 사용한다. [Unity Learn: Sound Generator](https://learn.unity.com/tutorial/use-sound-generator-for-background-audio?version=6.2)

주의할 점은 같은 튜토리얼이 현재 Sound Generator를 멜로디나 구조화된 음악 제작용으로 권하지 않는다는 것이다. 따라서 2D 수업에서는 다음처럼 구분한다.

- AI 생성 허용: 짧은 수집음, 충돌음, UI 클릭음, 환경 효과음
- 별도 라이선스 음원 사용: 배경 음악
- 필수 후처리: trim, fade, volume normalization 확인, 반복 재생 시 이음새 테스트

음악 전공 학생은 직접 작곡·녹음한 음악이나 효과음을 사용할 수 있도록 해야 한다. AI 음원을 많이 생성한 학생보다 **게임 이벤트와 소리를 의미 있게 연결한 학생**을 높게 평가한다.

### 2.5 Animation Generator와 2D 수업의 관계

Unity 공식 초급 AI 교육 자료에서 Animation Generator는 프롬프트로 **Humanoid animation**을 생성하여 3D 캐릭터에 적용하는 도구로 소개된다. [Unity Learn: AI 프로토타입 과정 개요](https://learn.unity.com/course/prototype-a-scene-with-unity-ai/tutorial/set-up-your-project-with-unity-ai?version=6.2)

따라서 2D 중심 Game Engine I의 필수 내용으로 삼기에는 맞지 않는다. 수업에서 필수로 다룰 애니메이션은 다음이어야 한다.

- Sprite import와 slicing
- Animation Clip과 Animator Controller
- idle·move·hit 같은 짧은 프레임 애니메이션
- 상태 전환과 게임 로직 연결

AI Animation Generator는 트렌드 소개에 그치고, 2D에서는 Sprite Generator의 spritesheet 기능을 선택적으로 실험한다. 생성된 프레임이 실제 walk cycle이나 방향별 동작으로 사용할 만큼 일관적인지는 학생이 직접 판정하고 수정해야 한다.

### 2.6 그 밖의 Generators

현재 Unity의 생성기 묶음에는 Texture2D, Material, Terrain Layer, Cubemap, 3D Object, Sound, Animation, Sprite 등이 포함된다. Material·Terrain·Cubemap·3D Object는 3D 환경 프로토타이핑에 더 직접적이므로 이 수업의 필수 범위에서는 제외한다. Unity 역시 Generators를 최종 아트를 대신하는 도구가 아니라 빠른 프로토타이핑용으로 설명한다. [Unity 공식 Material Generator 안내](https://unity.com/blog/unity-ai-material-generator)

## 3. 외부 AI와 Unity를 연결하는 세 가지 방식

### 3.1 공식 MCP Server

Unity MCP Server는 외부의 MCP 호환 AI 클라이언트가 실행 중인 Unity Editor를 구조화된 도구로 제어하게 한다. 공식적으로 제공되는 주요 도구 범위는 다음과 같다.

- Scene과 GameObject의 조회·생성·수정·삭제
- C# 스크립트 읽기·작성·수정
- Console의 로그·경고·오류 읽기
- Component 값 조회·수정
- 플랫폼과 빌드 설정 조회
- 프로젝트용 custom MCP tool 등록

연결에는 Unity 6 이상과 `com.unity.ai.assistant` 패키지가 필요하고, 최초 외부 클라이언트 연결을 Unity에서 승인한다. [Unity 공식 MCP 시작 가이드](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.17/manual/integration/unity-mcp-get-started.html), [Unity 공식 MCP 개요](https://unity.com/blog/unity-ai-mcp-how-to-get-started)

MCP는 초보 학생에게 처음부터 제공할 도구가 아니다. 12주차에 다음과 같은 **검증 가능한 좁은 작업**으로 실습하는 것이 좋다.

- Console 오류를 읽고 원인 후보만 정리하기
- 현재 Scene의 누락된 참조 찾기
- 특정 GameObject의 Component 목록을 읽어 표로 만들기
- 이미 작성한 단순 스크립트의 한 매개변수만 변경하기
- 변경 후 Console을 다시 읽어 오류가 사라졌는지 확인하기

“게임을 만들어줘”처럼 범위가 큰 지시는 금지한다. 교수자가 허용 도구와 금지 동작을 지정하고, 학생은 실행 전 예상 변경점과 실행 후 실제 변경점을 비교해야 한다.

### 3.2 AI Gateway와 BYOM

AI Gateway는 Assistant 창에서 Claude Code, Gemini, Codex 같은 제3자 Agent와 모델을 연결하는 경로이다. 공급자의 API key와 해당 공급자 계정·구독이 필요하며, 모델 선택과 공급자별 명령을 Assistant 안에서 사용할 수 있다. [Unity 공식 AI Gateway 설정](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.17/manual/integration/ai-gateway-get-started.html)

Unity의 제품 FAQ에 따르면 제3자 Agent를 Gateway로 사용할 때 Unity Credits는 소비하지 않지만, 제3자 구독 비용은 별도이다. 현재 패키지 문서는 Gateway·MCP 접근에 해당 Unity 구독과 할당된 seat가 필요하다고 설명한다. 즉, **“Unity Credits가 들지 않는다”와 “아무 계정 조건 없이 무료다”는 같은 의미가 아니다.** 학기 전에 학교 조직의 seat, 학생 계정, API key 보관 방식과 사용 가능 모델을 실제 실습실에서 확인해야 한다. [Unity AI 기능·가격 FAQ](https://unity.com/features/ai)

수업에서는 학생 개인 API key를 프로젝트의 Script, Scene, Prefab에 저장하지 않게 해야 한다. 공유 PC에서는 로그아웃과 자격 증명 삭제 절차도 수업 운영안에 포함한다.

### 3.3 Unity CLI + Pipeline + `eval`

Unity CLI는 생성형 AI 자체가 아니라 Editor 설치·버전·모듈·프로젝트를 명령줄에서 관리하고 자동화하는 **결정론적 도구**이다. 현재 공식 문서는 CLI를 experimental로 표시하며, Editor를 제어하려면 Unity Pipeline 패키지가 필요하다고 설명한다. [Unity CLI 공식 문서](https://docs.unity.com/en-us/unity-cli)

Pipeline 패키지는 로컬 HTTP API를 통해 실행 중인 Editor를 제어하며, `unity pipeline install`, `unity pipeline list`, `unity command`로 연결과 명령을 확인할 수 있다. [Unity Pipeline 패키지 문서](https://docs.unity.com/en-us/unity-production-pipeline/local-tools-cli/unity-pipeline-package)

2026년 6월 공개된 CLI beta에는 다음 흐름이 포함되어 있다.

```bash
unity status
unity pipeline list
unity command
unity eval '<C# expression>'
```

`unity eval`은 Pipeline server에 연결된 Editor에서 C# 표현식을 평가한다. 최신 릴리스 노트상 Unity CLI는 `0.1.0-beta.7` 단계이므로 명령과 문서가 학기 중 바뀔 가능성이 있다. [Unity CLI 릴리스 노트](https://docs.unity.com/en-us/unity-cli/release-notes)

강의에서는 CLI를 다음 두 수준으로 나누는 것이 적절하다.

- **학생 공통:** 버전 확인, 프로젝트 열기, 연결 상태와 Console 확인처럼 되돌릴 수 있는 읽기 작업
- **교수자·선택 심화:** 템플릿 프로젝트 생성, 반복 설정, 테스트·빌드 자동화, Agent가 CLI를 사용하는 워크플로

CLI와 MCP를 함께 보여주는 이유는 “자연어 자동화”와 “결정론적 자동화”의 차이를 가르치기 위해서다. AI가 계획을 세우더라도, 반복 가능한 설치·상태 조회·빌드는 가능한 한 CLI 명령으로 고정하는 편이 검증하기 쉽다.

## 4. Sentis·AI Inference는 무엇이 다른가

Sentis, 현재 패키지명 `com.unity.ai.inference`, 는 이미 학습된 신경망 모델을 import하여 Editor나 최종 게임 안에서 로컬로 실행하는 런타임 추론 라이브러리이다. 자연어로 프로젝트를 제작하는 Assistant나 에셋 Generator와는 목적이 다르다. 용도는 객체 인식, 자연어 처리, 게임 상대, 센서 분류 등이며, 모델 실행과 최적화를 직접 구현해야 한다. [Unity AI Inference/Sentis 매뉴얼](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.ai.inference.html)

Unity의 원칙에 따르면 Sentis의 추론은 로컬 compute에서 수행되고 모델 데이터가 클라우드로 전송되지 않는다. 다만 모델 자체는 Unity가 제공하는 것이 아니라 사용자가 준비해야 한다. [Unity AI Guiding Principles](https://unity.com/legal/unityai-guiding-principles)

따라서 이 수업에서는 다음과 같이 처리한다.

- 필수 커리큘럼: 제외
- 이론 소개: “제작 단계 AI”와 “게임 실행 중 AI”의 차이
- 선택 심화: 준비된 작은 모델을 실행하는 교수자 시연
- 금지 범위: 전 학생에게 런타임 LLM NPC나 모델 학습을 기말 필수 기능으로 요구

저사양 PC와 비전공자 구성에서는 Sentis가 C#·Tensor·모델 최적화라는 별도의 학습 부담을 만들기 때문이다.

## 5. 데이터, 권리, 추적성과 수업 정책

### 5.1 공식 정책에서 확인되는 내용

Unity는 사용자가 AI 도구에 입력한 데이터와 출력 데이터를 소유하며, 사용자의 콘텐츠로 Unity AI를 개선하는 설정은 기본적으로 꺼져 있다고 설명한다. 그러나 Generator를 사용할 때에는 prompt와 참조 에셋을 포함한 익명화된 Developer Data가 생성 처리를 위해 제3자 모델 공급자에게 전송될 수 있다. 공급자는 생성 후 데이터를 삭제하지만 디버깅 같은 운영 목적의 일시 보관 가능성이 있다. [Unity AI Guiding Principles](https://unity.com/legal/unityai-guiding-principles)

Unity가 생성한 코드·이미지·사운드 등에는 `UnityAI` metadata가 삽입되어 검색과 감사가 가능하다. 하지만 metadata가 권리 보증을 의미하지는 않는다. 최종 빌드에 사용할 권리를 확인하고 타인의 권리를 침해하지 않을 책임은 개발자에게 있다. Generator 공급자와 모델, 적용 약관은 바뀔 수 있으므로 프로젝트 제출 시점에 다시 확인해야 한다. [Unity Third-Party AI Terms](https://unity.com/legal/third-party-ai-terms)

Unity Asset Store에서 받은 에셋을 제3자 AI 시스템에 업로드하거나 AI/ML 모델 학습에 사용할 수 없다는 공식 제한도 있다. AI로 제작된 에셋을 Asset Store에 판매하려면 도구와 AI 생성 부분, 사람이 추가한 가치를 공개해야 한다. [Unity AI Hub FAQ](https://marketplace.unity.com/ai-hub), [Asset Store Submission Guidelines](https://marketplace.unity.com/publishing/submission-guidelines)

2026년 6월 Unity 약관은 AI Agent, LLM, MCP client/server가 Unity가 운영하거나 지정한 framework를 통해 접근해야 하며, 계정 소유자가 Agent의 행위에 책임진다는 점을 명시한다. 따라서 수업에서는 Unity 공식 MCP 또는 Unity가 허용한 경로를 사용하고, 학생 개인 계정의 자동화 권한을 다른 학생과 공유하지 않는다. [Unity Terms of Service](https://unity.com/legal/terms-of-service)

### 5.2 학생용 AI 사용 규칙

1. 개인정보, 학생 명단, 평가 자료, 공개되지 않은 타인의 작업을 prompt나 reference로 업로드하지 않는다.
2. 직접 권리를 가진 이미지·사운드 또는 명시적으로 AI 입력이 허용된 자료만 reference로 사용한다.
3. 특정 생존 작가나 특정 게임의 스타일 복제를 요구하는 prompt는 사용하지 않는다.
4. Asset Store 에셋을 외부 생성 AI에 업로드하지 않는다.
5. API key와 access token을 Script, Scene, Prefab, Git 저장소에 넣지 않는다.
6. Agent 실행 전 변경 범위와 되돌리기 지점을 만든다.
7. AI가 만든 코드는 줄 단위 암기보다 데이터 흐름, Component 참조, 실행 시점을 설명할 수 있어야 한다.
8. 제출물에는 AI 사용 기록과 생성 에셋 목록을 포함한다.
9. 사용하지 않은 경우에도 “AI 미사용”을 명시하여 동일한 형식으로 제출한다.

### 5.3 최소 AI 활용 기록 양식

| 항목 | 기록 내용 |
| --- | --- |
| 날짜·주차 | 언제 어떤 과정을 위해 사용했는가 |
| 도구·모델 | Unity Assistant/Generator/외부 Agent와 선택 모델 |
| 목적 | 아이디어, 설명, 에셋, 코드, 오류, 테스트 중 무엇인가 |
| 입력 | 핵심 prompt와 제공한 reference |
| 권리 | reference와 기존 에셋의 출처·라이선스 |
| 출력 | 생성된 파일 또는 변경된 Scene·Script |
| 학생의 판단 | 무엇을 채택·거절했고 그 이유는 무엇인가 |
| 수정 | 학생이 직접 변경한 코드·그래픽·사운드 |
| 검증 | Console, Play Mode, 빌드, 플레이테스트 결과 |
| 상태 | placeholder 유지, 교체 완료, 삭제 중 하나 |

## 6. 권장 생성형 AI 활용 방법론

이 수업에는 다음의 **기초 → 질문 → 계획 → 제한 실행 → 검증 → 기록** 순환 방법론을 적용한다.

### 1단계: 기초를 사람이 먼저 만든다

학생이 먼저 최소 기능을 직접 구현한다. 예를 들어 플레이어 이동을 AI에 맡기기 전에 Transform, Rigidbody2D, Input System, `Update`와 `FixedUpdate`의 역할을 배운다. 작동하는 baseline이 있어야 AI가 만든 변경의 효과를 비교할 수 있다.

### 2단계: 작업을 한 문장으로 제한한다

“게임을 만들어줘”가 아니라 “플레이어가 Coin Trigger와 접촉하면 점수가 1 증가하고 Coin이 비활성화되게 한다”처럼 입력, 조건, 결과가 보이는 작업으로 바꾼다.

### 3단계: Ask로 이해한다

구현 요청 전에 필요한 Component, 예상되는 이벤트 함수, 오류 가능성을 물어본다. 학생은 답을 그대로 복사하지 않고 자신의 말로 3줄 요약을 작성한다.

### 4단계: Plan으로 변경을 예측한다

수정할 Script·GameObject·Component, 작업 순서, 검증 방법을 Plan에 포함시킨다. 계획에 새로운 패키지 설치, 전역 구조 변경, 불필요한 파일 수정이 있으면 제거한다.

### 5단계: 최소 권한으로 실행한다

처음에는 학생이 직접 구현하고, Agent를 사용할 때에도 script-only 권한과 하나의 작업 범위를 우선한다. Scene이나 Prefab 변경은 예상 목록을 만든 뒤 허용한다.

### 6단계: 결과를 세 종류로 검증한다

- 정적 검증: Console error가 없는가, Inspector 참조가 연결되었는가
- 동작 검증: Play Mode에서 정상·실패·경계 조건이 작동하는가
- 이해 검증: 학생이 코드 흐름과 AI의 변경 이유를 설명하고 한 변수를 직접 수정할 수 있는가

### 7단계: 기록하고 교체한다

Prompt, 결과, 선택 근거, 수정, 테스트를 기록한다. 생성 에셋은 placeholder인지 최종 사용인지 표시하고, 저작권이나 일관성이 불명확한 것은 교체한다.

권장 prompt 구조는 다음과 같다.

```text
[목표] 어떤 동작을 만들 것인가
[현재 상태] 관련 GameObject, Component, Script는 무엇인가
[제약] Unity 6.3 LTS, 2D, 새 패키지 설치 금지 등
[변경 금지] 건드리면 안 되는 Scene, Script, 설정
[완료 조건] Play Mode에서 관찰할 수 있는 성공 기준
[응답 방식] 먼저 계획과 예상 변경 파일을 보여주고 승인 전 수정하지 말 것
```

이 방법은 프롬프트 작성법 자체보다 **명세 작성, 변경 통제, 테스트, 출처 관리**를 학습하게 한다는 점에서 교육적으로 방어 가능하다.

## 7. 16주차 권장 커리큘럼

매주 3시간은 원칙적으로 **이론 1시간 + 실습 2시간**으로 운영한다. 2~7주차 실습은 교수자 따라 하기에서 개인 변형으로 이어지고, 9~13주차 실습은 제작 스튜디오와 기록 작성으로 전환한다.

| 주차 | 이론 1시간 | 실습 2시간 | 제출·확인 | AI 사용 수준 |
| --- | --- | --- | --- | --- |
| 1 | OT: Game Engine I의 범위, Unity 2D 제작 흐름, 생성형 AI 정책, 평가와 저작권 | Unity 6.3 LTS·공통 패키지 확인, 2D 프로젝트 실행, Scene 저장과 Play Mode 체험 | 환경 점검표와 AI 사용 동의·정책 확인 | 교수자 시연만 |
| 2 | Scene, GameObject, Component, Transform, Prefab의 관계 | Sprite 배치, Sorting Layer, 기본 Scene 구성, Prefab 만들기 | 5개 이상의 Object로 구성한 상호작용 전 Scene | Ask는 용어 설명만 허용 |
| 3 | C# 변수·자료형·조건문·함수, MonoBehaviour 생명주기, Inspector 직렬화 | 간단한 이동·회전·시간 기반 변화 Script 작성, 공개 변수 조절 | 직접 작성한 Script와 코드 설명 5문장 | Ask는 코드 설명만 허용 |
| 4 | Input System, frame과 physics step, Rigidbody2D·Collider2D | 4방향 플레이어 이동, 충돌과 속도 조절, 입력값 시각화 | 플레이어 Controller와 테스트표 | 오류 해석용 Ask 허용 |
| 5 | Collision·Trigger·Layer, Prefab 재사용, Tilemap 기초 | 수집물·장애물·목표 지점과 작은 Tilemap 레벨 제작 | 수집 또는 회피가 가능한 1분 prototype | Agent·Generator 금지 |
| 6 | Sprite import·slicing, Animation Clip·Animator, Cinemachine 2D 카메라 | idle·move 애니메이션, 카메라 follow와 화면 경계 구성 | 애니메이션과 카메라가 적용된 build | Ask만 허용 |
| 7 | UI, AudioSource, 게임 상태, 성공·실패·재시작, build 구조 | 점수·시간 HUD, 효과음, 시작·종료·재시작을 결합하고 중간고사 사전 점검 | Midterm preflight build | Ask·공식 문서 허용 |
| 8 | 중간고사 안내와 기초 개념 확인 | 지정 조건의 작은 2D 게임 완성 및 2분 코드·구조 설명 | 실행 build, project, 핵심 Script | Agent·Generator 금지; 문서 참조만 허용 |
| 9 | 제작 단계 AI와 runtime AI의 차이, Ask·Plan·Agent, 권리·privacy·provenance | 한 문장 게임 콘셉트, 핵심 loop, 제약, acceptance criteria 작성; AI 기록 시작 | 1쪽 기획서, AI 사용 계획, 에셋 권리 목록 | Ask·Plan 도입 |
| 10 | Sprite·Texture·UI·Sound Generator의 prototype 역할과 한계, prompt와 reference 설계 | placeholder Sprite·UI·SFX 생성 또는 비AI 대체 제작, uGUI에 통합, 스타일 비교 | art/audio prototype kit와 생성·수정 기록 | Generator 집중 실습 |
| 11 | AI-assisted coding: 문제 분해, 권한, hallucination, diff와 검증 | Ask → Plan → script-only Agent 순으로 핵심 mechanic 하나 구현·수정; 코드 구술 확인 | 변경 전후 증거, 계획, 테스트 결과 | 제한적 Agent 허용 |
| 12 | MCP, AI Gateway, Unity CLI·Pipeline의 차이와 보안; 결정론적 자동화 | Console·Scene 읽기, 작은 MCP 명령, `unity status`·`pipeline list`·`command` 시연 또는 실습 | 자동화 로그와 수동 검증표 | MCP/CLI는 통제된 범위 |
| 13 | AI-assisted QA, 플레이테스트 질문, 범위 축소, 2D 최적화와 build | 3인 플레이테스트, 오류·난이도·가독성 수정, alpha build와 최종 작업 목록 확정 | Alpha build, 3개 테스트 기록, 최종 계획 | AI는 분석·수정 후보 보조 |
| 14 | 프로젝트 면담 I: 기술 구조·핵심 mechanic·AI 사용 내역 점검 | 1:1 면담과 핵심 Script 설명, blocking issue 해결 | 면담 체크포인트, 수정 목록 | 학생이 AI 결과를 직접 설명 |
| 15 | 프로젝트 면담 II: UX·시청각 일관성·권리·build 점검 | Release candidate 플레이, 생성 에셋 검색·분류, 최종 오류 수정 | Release candidate와 provenance 초안 | 새 기능 생성 중단, 검증 중심 |
| 16 | 기말 프로젝트 제출 기준과 자기평가 | 최종 제출, 짧은 상영·플레이, 회고 | 실행 build, Unity project, 1~2분 영상, 제작 기록, AI 내역 | 사용량이 아니라 판단·검증 평가 |

### 중간고사 권장 조건

중간고사는 “AI를 얼마나 잘 쓰는가”가 아니라 “AI가 만든 것을 이후에 판단할 최소 Unity 지식이 있는가”를 확인한다.

- 4방향 이동 또는 한 축 이동
- Rigidbody2D·Collider2D 기반 충돌
- Trigger 기반 수집물 또는 목표
- Prefab 한 종류 이상
- 점수·시간·상태 중 하나의 UI
- 성공 또는 실패와 재시작
- 실행 build
- 핵심 Script의 입력 → 조건 → 결과를 2분 안에 설명

Agent와 Generator는 금지하고 공식 문서와 수업 노트는 허용하는 open-resource 방식이 적절하다. Ask를 허용한다면 읽기 전용 오류 설명까지만 허용하고 사용 기록을 제출하게 한다.

### 기말 프로젝트 권장 범위

기말은 3~5분 안에 한 판이 끝나는 작은 2D vertical slice로 제한한다.

- 하나의 핵심 행동과 명확한 목표
- 한 개의 작은 맵 또는 제한된 수의 짧은 Scene
- 시작·플레이·성공/실패·재시작의 완결된 상태
- 한 종류 이상의 상호작용 피드백
- UI와 효과음
- 3회 이상의 외부 플레이테스트와 수정 증거
- AI 생성·보조 부분과 학생 수정 부분의 구분

## 8. 평가 방법 제안

### 중간고사 100점 예시

| 항목 | 배점 |
| --- | ---: |
| 입력·이동·물리·충돌의 정확성 | 30 |
| Prefab·Scene·Component 구성 | 15 |
| UI·게임 상태·재시작 | 20 |
| 코드 이해와 구술 설명 | 20 |
| 프로젝트 정리와 실행 build | 15 |

### 기말 프로젝트 100점 예시

| 항목 | 배점 |
| --- | ---: |
| 핵심 mechanic과 기술 통합 | 30 |
| 플레이 가능성과 상태 흐름 | 20 |
| 플레이테스트와 반복 수정 증거 | 15 |
| AI 사용의 투명성·선택 근거·권리 확인 | 15 |
| 시각·UI·사운드의 일관성 | 10 |
| build·project·영상·문서 완결성 | 10 |

AI를 많이 사용한 것 자체에는 점수를 주지 않는다. AI를 사용하지 않은 학생도 동일한 기능, 반복 수정, 출처 기록을 제시하면 같은 점수를 받을 수 있어야 한다. 반대로 AI로 완성된 결과가 화려해도 학생이 코드와 Scene 구조를 설명하지 못하면 기술 통합과 이해 점수를 받을 수 없다.

## 9. 계정·가격·베타 상태가 커리큘럼에 주는 제약

Unity의 AI 도구는 Unity 6.0 이상, Assistant 패키지 설치, 약관 동의, Unity Cloud project 연결을 요구한다. Personal Edition은 1회성 14일 무료 체험에 1,000 credits가 제공되고 이후에는 월 10달러에 1,000 credits 구독이 안내되어 있다. Pro·Enterprise·Industry에는 seat별 기능과 할당량이 포함된다. [Unity AI 기능·가격 FAQ](https://unity.com/features/ai)

Credit 소비량은 mode, prompt 복잡도, project context, 대화 길이와 선택 모델에 따라 크게 달라지고 Unity가 비율을 변경할 수 있다. 잔액이 소진되면 기능이 다음 주기 또는 추가 구매 전까지 중단되며 미사용 credit은 이월되지 않는다. [Unity Credits 공식 설명](https://docs.unity.com/en-us/ai/credits/credits-about), [AI Credits Beta Terms](https://unity.com/legal/unity-ai-credits-terms)

따라서 운영은 다음 중 하나로 결정해야 한다.

### 학교가 조직 seat와 credits를 제공하는 경우

- 9주차 전에 모든 계정과 조직 할당을 확인한다.
- 10~11주차를 Generator·Assistant 집중 sprint로 지정한다.
- 학생별 credit 상한과 필수 생성 횟수를 작게 고정한다.
- Dashboard에서 사용량을 확인하되 소비량 자체는 성적에 반영하지 않는다.

### 학교가 제공하지 않는 경우

- Unity AI는 교수자 시연과 짧은 체험으로 운영한다.
- 학생은 승인된 외부 Assistant, 제공된 placeholder pack, 직접 제작 중 하나를 선택한다.
- 생성형 AI 학습 성과는 “prompt 횟수”가 아니라 문제 정의·비교·검증·기록으로 평가한다.
- 특정 학생이 개인 구독을 구매해야만 완수할 수 있는 과제는 내지 않는다.

14일 체험을 9~13주차 전체의 기반으로 삼을 수 없으므로, 체험을 쓴다면 **9주차 말에 시작해 10~11주차의 집중 실습에 사용**하는 편이 현실적이다.

## 10. 저사양 실습실 운영안

- Unity Editor는 **Unity 6.3 LTS의 정확히 같은 patch**로 고정하고 학기 중 업그레이드하지 않는다.
- Assistant, Generator, MCP, CLI·Pipeline 패키지 버전도 교수자 검증 후 고정한다.
- 공통 프로젝트는 작은 URP 2D 프로젝트 하나로 유지한다.
- 생성 Sprite는 원칙적으로 512px, 큰 배경만 1024px 정도로 제한한다.
- animation frame 수, Audio 길이, 동시에 생성할 variation 수에 상한을 둔다.
- 고해상도 업스케일, 3D Object·Material·Cubemap 생성은 필수 실습에서 제외한다.
- 외부 Agent, 브라우저, Unity Editor를 동시에 여러 개 실행하지 않는다.
- AI 서비스 장애용으로 공통 Sprite·UI·SFX placeholder pack과 비AI 과제를 준비한다.
- MCP·Agent 실습 전 Scene 저장과 project checkpoint를 만든다.
- Sentis runtime inference는 공통 프로젝트에 설치하지 않는다.

AI 생성 자체가 가능하더라도 대용량 결과가 프로젝트 import와 memory 사용을 늘릴 수 있다. 저사양 환경에서는 **더 많이 생성하는 것보다 적은 결과를 비교하고 작게 통합하는 방식**이 수업 목적과도 맞다.

## 11. 학기 시작 전 교수자 점검 목록

- [ ] Unity 6.3 LTS 정확한 patch와 설치 모듈 확정
- [ ] Input System, Cinemachine, 2D Animation, URP 패키지 버전 고정
- [ ] `com.unity.ai.assistant`의 검증된 beta/pre-release 버전 기록
- [ ] 학교 Unity Organization과 학생 seat 정책 확인
- [ ] Cloud project 연결 권한 확인
- [ ] Personal trial·credits와 결제 요구 여부 확인
- [ ] AI Gateway와 MCP가 실제 실습실 계정에서 연결되는지 확인
- [ ] Unity CLI와 Pipeline이 Windows/macOS 실습 환경에서 동작하는지 확인
- [ ] 외부 Agent API key 저장·삭제 방식 확인
- [ ] “Improve Unity AI” 설정을 기본 OFF로 유지할지 학교 정책 확정
- [ ] AI 입력 금지 자료와 Asset Store 에셋 정책 안내문 준비
- [ ] placeholder 대체 자료와 네트워크 장애용 실습 준비
- [ ] 중간고사에서 허용할 AI 범위 명문화
- [ ] 기말 AI 사용 기록 양식과 구술 확인 항목 공개
- [ ] 학기 말 Third-Party AI Terms와 배포 플랫폼 정책 재확인

## 12. 최종 제안

Game Engine I의 중심 문장은 다음이 적합하다.

> **Unity 2D의 기본 구조를 배우고, 생성형 AI를 기획·프로토타이핑·디버깅·검증에 통제적으로 활용하여 작은 게임을 완성한다.**

기초 구간에서는 학생이 직접 Component와 Script를 연결하고, 응용 구간에서는 Ask → Plan → 제한된 Agent/MCP 실행 → Play Mode 검증 → 기록의 순서를 반복한다. Sprite·Texture·Sound 생성은 빠른 placeholder 제작에 활용하되, 결과의 양보다 선택과 수정, 게임 안에서의 기능적 통합을 평가한다. CLI는 AI와 별개인 반복 가능한 자동화 축으로 사용하고, Sentis는 runtime AI라는 별도 영역으로 구분한다.

이렇게 구성하면 비전공 학생도 자신의 시각·음악·서사 강점을 살릴 수 있고, 프로그래밍 경험이 적더라도 AI 결과를 무비판적으로 복사하지 않고 Unity의 구조를 이해하면서 사용할 수 있다.

## 주요 공식 출처

- [Unity의 AI 도구 시작 안내](https://unity.com/blog/unity-ai-how-to-get-started)
- [in-Editor Assistant의 Ask·Plan·Agent](https://unity.com/blog/unity-ai-assistant-ask-plan-agent-mode-explained)
- [Unity AI 기능·접근·가격 FAQ](https://unity.com/features/ai)
- [Sprite Generator](https://unity.com/blog/unity-ai-sprite-generator)
- [UI Generator workflow](https://unity.com/blog/unity-ai-ui-generator)
- [Sound Generator 교육 자료](https://learn.unity.com/tutorial/use-sound-generator-for-background-audio?version=6.2)
- [Unity AI 초급 prototype 과정](https://learn.unity.com/course/prototype-a-scene-with-unity-ai/tutorial/set-up-your-project-with-unity-ai?version=6.2)
- [Unity MCP Server 설정](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.17/manual/integration/unity-mcp-get-started.html)
- [AI Gateway 설정](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.17/manual/integration/ai-gateway-get-started.html)
- [Unity CLI](https://docs.unity.com/en-us/unity-cli)
- [Unity CLI release notes](https://docs.unity.com/en-us/unity-cli/release-notes)
- [Unity Pipeline package](https://docs.unity.com/en-us/unity-production-pipeline/local-tools-cli/unity-pipeline-package)
- [AI Inference/Sentis](https://docs.unity3d.com/6000.0/Documentation/Manual/com.unity.ai.inference.html)
- [Unity AI Guiding Principles](https://unity.com/legal/unityai-guiding-principles)
- [Unity Third-Party AI Terms](https://unity.com/legal/third-party-ai-terms)
- [Unity AI Hub FAQ](https://marketplace.unity.com/ai-hub)
- [Unity Asset Store Submission Guidelines](https://marketplace.unity.com/publishing/submission-guidelines)
- [Unity Terms of Service](https://unity.com/legal/terms-of-service)
- [Unity Credits](https://docs.unity.com/en-us/ai/credits/credits-about)
