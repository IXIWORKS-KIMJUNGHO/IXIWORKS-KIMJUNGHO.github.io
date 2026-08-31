(() => {
  const navigation = document.querySelector("[data-course-jump]");
  if (!navigation) return;

  const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
  const entries = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      return target ? { id, link, target } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  let currentId = "";
  let holdUntil = 0;

  const setCurrent = (id) => {
    if (currentId === id) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "true");
        if (matchMedia("(max-width: 980px)").matches) {
          entry.link.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  };

  const initialId = location.hash
    ? decodeURIComponent(location.hash.slice(1))
    : entries[0].id;
  setCurrent(
    entries.some((entry) => entry.id === initialId) ? initialId : entries[0].id,
  );

  for (const entry of entries) {
    entry.link.addEventListener("click", () => {
      holdUntil = performance.now() + 700;
      setCurrent(entry.id);
    });
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (observedEntries) => {
      if (performance.now() < holdUntil) return;

      const visible = observedEntries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]?.target.id) setCurrent(visible[0].target.id);
    },
    {
      rootMargin: "-22% 0px -68% 0px",
      threshold: [0, 1],
    },
  );

  for (const entry of entries) observer.observe(entry.target);
})();
