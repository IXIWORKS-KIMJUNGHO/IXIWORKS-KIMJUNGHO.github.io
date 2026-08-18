(() => {
  const navigation = document.querySelector(".week-five-page .toc");
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
