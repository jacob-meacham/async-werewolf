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

  // Build variant→parent slug map from hidden templates
  const variantParent = {};
  document.querySelectorAll('template[id^="detail-"]').forEach((tpl) => {
    const parentSlug = tpl.id.slice("detail-".length);
    tpl.content.querySelectorAll(".variant[id]").forEach((v) => {
      variantParent[v.id] = parentSlug;
    });
  });

  const state = { team: "all", night: false, q: "" };

  // ---- Inline detail panel ----
  let openSlug = null;    // currently-open role slug
  let openCard = null;    // the .role-card element that triggered it
  let detailPanel = null; // the <section class="role-detail"> node in the DOM
  let lastFocus = null;   // element to return focus to on close

  function buildPanel(slug, card) {
    const tpl = document.getElementById("detail-" + slug);
    if (!tpl) return null;

    const section = document.createElement("section");
    section.className = "role-detail";
    section.setAttribute("role", "region");
    section.setAttribute("aria-label", card.querySelector(".role-card__name").textContent.trim());
    // grid-column set via CSS; also set here for safety
    section.style.gridColumn = "1 / -1";

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "role-detail__close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.setAttribute("data-close", "");
    closeBtn.textContent = "×";
    section.appendChild(closeBtn);

    // Illustration
    const cardImg = card.querySelector(".role-card__art img");
    const hasMissingImg = cardImg && cardImg.classList.contains("is-missing");
    if (cardImg && !hasMissingImg) {
      const art = document.createElement("div");
      art.className = "role-detail__art";
      const img = document.createElement("img");
      img.src = cardImg.src;
      img.alt = "";
      art.appendChild(img);
      section.appendChild(art);
    }

    // Content wrapper
    const body = document.createElement("div");
    body.className = "role-detail__body";

    // Heading
    const h2 = document.createElement("h2");
    h2.textContent = card.querySelector(".role-card__name").textContent.trim();
    body.appendChild(h2);

    // Stats + body + variants from template
    body.appendChild(tpl.content.cloneNode(true));

    section.appendChild(body);
    return section;
  }

  function openRole(slug, scrollTo) {
    const tpl = document.getElementById("detail-" + slug);
    const card = document.querySelector('.role-card[data-slug="' + slug + '"]');
    if (!tpl || !card) return false;

    // Close any existing panel cleanly (no hash clear, no focus return — we're moving it)
    if (detailPanel) {
      detailPanel.remove();
      detailPanel = null;
    }
    if (openCard) {
      openCard.classList.remove("is-open");
    }

    // If same card was open, treat as close
    if (openSlug === slug) {
      openSlug = null;
      openCard = null;
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      return true;
    }

    // Build the new panel
    const panel = buildPanel(slug, card);
    if (!panel) return false;

    // Insert panel directly after the card in the same grid container
    const container = card.parentNode;
    const nextSibling = card.nextSibling;
    if (nextSibling) {
      container.insertBefore(panel, nextSibling);
    } else {
      container.appendChild(panel);
    }

    openSlug = slug;
    openCard = card;
    detailPanel = panel;
    card.classList.add("is-open");

    lastFocus = document.activeElement;

    // Focus the close button
    const closeBtn = panel.querySelector(".role-detail__close");
    if (closeBtn) closeBtn.focus();

    // Sync hash
    if (location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug);

    // Scroll card into view (or scroll panel into view)
    if (scrollTo !== false) {
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    return true;
  }

  function closeDetail() {
    if (!detailPanel) return;
    detailPanel.remove();
    detailPanel = null;
    if (openCard) {
      openCard.classList.remove("is-open");
      if (lastFocus === openCard || !lastFocus) {
        openCard.focus();
      } else if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }
    openSlug = null;
    openCard = null;
    lastFocus = null;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // Card clicks
  cards.forEach((card) => {
    card.addEventListener("click", () => openRole(card.dataset.slug));
  });

  // Panel click: close button + in-panel cross-links
  document.addEventListener("click", (e) => {
    if (!detailPanel) return;
    // Close button
    if (e.target.hasAttribute("data-close") && detailPanel.contains(e.target)) {
      closeDetail();
      return;
    }
    // In-panel cross-links like <a href="#alpha-wolf">
    const link = e.target.closest('a[href^="#"]');
    if (link && detailPanel.contains(link)) {
      const rawSlug = link.getAttribute("href").slice(1);
      const target = document.getElementById("detail-" + rawSlug) ? rawSlug : variantParent[rawSlug];
      if (target) {
        e.preventDefault();
        // Reset openSlug so openRole doesn't treat it as a toggle-close
        const prevSlug = openSlug;
        openSlug = null;
        openRole(target);
        // If we navigated to the same slug, restore state (shouldn't normally happen)
        if (prevSlug === target) openSlug = target;
      }
    }
  });

  // Esc to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailPanel) closeDetail();
  });

  // ---- Filters ----
  function applyFilters() {
    // Close the open panel when filters change so it doesn't dangle
    if (detailPanel) {
      const prevSlug = openSlug;
      openSlug = null; // prevent toggle-close logic in closeDetail
      closeDetail();
      openSlug = prevSlug; // (closeDetail already set it null, but be explicit)
      openSlug = null;
    }

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

  // ---- Deep-link / hash sync ----
  function syncFromHash() {
    const slug = location.hash.slice(1);
    if (!slug) return;
    const target = document.getElementById("detail-" + slug) ? slug : variantParent[slug];
    if (target) openRole(target, true);
  }
  window.addEventListener("hashchange", syncFromHash);

  applyFilters();
  syncFromHash(); // deep-link support: /roles#amateur-bodyguard opens that role
})();
