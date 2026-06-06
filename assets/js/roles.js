// assets/js/roles.js
(function () {
  const grid = document.querySelector(".roles-grid");
  if (!grid) return;

  const cards = Array.from(document.querySelectorAll(".role-card"));
  const emptyMsg = document.querySelector(".roles-empty");
  const itemsSection = document.querySelector(".roles-items");
  const searchInput = document.querySelector(".roles-search");
  const teamButtons = Array.from(document.querySelectorAll("[data-filter-team]"));
  const nightButton = document.querySelector("[data-filter-night]");

  const variantParent = {};
  document.querySelectorAll('template[id^="detail-"]').forEach((tpl) => {
    const parentSlug = tpl.id.slice("detail-".length);
    tpl.content.querySelectorAll(".variant[id]").forEach((v) => {
      variantParent[v.id] = parentSlug;
    });
  });

  const state = { team: "all", night: false, q: "" };

  function applyFilters() {
    let visible = 0;
    for (const card of cards) {
      const okTeam = state.team === "all" || card.dataset.team === state.team;
      const okNight = !state.night || card.dataset.night === "yes";
      const okQ = !state.q || card.dataset.name.includes(state.q);
      const show = okTeam && okNight && okQ;
      card.classList.toggle("is-hidden", !show);
      if (show) visible++;
    }
    if (emptyMsg) emptyMsg.hidden = visible !== 0;
    if (itemsSection) {
      const anyItemVisible = cards.some(
        (c) => c.dataset.team === "items" && !c.classList.contains("is-hidden")
      );
      itemsSection.hidden = !anyItemVisible;
    }
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

  // ---- Modal + hash sync ----
  const modal = document.getElementById("role-modal");
  const titleEl = document.getElementById("role-modal-title");
  const contentEl = document.getElementById("role-modal-content");
  const imgEl = document.getElementById("role-modal-img");
  let lastFocus = null;

  function openRole(slug) {
    const tpl = document.getElementById("detail-" + slug);
    const card = document.querySelector('.role-card[data-slug="' + slug + '"]');
    if (!tpl || !card) return false;

    titleEl.textContent = card.querySelector(".role-card__name").textContent;
    const cardImg = card.querySelector(".role-card__art img");
    imgEl.src = cardImg && !cardImg.classList.contains("is-missing") ? cardImg.src : "";
    contentEl.replaceChildren(tpl.content.cloneNode(true));

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".role-modal__close").focus();
    if (location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug);
    return true;
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => openRole(card.dataset.slug));
  });

  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeModal();
    // in-modal cross-links like <a href="#alpha-wolf">
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      const slug = link.getAttribute("href").slice(1);
      const target = document.getElementById("detail-" + slug) ? slug : variantParent[slug];
      if (target) {
        e.preventDefault();
        openRole(target);
      }
    }
  });

  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  function syncFromHash() {
    const slug = location.hash.slice(1);
    if (!slug) return;
    const target = document.getElementById("detail-" + slug) ? slug : variantParent[slug];
    if (target) openRole(target);
  }
  window.addEventListener("hashchange", syncFromHash);

  applyFilters();
  syncFromHash(); // deep-link support: /roles#amateur-bodyguard opens that role
})();
