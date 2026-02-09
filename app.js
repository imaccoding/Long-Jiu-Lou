// ============================================
// MENU | LONG JIU LOU - app.js
// ============================================
// Notes:
// - ไฟล์นี้ถูกใช้ร่วมกันหลายหน้า (index/promotion/etc.)
// - ทุก block จะ guard element ก่อนทำงานเพื่อไม่ให้หน้าอื่นพัง
// ============================================

/* =========================================================
   Utilities
========================================================= */
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Parse "YYYY-MM-DD HH:mm" as Thailand time (+07:00) -> ms
 * (ใช้กับ promotions/announcements)
 */
function thTimeToMs(str) {
  return new Date(String(str).replace(" ", "T") + ":00+07:00").getTime();
}

/* =========================================================
   1) Flipbook Viewer (index.html)
========================================================= */
(() => {
  const viewer = document.getElementById("viewer");
  const pages = qsa(".page");
  if (!viewer || pages.length === 0) return;

  const total = pages.length;
  const pageNow = document.getElementById("pageNow");
  const pageTotal = document.getElementById("pageTotal");
  const dotsWrap = document.getElementById("dots");
  const hint = document.getElementById("hint");

  if (pageTotal) pageTotal.textContent = String(total);

  // Build dots navigation
  const dots = [];
  if (dotsWrap) {
    pages.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "dot";
      d.type = "button";
      d.setAttribute("aria-label", `ไปหน้า ${i + 1}`);
      d.addEventListener("click", () => scrollToIndex(i));
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  }

  let currentIndex = 0;

  function setActive(index) {
    currentIndex = index;
    if (pageNow) pageNow.textContent = String(index + 1);
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
    if (hint) hint.classList.toggle("hide", index !== 0);
  }

  // ---------- Preload (neighbor pages) ----------
  const preloaded = new Set();

  function preloadImg(src) {
    if (!src || preloaded.has(src)) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    preloaded.add(src);
  }

  function preloadAround(idx) {
    const next = pages[idx + 1]?.querySelector("img")?.getAttribute("src");
    const prev = pages[idx - 1]?.querySelector("img")?.getAttribute("src");
    preloadImg(next);
    preloadImg(prev);
  }

  // ---------- Smooth scroll (no warp) ----------
  let scrollAnimToken = 0;

  function scrollToIndex(index) {
    const target = pages[index];
    if (!target) return;

    scrollAnimToken++;
    const myToken = scrollAnimToken;

    const padTop = parseFloat(getComputedStyle(viewer).paddingTop) || 0;
    const targetTop = Math.max(0, target.offsetTop - padTop);

    const start = viewer.scrollTop;
    const diff = targetTop - start;

    if (Math.abs(diff) < 2) {
      viewer.scrollTop = targetTop;
      return;
    }

    // Temporarily disable snap for animation
    const prevSnap = viewer.style.scrollSnapType;
    viewer.style.scrollSnapType = "none";

    const base = 420;
    const extra = Math.min(380, Math.abs(diff) * 0.25);
    const duration = base + extra;

    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function step(now) {
      if (myToken !== scrollAnimToken) return;

      const t = Math.min(1, (now - startTime) / duration);
      viewer.scrollTop = start + diff * easeOutCubic(t);

      if (t < 1) requestAnimationFrame(step);
      else {
        viewer.scrollTop = targetTop;
        viewer.style.scrollSnapType = prevSnap || "y mandatory";
      }
    }
    requestAnimationFrame(step);
  }

  // ---------- Observe visible page ----------
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const idx = pages.indexOf(visible.target);
      if (idx >= 0) {
        setActive(idx);
        preloadAround(idx);
      }
    },
    { root: viewer, threshold: [0.55, 0.7, 0.85] }
  );

  pages.forEach((p) => io.observe(p));

  // Keyboard support (desktop)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") scrollToIndex(Math.max(0, currentIndex - 1));
    if (e.key === "ArrowDown") scrollToIndex(Math.min(total - 1, currentIndex + 1));
  });

  setActive(0);
  preloadAround(0);
})();

/* =========================================================
   2) Contact Toggle (index.html)
   - FIX: เดิมอ้าง btn แต่ไม่ได้ประกาศ → ทำให้ error
========================================================= */
(() => {
  const wrap = qs(".contactWrap") || document.getElementById("contactWrap");
  const menu = document.getElementById("contactMenu");
  const overlay = document.getElementById("contactOverlay");

  // ปุ่ม toggle ที่ “ต้องมี”
  const btn =
    document.getElementById("contactToggle") ||
    qs("#contactToggle", wrap) ||
    qs(".fab.main", wrap);

  if (!wrap || !menu || !overlay || !btn) return;

  const open = () => {
    wrap.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
  };

  const close = () => {
    wrap.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrap.classList.contains("open") ? close() : open();
  });

  overlay.addEventListener("click", close);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  qsa("a", menu).forEach((a) => a.addEventListener("click", close));
  menu.addEventListener("click", (e) => e.stopPropagation());
})();

/* =========================================================
   3) Announcement Overlay (index.html)
   - ต้องมี global ANNOUNCEMENTS จากที่อื่น
========================================================= */
(() => {
  const overlay = document.getElementById("announceOverlay");
  const closeBtn = document.getElementById("announceClose");
  const linkWrap = document.getElementById("announceLink");
  const imgInLink = document.getElementById("announceImgLink");
  const plainImg = document.getElementById("announceImg");
  const viewer = document.getElementById("viewer");

  if (!overlay || !closeBtn || !linkWrap || !imgInLink || !plainImg) return;
  if (typeof ANNOUNCEMENTS === "undefined" || !Array.isArray(ANNOUNCEMENTS)) return;

  const now = Date.now();
  const activeList = ANNOUNCEMENTS
    .map((a) => ({ ...a, startMs: thTimeToMs(a.start), endMs: thTimeToMs(a.end) }))
    .filter((a) => now >= a.startMs && now <= a.endMs);

  if (!activeList.length) return;

  const current = activeList[0];

  let prevBodyOverflow = "";
  let prevViewerOverflow = "";
  let prevSnap = "";

  function lockScroll() {
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("announce-open");

    if (viewer) {
      prevViewerOverflow = viewer.style.overflow;
      prevSnap = viewer.style.scrollSnapType;
      viewer.style.overflow = "hidden";
      viewer.style.scrollSnapType = "none";
    }
  }

  function unlockScroll() {
    document.body.style.overflow = prevBodyOverflow || "";
    document.body.classList.remove("announce-open");

    if (viewer) {
      viewer.style.overflow = prevViewerOverflow || "";
      viewer.style.scrollSnapType = prevSnap || "";
    }
  }

  function close() {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    unlockScroll();
    closeBtn.blur();
  }

  function show() {
    // reset state
    linkWrap.hidden = true;
    plainImg.hidden = true;
    imgInLink.src = "";
    plainImg.src = "";

    const onImgError = () => {
      console.warn("[Announcement] Image failed to load:", current.imageSrc);
      close();
    };

    const useLink = !!(current.linkToFull && String(current.linkToFull).trim());
    const imageSrc = current.imageSrc;

    if (useLink) {
      linkWrap.href = String(current.linkToFull).trim();
      linkWrap.hidden = false;
      imgInLink.hidden = false;
      imgInLink.onerror = onImgError;
      imgInLink.src = imageSrc;
    } else {
      plainImg.hidden = false;
      plainImg.onerror = onImgError;
      plainImg.src = imageSrc;
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    lockScroll();
  }

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  show();
})();

/* =========================================================
   4) Back Button (promotion.html)
========================================================= */
(() => {
  const backBtn = document.getElementById("backBtn");
  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.href = "promotion.html";
  });
})();

/* =========================================================
   5) Promotions helpers (promotion.html)
   - หน้านี้มี inline script ของตัวเองอยู่แล้ว
   - block นี้ “แค่ช่วย” กัน empty โผล่ผิดจังหวะ + export id
========================================================= */
(() => {
  const params = new URLSearchParams(location.search);
  const promoId = params.get("id"); // string | null

  // ถ้ามี id แปลว่าเข้าหน้ารายละเอียด → กัน empty state โผล่
  const emptyEl = document.getElementById("promoEmpty");
  if (promoId && emptyEl) emptyEl.hidden = true;

  // export เผื่อโค้ดเดิมบางส่วนใช้งานต่อ
  window.__PROMO_ID__ = promoId;
})();

/**
 * Render list of active promos.
 * NOTE: ฟังก์ชันนี้จะถูกใช้เมื่อคุณอยากเรียกจากที่อื่น
 * (ตอนนี้ใน promotion.html มี renderList ของตัวเองแล้ว)
 */
function renderList(activePromos, promoId) {
  const list = document.getElementById("promoList");
  const wrap = document.getElementById("listWrap");
  const empty = document.getElementById("promoEmpty");

  // reset
  if (list) list.hidden = true;
  if (empty) empty.hidden = true;

  // ไม่มีโปร
  if (!activePromos || activePromos.length === 0) {
    // โชว์ empty เฉพาะตอน “ไม่มี id”
    if (empty) empty.hidden = !!promoId;
    return;
  }

  // มีโปร → ต้องมี list + wrap
  if (!list || !wrap) return;

  list.hidden = false;
  wrap.innerHTML = "";

  activePromos.forEach((p) => {
    const a = document.createElement("a");
    a.href = `promotion.html?id=${encodeURIComponent(p.id)}`;
    a.className = "promoItem";
    a.innerHTML = `
      <img class="promoThumb" src="${p.imageSrc}" alt="">
      <div class="promoMeta">
        <div class="promoName">${p.title}</div>
        <div class="promoHint">แตะเพื่อดูรายละเอียด</div>
      </div>
      <div class="promoGo">›</div>
    `;
    wrap.appendChild(a);
  });
}
