// assets/js/roles.js
(function () {
  const list = document.querySelector(".roles-list");
  if (!list) return;

  const entries = Array.from(document.querySelectorAll(".role-entry"));
  const emptyMsg = document.querySelector(".roles-empty");
  const itemsSection = document.querySelector(".roles-items");
  const searchInput = document.querySelector(".roles-search");
  const teamButtons = Array.from(document.querySelectorAll("[data-filter-team]"));
  const nightButton = document.querySelector("[data-filter-night]");

  const state = { team: "all", night: false, q: "" };

  // ---- Filters ----
  function applyFilters() {
    let visibleMain = 0;
    let visibleItems = 0;

    for (const entry of entries) {
      const okTeam = state.team === "all" || entry.dataset.team === state.team;
      const okNight = !state.night || entry.dataset.night === "yes";
      const okQ = !state.q || entry.dataset.name.includes(state.q);
      const show = okTeam && okNight && okQ;
      entry.classList.toggle("is-hidden", !show);
      if (show) {
        if (entry.dataset.team === "items") {
          visibleItems++;
        } else {
          visibleMain++;
        }
      }
    }

    if (emptyMsg) emptyMsg.hidden = visibleMain + visibleItems !== 0;
    if (itemsSection) itemsSection.hidden = visibleItems === 0;
  }

  teamButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.team = btn.dataset.filterTeam;
      teamButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      applyFilters();
    });
  });

  if (nightButton) {
    nightButton.addEventListener("click", () => {
      state.night = !state.night;
      nightButton.setAttribute("aria-pressed", String(state.night));
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.q = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // ---- Deep-link / cross-link robustness ----
  // If the target id is filtered out, reset filters so it becomes visible, then scroll.
  function navigateToId(id) {
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;

    // If the target or an ancestor entry is hidden, reset filters first
    const entry = target.closest(".role-entry") || (target.classList.contains("role-entry") ? target : null);
    if (entry && entry.classList.contains("is-hidden")) {
      // Reset all filters
      state.team = "all";
      state.night = false;
      state.q = "";
      teamButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.filterTeam === "all"));
      if (nightButton) nightButton.setAttribute("aria-pressed", "false");
      if (searchInput) searchInput.value = "";
      applyFilters();
    }

    target.scrollIntoView({ block: "start", behavior: "smooth" });
    return true;
  }

  // Intercept in-page anchor clicks
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href").slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    // Let default hash navigation happen, but ensure target is visible
    const entry = target.closest(".role-entry") || (target.classList.contains("role-entry") ? target : null);
    if (entry && entry.classList.contains("is-hidden")) {
      e.preventDefault();
      history.pushState(null, "", "#" + id);
      navigateToId(id);
    }
    // else: native scroll handles it fine
  });

  // On load, handle initial hash
  function syncFromHash() {
    const id = location.hash.slice(1);
    if (!id) return;
    navigateToId(id);
  }

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    navigateToId(id);
  });

  applyFilters();
  // Defer hash scroll until after layout paint
  if (location.hash) {
    requestAnimationFrame(() => requestAnimationFrame(syncFromHash));
  }
})();
