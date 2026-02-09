// ===============================
// MENU | LONG JIU LOU - main.js
// ===============================

// ---------- Flipbook viewer ----------
(() => {
  const viewer = document.getElementById("viewer");
  const pages = Array.from(document.querySelectorAll(".page"));
  if (!viewer || pages.length === 0) return;

  const total = pages.length;
  const pageNow = document.getElementById("pageNow");
  const pageTotal = document.getElementById("pageTotal");
  const dotsWrap = document.getElementById("dots");
  const hint = document.getElementById("hint");

  if (pageTotal) pageTotal.textContent = String(total);

  // build dots
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

  // preload
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

  // observe visible page
  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const idx = pages.indexOf(visible.target);
    if (idx >= 0) {
      setActive(idx);
      preloadAround(idx);
    }
  }, { root: viewer, threshold: [0.55, 0.7, 0.85] });

  pages.forEach(p => io.observe(p));

  // keyboard support
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") scrollToIndex(Math.max(0, currentIndex - 1));
    if (e.key === "ArrowDown") scrollToIndex(Math.min(total - 1, currentIndex + 1));
  });

  setActive(0);
  preloadAround(0);
})();


// ---------- Contact toggle (DEDUPED) ----------
(() => {
  const wrap = document.querySelector(".contactWrap") || document.getElementById("contactWrap");
  const menu = document.getElementById("contactMenu");
  const overlay = document.getElementById("contactOverlay");

  if (!wrap || !menu || !overlay) return;

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

  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  menu.addEventListener("click", (e) => e.stopPropagation());
})();


// ---------- Announcement overlay ----------
(() => {
  const overlay = document.getElementById("announceOverlay");
  const closeBtn = document.getElementById("announceClose");
  const linkWrap = document.getElementById("announceLink");
  const imgInLink = document.getElementById("announceImgLink");
  const plainImg = document.getElementById("announceImg");
  const viewer = document.getElementById("viewer");

  if (!overlay || !closeBtn || !linkWrap || !imgInLink || !plainImg) return;
  if (typeof ANNOUNCEMENTS === "undefined" || !Array.isArray(ANNOUNCEMENTS)) return;

  function thTimeToMs(str) {
    return new Date(str.replace(" ", "T") + ":00+07:00").getTime();
  }

  const now = Date.now();
  const activeList = ANNOUNCEMENTS
    .map(a => ({ ...a, startMs: thTimeToMs(a.start), endMs: thTimeToMs(a.end) }))
    .filter(a => now >= a.startMs && now <= a.endMs);

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
    // reset
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


// ---------- Promotions (FIXED) ----------
(() => {
  // อ่าน id ตั้งแต่แรก ป้องกัน reference ก่อนประกาศ
  const params = new URLSearchParams(location.search);
  const promoId = params.get("id"); // string | null

  // ✅ ถ้ามี id แปลว่าเข้าหน้ารายละเอียด → อย่าโชว์ empty (กันเคสโหลดช้า)
  const emptyEl = document.getElementById("promoEmpty");
  if (promoId && emptyEl) emptyEl.hidden = true;

  // export ให้โค้ดเดิมเรียกใช้ได้
  window.__PROMO_ID__ = promoId;
})();

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
    if (empty) empty.hidden = !!promoId; // มี id = true (ซ่อน), ไม่มี id = false (โชว์)
    return;
  }

  // มีโปร → ต้องมี list + wrap
  if (!list || !wrap) return;

  list.hidden = false;
  wrap.innerHTML = "";

  activePromos.forEach(p => {
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
