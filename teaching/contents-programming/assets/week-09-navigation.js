(() => {
  const toc = document.querySelector(".week-09 .lesson-toc");
  if (!toc) return;

  const mobileToc = window.matchMedia("(max-width: 980px)");
  const links = [...toc.querySelectorAll('.toc-links a[href^="#"]')];
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { id, link, section } : null;
    })
    .filter(Boolean);

  function setTocState(open) {
    toc.open = open;
    if (toc.dataset.detailsMotion === "ready") {
      toc.dataset.detailsState = open ? "open" : "closed";
    }
  }

  function syncTocToViewport(event) {
    setTocState(!event.matches);
  }

  function setCurrentSection(id) {
    for (const item of sections) {
      if (item.id === id) {
        item.link.setAttribute("aria-current", "location");
      } else {
        item.link.removeAttribute("aria-current");
      }
    }
  }

  syncTocToViewport(mobileToc);
  mobileToc.addEventListener("change", syncTocToViewport);

  const initialId = window.location.hash.slice(1);
  setCurrentSection(
    sections.some((item) => item.id === initialId)
      ? initialId
      : sections[0]?.id,
  );

  for (const item of sections) {
    item.link.addEventListener("click", () => {
      setCurrentSection(item.id);
      if (mobileToc.matches) setTocState(false);
    });
  }

  window.addEventListener("hashchange", () => {
    const id = window.location.hash.slice(1);
    if (sections.some((item) => item.id === id)) setCurrentSection(id);
  });

  if (!("IntersectionObserver" in window)) return;

  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.boundingClientRect.top);
        } else {
          visibleSections.delete(entry.target.id);
        }
      }

      const current = [...visibleSections.entries()].sort(
        ([, firstTop], [, secondTop]) => Math.abs(firstTop) - Math.abs(secondTop),
      )[0];
      if (current) setCurrentSection(current[0]);
    },
    {
      rootMargin: "-86px 0px -65% 0px",
      threshold: [0, 1],
    },
  );

  for (const item of sections) observer.observe(item.section);
})();
