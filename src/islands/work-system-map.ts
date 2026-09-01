export function initWorkSystemMap() {
  const root = document.querySelector<HTMLElement>("[data-work-system-map]");
  if (!root) return;

  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-axis]")];

  function apply(axis: string | null) {
    if (axis) root!.dataset.activeAxis = axis;
    else delete root!.dataset.activeAxis;

    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.axis === axis ? "true" : "false",
      );
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const axis = button.dataset.axis ?? null;
      const next = root!.dataset.activeAxis === axis ? null : axis;
      apply(next);
    });
  }
}
