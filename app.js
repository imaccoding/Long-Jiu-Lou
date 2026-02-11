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
const qs = (sel, root = document) => {
  if (!root || !root.querySelector) return null;
  return root.querySelector(sel);
};

const qsa = (sel, root = document) => {
  if (!root || !root.querySelectorAll) return [];
  return Array.from(root.querySelectorAll(sel));
};


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

// ===============================
// Promotion Page
// ===============================
function initPromotionPage() {
  // guard: รันเฉพาะหน้า promo
  if (!document.body.classList.contains("promoPage")) return;

   // ---------- CONFIG ----------
const PROMOTIONS = [
  {
    id: "a1",
    title: "โปรโมชั่นสำหรับสมาชิก",
    imageSrc: "images/pro-feb/1.jpg",
    lines: [
      "สมัครสมาชิกใหม่วันนี้ ลดทันที 10% ต่อใบเสร็จ",
      "สำหรับสมาชิกเดิม ลดทันที 5% ต่อใบเสร็จ",
      "สอบถามเมนูที่ร่วมรายการได้ที่หน้าร้านหรือแชท",
    ],
    start: "2026-02-06 13:45",
    end:   "2027-01-01 10:00",
  },
  {
    id: "a2",
    title: "โปรโมชั่นเดือนกุมภาพันธ์",
    imageSrc: "images/pro-feb/2.jpg",
    lines: [
      "ทานอาหารครบ 1,200 บาท",
      "รับฟรี ซาลาเปาส้ม",
      "โปรโมชั่นนี้ ใช้ได้เฉพาะเดือนกุมภาพันธ์นี้ เท่านั้น",
    ],
    start: "2026-02-01 00:00",
    end:   "2026-02-28 22:00",
  },
  {
    id: "a3",
    title: "โปรโมชั่นวันวาเลนไทน์",
    imageSrc: "images/pro-feb/3.jpg",
    lines: [
      "มาถึงคู่รักหรือครอบครัวฟรี ซาลาเปารูปหัวใจไส้สตรอว์เบอร์รี่",
      "ระยะเวลา 13 - 15 กุมภาพันธ์นี้ เท่านั้น",
    ],
    start: "2026-02-11 00:00",
    end:   "2026-02-15 22:00",
  },
  {
    id: "a4",
    title: "จับอั่งเปาฟรี!",
    imageSrc: "images/pro-feb/4.jpg",
    lines: [
      "เมื่อทานอาหารครบ 3,000 บาท",
      "รับฟรีอั่งเปาส่วนลด",
      "ระยะเวลาโปรโมชั่น 15 - 18 กุมภาพันธ์นี้ เท่านั้น",
      "สามารถใช้คูปองได้ถึง 31 มีนาคม 2569",
    ],
    start: "2026-02-15 00:00",
    end:   "2026-02-18 22:00",
  },
];

  const $ = (id) => document.getElementById(id);

  // ---------- Time helpers ----------
  const thTimeToMs = (str) =>
    new Date(str.replace(" ", "T") + ":00+07:00").getTime();

  const nowTHms = () =>
    new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    ).getTime();

  const isActive = (p, nowMs) =>
    nowMs >= thTimeToMs(p.start) && nowMs <= thTimeToMs(p.end);

  // ---------- Toast ----------
  function showToast(text) {
    const t = $("toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(() => t.classList.remove("show"), 1200);
  }

  // ---------- Hide ----------
  function hideAll() {
    document.querySelectorAll(".promoCard").forEach((el) => (el.hidden = true));
    ["promoList", "promoEmpty", "promoError"].forEach((id) => {
      const el = $(id);
      if (el) el.hidden = true;
    });
  }

  // ---------- Bind buttons (ผูกครั้งเดียว) ----------
  document.querySelectorAll(".promoCard").forEach((card) => {
    const btnShare = card.querySelector(".btnShare");
    const btnCopy = card.querySelector(".btnCopy");

    const getTitle = () =>
      card.querySelector(".promoTitle")?.textContent?.trim() || "Promotion";

    btnShare?.addEventListener("click", async () => {
      const url = location.href;
      const title = getTitle();

      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {}
        return;
      }

      try {
        await navigator.clipboard.writeText(url);
        showToast("คัดลอกลิงก์แล้ว");
      } catch {
        prompt("คัดลอกลิงก์นี้:", url);
      }
    });

    btnCopy?.addEventListener("click", async () => {
      const url = location.href;
      try {
        await navigator.clipboard.writeText(url);
        showToast("คัดลอกลิงก์แล้ว");
      } catch {
        prompt("คัดลอกลิงก์นี้:", url);
      }
    });
  });

  // ---------- Render detail ----------
  function renderDetail(p) {
  hideAll();

  const detail = document.getElementById("promoDetail");
  const img = document.getElementById("promoDetailImg");
  const title = document.getElementById("promoDetailTitle");
  const linesWrap = document.getElementById("promoDetailLines");
  const pageTitle = document.getElementById("pageTitle");

  if (!detail || !img || !title || !linesWrap) {
    document.getElementById("promoError")?.removeAttribute("hidden");
    return;
  }

  detail.hidden = false;

  if (pageTitle) pageTitle.textContent = p.title;
  img.src = p.imageSrc;
  title.textContent = p.title;

  linesWrap.innerHTML = "";
  (p.lines || []).forEach(text => {
    const el = document.createElement("p");
    el.className = "detail";
    el.textContent = text;
    linesWrap.appendChild(el);
  });

  // ✅ แสดงปุ่ม back เฉพาะตอนเป็นหน้า detail
  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.hidden = false;
}


  // ---------- Render list ----------
  function renderList(list) {
    hideAll();
    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.hidden = true;

    const titleEl = $("pageTitle");
    if (titleEl) titleEl.textContent = "PROMOTIONS";

    if (!list || list.length === 0) {
      $("promoEmpty")?.removeAttribute("hidden");
      return;
    }

    const promoList = $("promoList");
    const wrap = $("listWrap");
    if (!promoList || !wrap) {
      $("promoEmpty")?.removeAttribute("hidden");
      return;
    }

    promoList.hidden = false;
    wrap.innerHTML = "";

    list.forEach((p) => {
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

  // ---------- Main (มีชุดเดียวพอ) ----------
  const params = new URLSearchParams(location.search);
  const promoId = params.get("id");

  document.body.classList.toggle("is-detail", !!promoId);

  const nowMs = nowTHms();

  if (promoId) {
    const promo = PROMOTIONS.find((p) => p.id === promoId);
    promo ? renderDetail(promo) : $("promoError")?.removeAttribute("hidden");
  } else {
    const active = PROMOTIONS.filter((p) => isActive(p, nowMs));
    renderList(active);
  }
}

// init
document.addEventListener("DOMContentLoaded", () => {
  initPromotionPage();
});

