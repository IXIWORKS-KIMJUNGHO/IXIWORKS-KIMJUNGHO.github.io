# 001 - Teaching 힌트 열기와 닫기를 상태 전환으로 연결하기

- **Status**: DONE
- **Base commit**: 1c5a680
- **Implementation commit**: 18d258e
- **Motion review**: APPROVE (2026-08-01)
- **Severity**: MEDIUM
- **Category**: Missed opportunities
- **Estimated scope**: 작성 소스 4개와 생성 HTML 8개, 약 150-190줄

> **후속 일반화 (2026-08-01)**: 전체 사이트의 disclosure가 같은 상태 기계를 사용하면서 런타임 파일은 `assets/details-motion.js`, 내용 래퍼는 `.details-motion-content`로 이름을 바꿨다. 아래 본문은 최초 Teaching 전용 구현 시점의 기록이다.

## Problem

Teaching의 Game Engine 및 Media Art Programming 실습 문서에는 8개 문서에 걸쳐 39개의 네이티브 `<details>`가 있다. 학생이 막혔을 때 가끔 여는 기능이므로 짧은 상태 전환은 적합하지만, 현재는 내용과 주변 레이아웃이 한 프레임에 나타나거나 사라진다. 상태가 바뀐 사실은 알 수 있어도 힌트가 어느 트리거에서 펼쳐졌는지 보여 주는 연결이 없다.

Game Engine 문서는 이미 `.details-body`를 사용한다.

```html
<!-- teaching/game-engine/week-02-period3.html:1100 - current -->
<details class="hint-details">
<summary>
힌트 1: 도형 배치는 어떻게 하나요? (Place Actors)
</summary>
<div class="details-body">
<ol type="1">
```

Media Art Programming 문서는 별도 내용 래퍼가 없다.

```html
<!-- teaching/media-art-programming/week-10-period3.html:270 - current -->
<details>
<summary>
힌트 (막히면 펼쳐 보세요)
</summary>
<ul>
```

Game Engine의 인라인 스타일은 외형만 바꾸며 전환은 정의하지 않는다.

```css
/* teaching/game-engine/week-02-period3.html:543 - current */
.hint-details {
  margin: 14px 0;
  border: 1px solid #d4d8dd;
  border-radius: 8px;
  background: #f7f8f9;
  overflow: hidden;
}

.hint-details summary {
  cursor: pointer;
  padding: 12px 15px;
  color: #252b31;
  font-weight: 900;
  outline: none;
}

.hint-details[open] summary {
  border-bottom: 1px solid var(--line);
  background: #eef1f4;
}

.details-body {
  padding: 15px 16px 2px;
}
```

공통 Teaching CSS에는 모션 토큰이 없고, 생성기는 현재 공통 스타일시트만 주입한다.

```js
// scripts/refresh-teaching-navigation.mjs:8 - current
const stylesheet = '  <link rel="stylesheet" href="/assets/teaching.css?v=teaching1">';

// scripts/refresh-teaching-navigation.mjs:169 - current
let after = removeGeneratedShell(before);
after = removeLegacyDocumentHeader(after);
after = withBodyClasses(after, ["teaching-document", `course-${course}`]);
after = withSharedStylesheet(after);
```

마지막으로 `assets/accessibility.css:105-117`은 모든 전환을 `0.01ms !important`로 줄인다. 이 계획의 reduced-motion 동작은 위치 이동을 없애되 상태 이해를 돕는 짧은 opacity 전환은 남겨야 하므로, 더 구체적인 컴포넌트 규칙으로 이 전역 규칙을 의도적으로 재정의해야 한다.

## Target

다음 동작 계약을 그대로 구현한다.

1. JavaScript가 실패하거나 비활성화돼도 네이티브 `<details>` 열기와 닫기가 그대로 작동한다.
2. 닫힌 힌트를 열면 내용이 `opacity: 0`, `translateY(-4px)`에서 `opacity: 1`, `translateY(0)`으로 180ms 동안 들어온다.
3. 열린 힌트를 닫으면 같은 내용이 160ms 동안 반대로 나간 다음에만 `open` 속성을 제거한다.
4. 열기와 닫기 도중 다시 누르면 CSS transition이 현재 프레임에서 반대 상태로 retarget한다. keyframes를 사용하지 않는다.
5. summary 오른쪽의 상태 표시는 같은 자리에서 160ms 동안 180도 회전한다.
6. reduced motion에서는 내용의 위치 이동을 제거하고 opacity만 200ms `ease`로 전환한다. 상태 표시 회전은 즉시 바뀐다.
7. Enter와 Space를 통한 summary의 네이티브 키보드 조작은 정확히 한 번 즉시 전환하며 애니메이션하지 않는다. 포커스 표시와 여러 힌트를 동시에 여는 기능을 유지한다.
8. `height`, `max-height`, `grid-template-rows`, `margin`, `padding`, `clip-path`는 애니메이션하지 않는다. 움직이는 속성은 `transform`과 `opacity`뿐이다.

`assets/teaching.css`의 기존 `:root`에 다음 두 토큰을 추가한다. 값은 Animation Audit Playbook의 표준값을 그대로 사용한다.

```css
/* assets/teaching.css - target tokens */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

`assets/teaching.css`의 `/* Overrides for generated document templates. */` 앞에 다음 공통 규칙을 추가한다. 선택자와 값은 바꾸지 않는다.

```css
/* assets/teaching.css - target disclosure motion */
body.teaching-document details[data-details-motion="ready"] > summary {
  position: relative;
  padding-right: 44px;
  list-style: none;
  cursor: pointer;
}

body.teaching-document details[data-details-motion="ready"] > summary::-webkit-details-marker {
  display: none;
}

body.teaching-document details[data-details-motion="ready"] > summary::marker {
  content: "";
}

body.teaching-document details[data-details-motion="ready"] > summary::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 17px;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-50%) rotate(45deg);
  transform-origin: center;
  transition: transform 160ms var(--ease-in-out);
}

body.teaching-document details[data-details-state="open"] > summary::after {
  transform: translateY(-50%) rotate(225deg);
}

body.teaching-document details[data-details-motion="ready"] > .teaching-details-content {
  opacity: 0;
  transform: translateY(-4px);
  transition-property: opacity, transform;
  transition-duration: 160ms;
  transition-timing-function: var(--ease-out);
}

body.teaching-document details[data-details-state="open"] > .teaching-details-content {
  opacity: 1;
  transform: translateY(0);
  transition-duration: 180ms;
}

@media (prefers-reduced-motion: reduce) {
  body.teaching-document details[data-details-motion="ready"] > .teaching-details-content {
    transform: none !important;
    transition: opacity 200ms ease !important;
  }

  body.teaching-document details[data-details-motion="ready"] > summary::after {
    transition: none !important;
  }
}

body.teaching-document details[data-details-motion-instant="true"] > .teaching-details-content,
body.teaching-document details[data-details-motion-instant="true"] > summary::after {
  transition: none !important;
}
```

새 파일 `assets/teaching-details.js`는 아래 상태 기계를 그대로 구현한다. 이 코드는 기존 `.details-body`를 보존하면서 summary 이후의 모든 노드를 하나의 `.teaching-details-content`로 감싼다. 닫기 완료는 opacity의 `transitionend`를 우선 사용하고, 이벤트가 오지 않을 때를 위해 260ms fallback을 둔다.

```js
// assets/teaching-details.js - target
(() => {
  const closeFallbackDuration = 260;
  const detailsElements = document.querySelectorAll(
    "body.teaching-document details",
  );

  for (const details of detailsElements) {
    if (details.dataset.detailsMotion === "ready") continue;

    const summary = details.querySelector(":scope > summary");
    if (!summary) continue;

    let content = details.querySelector(":scope > .teaching-details-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "teaching-details-content";
      while (summary.nextSibling) content.append(summary.nextSibling);
      details.append(content);
    }

    let closeTimer = 0;
    let closeListener = null;

    function setState(state) {
      details.dataset.detailsState = state;
    }

    function cancelPendingClose() {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
      if (closeListener) {
        content.removeEventListener("transitionend", closeListener);
        closeListener = null;
      }
    }

    function toggleDetailsInstantly() {
      cancelPendingClose();
      details.dataset.detailsMotionInstant = "true";

      const shouldOpen =
        details.dataset.detailsState === "closing" || !details.open;
      if (shouldOpen) details.open = true;
      setState(shouldOpen ? "open" : "closed");
      content.getBoundingClientRect();
      if (!shouldOpen) details.open = false;
      details.getBoundingClientRect();

      delete details.dataset.detailsMotionInstant;
    }

    function openDetails() {
      cancelPendingClose();

      if (details.open && details.dataset.detailsState === "closing") {
        setState("open");
        return;
      }

      details.open = true;
      setState("opening");
      content.getBoundingClientRect();
      setState("open");
    }

    function finishClose() {
      if (details.dataset.detailsState !== "closing") return;
      cancelPendingClose();
      details.open = false;
      setState("closed");
    }

    function closeDetails() {
      cancelPendingClose();
      closeListener = (event) => {
        if (event.target === content && event.propertyName === "opacity") {
          finishClose();
        }
      };
      content.addEventListener("transitionend", closeListener);
      setState("closing");
      closeTimer = window.setTimeout(finishClose, closeFallbackDuration);
    }

    setState(details.open ? "open" : "closed");
    details.dataset.detailsMotion = "ready";

    summary.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();

      if (event.detail === 0) {
        toggleDetailsInstantly();
        return;
      }

      if (details.dataset.detailsState === "closing") {
        openDetails();
      } else if (details.open) {
        closeDetails();
      } else {
        openDetails();
      }
    });
  }
})();
```

`scripts/refresh-teaching-navigation.mjs`는 `<details>`가 있는 일반 Teaching 문서에만 이 파일을 한 번 주입해야 한다. 목표 태그는 다음과 같다.

```html
<script src="/assets/teaching-details.js" defer></script>
```

주입 함수는 아래 형태를 그대로 사용한다. 먼저 기존 태그를 제거하고 `<details>` 존재 여부를 다시 확인한 뒤 `</body>` 직전에 태그를 넣는다. 이렇게 해야 `npm run build:teaching`을 두 번 실행해도 두 번째 실행에서 변경 파일이 0개가 된다.

```js
// scripts/refresh-teaching-navigation.mjs - target additions
const detailsMotionScript =
  '  <script src="/assets/teaching-details.js" defer></script>';

function withTeachingDetailsMotion(html) {
  const withoutScript = html.replace(
    /\s*<script\b[^>]*src="\/assets\/teaching-details\.js"[^>]*><\/script>\s*/gi,
    "\n",
  );

  if (!/<details\b/i.test(withoutScript)) return withoutScript;

  return withoutScript.replace(
    /<\/body>/i,
    `${detailsMotionScript}\n</body>`,
  );
}

// refreshDocuments(), immediately after withSharedStylesheet()
after = withTeachingDetailsMotion(after);
```

## Repo conventions to follow

- 이 사이트는 프레임워크나 모션 라이브러리 없이 정적 HTML, 공통 CSS, 작은 Vanilla JavaScript로 동작한다. 새 의존성을 추가하지 않는다.
- 공통 Teaching 토큰은 `assets/teaching.css:33-61`의 `:root`에 둔다.
- 일반 수업 문서는 인라인 원본 스타일 뒤에 `/assets/teaching.css`, `/assets/accessibility.css` 순서로 로드한다. 주입 위치는 `scripts/refresh-teaching-navigation.mjs:77-94`의 `withSharedStylesheet()` 패턴을 따른다.
- 현재 카드 motion exemplar는 `assets/teaching.css:249-289`이며, 구체적인 속성만 transition한다. `transition: all`을 사용하지 않는다.
- 생성 HTML은 직접 반복 편집하지 않는다. `scripts/refresh-teaching-navigation.mjs`를 수정한 뒤 `npm run build:teaching`으로 결과를 갱신한다.
- 회귀 테스트는 Node 내장 test runner를 사용하는 `tests/site-audit.test.mjs`에 추가한다.
- summary의 키보드 동작은 브라우저가 생성하는 `click` 이벤트 하나로 처리한다. 별도 `keydown` 핸들러를 추가해 Enter 또는 Space를 중복 실행시키지 않는다.
- 키보드와 보조기술이 생성하는 `click`은 `event.detail === 0`으로 판별해 최종 스타일을 transition 없이 flush한다. 포인터·터치 경로만 disclosure motion을 사용한다.

## Steps

1. `assets/teaching.css`의 `:root`에 `--ease-out`과 `--ease-in-out`을 정확한 cubic-bezier 값으로 추가한다.
2. 같은 파일의 `/* Overrides for generated document templates. */` 앞에 Target의 disclosure CSS와 키보드 즉시 전환 규칙을 그대로 추가한다. 기존 `.hint-details`, `.details-body`, 색상, border, spacing 규칙은 제거하거나 재작성하지 않는다.
3. 새 파일 `assets/teaching-details.js`를 Target의 상태 기계로 만든다. `event.detail === 0`인 키보드·보조기술 활성화는 temporary instant attribute를 적용한 뒤 최종 스타일을 flush하여 애니메이션 없이 한 번만 전환한다. 외부 라이브러리, keyframes, WAAPI, `requestAnimationFrame`, height 측정 기반 애니메이션을 추가하지 않는다.
4. `scripts/refresh-teaching-navigation.mjs`에 다음을 추가한다.
   - 공통 script 태그 상수.
   - 기존 `/assets/teaching-details.js` 태그를 정규식으로 제거하는 idempotent 함수.
   - `<details\b`가 있을 때만 `</body>` 앞에 한 번 주입하는 조건.
   - `refreshDocuments()`에서 `withSharedStylesheet()` 직후 이 함수를 호출하는 한 줄.
5. `tests/site-audit.test.mjs`에 `teaching details use the shared interruptible motion controller` 테스트를 추가한다. 테스트는 다음을 모두 확인해야 한다.
   - Game Engine과 Media Art Programming의 일반 HTML을 순회한다.
   - `<details>`가 있는 문서에는 `/assets/teaching-details.js`가 정확히 한 번 존재한다.
   - `<details>`가 없는 문서에는 해당 script가 없다.
   - 현재 fixture에서 최소 1개 이상의 details 문서와 details 요소가 발견된다. 숫자 8과 39를 assertion에 하드코딩하지 않는다.
   - `assets/teaching-details.js`에 `transitionend`, `propertyName === "opacity"`, `event.preventDefault()`, `details.open` 상태 제어, `event.detail === 0` 키보드 즉시 전환 경로가 존재한다. 별도 `keydown`은 없다.
   - 공통 CSS에 두 easing 토큰, `transform`과 `opacity` transition, reduced-motion의 `opacity 200ms ease !important`, keyboard instant의 `transition: none !important`가 존재한다.
   - motion CSS에 `transition: all`, `max-height` 또는 `height` transition이 없다.
6. `npm run build:teaching`을 실행해 현재 details가 있는 다음 8개 생성 문서에 script 태그를 반영한다.
   - `teaching/game-engine/week-02-period3.html`
   - `teaching/game-engine/week-03-period3.html`
   - `teaching/game-engine/week-04-period3.html`
   - `teaching/game-engine/week-05-period3.html`
   - `teaching/game-engine/week-10-period1.html`
   - `teaching/media-art-programming/week-06-period3.html`
   - `teaching/media-art-programming/week-07-period3.html`
   - `teaching/media-art-programming/week-10-period3.html`
7. `npm run build:teaching`을 즉시 한 번 더 실행하고 `Refreshed Teaching indexes and 0 document shells.`가 출력되는지 확인한다. 0이 아니면 주입 함수의 공백 처리와 태그 제거 정규식을 수정해 idempotent하게 만든다.

## Boundaries

- `teaching/agentic-ai/day-1.html` 슬라이드 덱과 그 asset runtime은 건드리지 않는다.
- Teaching 허브, 과정 카드, 자료 행, 페이지 전환에 새 애니메이션을 추가하지 않는다.
- 8개 생성 HTML을 손으로 수정하지 않는다. 결과 태그는 generator로만 반영한다.
- 힌트 문구, 순서, HTML 의미, 기존 `.details-body` 스타일을 바꾸지 않는다.
- 한 힌트를 열 때 다른 힌트를 자동으로 닫는 accordion 규칙을 추가하지 않는다.
- `height`, `max-height`, `grid-template-rows`, `margin`, `padding`, `top`, `left`를 애니메이션하지 않는다.
- keyframes, WAAPI, third-party motion dependency를 추가하지 않는다.
- `_workspace/`, `.DS_Store`, `dist/`를 직접 수정하거나 stage하지 않는다.
- 현재 코드가 commit `1c5a680`과 달라서 위 excerpt 또는 8개 문서 목록이 맞지 않으면 임의로 보정하지 말고 중단해 drift를 보고한다.

## Verification

- **Mechanical**:
  1. `npm run build:teaching`을 두 번 실행한다. 두 번째 실행은 `Refreshed Teaching indexes and 0 document shells.`여야 한다.
  2. `npm test`를 실행하고 모든 test가 통과하는지 확인한다.
  3. `npm run build`를 실행하고 Day 1 생성, Teaching 갱신, sitemap 생성, complete static build가 모두 성공하는지 확인한다.
  4. build 뒤 `npm test`를 다시 실행한다.
  5. `rg -l 'teaching-details\.js' teaching/game-engine/*.html teaching/media-art-programming/*.html | wc -l` 결과가 현재 commit 기준 `8`인지 확인한다.
  6. `rg --files dist/client | rg 'assets/teaching-details\.js'`가 `dist/client/assets/teaching-details.js`를 반환하는지 확인한다.
  7. `git diff --check`가 아무 오류도 출력하지 않는지 확인한다.
- **Feel check**: 저장소 루트에서 `python3 -m http.server 4173 --bind 127.0.0.1`로 정적 서버를 열고 다음을 확인한다.
  - `http://127.0.0.1:4173/teaching/game-engine/week-02-period3.html`에서 힌트가 summary 바로 아래에서 4px 내려오며 180ms 안에 정착한다.
  - 같은 힌트를 닫으면 내용이 먼저 160ms 동안 흐려진 뒤 공간이 접힌다. 빈 공간이 260ms 이상 남아 있으면 실패다.
  - 애니메이션 도중 summary를 빠르게 반복 클릭해도 opacity나 화살표가 처음 프레임으로 튀지 않고 현재 위치에서 방향을 바꾼다.
  - `http://127.0.0.1:4173/teaching/media-art-programming/week-10-period3.html`의 bare `<details>`도 같은 방식으로 작동하며, 목록과 코드 블록 구조가 보존된다.
  - 마우스 클릭은 계획된 transition으로, Enter와 Space는 active animation 없이 정확히 한 번씩 열고 닫는다. 포커스 링은 계속 보인다.
  - 여러 힌트를 동시에 열 수 있다.
  - JavaScript를 비활성화하고 새로고침해도 네이티브 details가 즉시 열리고 닫힌다.
  - Chrome DevTools Animations에서 playback을 10%로 낮췄을 때 내용은 opacity와 `translateY`만 바뀌고 높이 애니메이션, scale, blur가 없다.
  - DevTools Rendering에서 `prefers-reduced-motion: reduce`를 켜면 내용 위치는 움직이지 않고 opacity만 200ms 동안 바뀌며, 화살표는 즉시 최종 방향이 된다.
  - 390px 모바일 viewport와 다크 모드에서도 summary 글자와 화살표가 겹치지 않고 가로 overflow가 없다.
- **Done when**: details가 있는 8개 문서의 39개 disclosure가 포인터·터치에서 같은 interruptible transition을 사용하고, 키보드 활성화는 즉시 한 번만 전환되며, 무자바스크립트/reduced-motion fallback이 유지되고, 생성기 재실행이 0-change이며 전체 test와 build가 통과한다.
