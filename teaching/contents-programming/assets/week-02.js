(() => {
  const navigation = document.querySelector(".week-two-page .toc");
  if (!navigation) return;

  const links = Array.from(
    navigation.querySelectorAll('.toc-level-2 a[href^="#"]'),
  );
  const entries = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      return target ? { id, link, target } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  let currentId = "";

  const setCurrent = (id, reveal = false) => {
    if (currentId === id) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "location");
        if (reveal && matchMedia("(max-width: 980px)").matches) {
          entry.link.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  };

  const hashId = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
  const initialEntry = entries.find((entry) => entry.id === hashId) ?? entries[0];
  setCurrent(initialEntry.id);

  for (const entry of entries) {
    entry.link.addEventListener("click", () => setCurrent(entry.id, true));
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (observedEntries) => {
      const visible = observedEntries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]?.target.id) {
        setCurrent(visible[0].target.id, true);
        return;
      }

      const readingLine = innerHeight * 0.26;
      const passed = entries.filter(
        (entry) => entry.target.getBoundingClientRect().top <= readingLine,
      );
      setCurrent((passed.at(-1) ?? entries[0]).id, true);
    },
    {
      rootMargin: "-18% 0px -68% 0px",
      threshold: [0, 1],
    },
  );

  for (const entry of entries) observer.observe(entry.target);
})();

(() => {
  const copyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const checkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

  const writeText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("copy failed");
  };

  for (const pre of document.querySelectorAll(".week-two-page pre")) {
    if (pre.parentElement?.classList.contains("code-copy-wrap")) continue;
    const code = pre.querySelector("code") ?? pre;
    const text = (code.textContent ?? "").replace(/^\n+|\n+$/g, "");
    if (!text) continue;

    const wrap = document.createElement("div");
    wrap.className = "code-copy-wrap";
    pre.replaceWith(wrap);
    wrap.append(pre);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-button";
    button.setAttribute("aria-label", "코드 복사");
    button.setAttribute("title", "복사");
    button.innerHTML = copyIcon;
    wrap.append(button);

    button.addEventListener("click", async () => {
      try {
        await writeText((code.textContent ?? "").replace(/^\n+|\n+$/g, ""));
        button.dataset.copied = "true";
        button.setAttribute("aria-label", "복사됨");
        button.setAttribute("title", "복사됨");
        button.innerHTML = checkIcon;
        window.setTimeout(() => {
          button.dataset.copied = "false";
          button.setAttribute("aria-label", "코드 복사");
          button.setAttribute("title", "복사");
          button.innerHTML = copyIcon;
        }, 1600);
      } catch {
        button.setAttribute("aria-label", "복사에 실패했습니다. 코드를 직접 선택하세요");
        button.setAttribute("title", "직접 선택");
      }
    });
  }
})();
