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


// ===== Promotion Back Button =====
(() => {
  const backBtn = document.getElementById("backBtn");
  if (!backBtn) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  // หน้า list → ไม่โชว์ปุ่ม Back
  backBtn.hidden = !id;

  backBtn.addEventListener("click", () => {
    // ถ้ามี history ให้ลอง back
    if (window.history.length > 1) {
      history.back();

      // fallback กันกรณีเปิดจากลิงก์ตรง
      setTimeout(() => {
        const p = new URLSearchParams(location.search);
        if (p.get("id")) {
          location.href = "promotion.html";
        }
      }, 150);
    } else {
      // ไม่มี history → กลับ list ตรง ๆ
      location.href = "promotion.html";
    }
  });
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

  // ✅ เหลือ $ / params / id ชุดเดียว (แก้เฉพาะจุด: เอาที่ซ้ำออก)
    const $ = (id) => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const id = params.get("id"); // promo id

    // ====== เวลาไทย ======
    function thTimeToMs(str) {
      return new Date(str.replace(" ", "T") + ":00+07:00").getTime();
    }
    function nowTHms() {
      const th = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      return th.getTime();
    }
    function isActive(p, nowMs) {
      const s = thTimeToMs(p.start);
      const e = thTimeToMs(p.end);
      return nowMs >= s && nowMs <= e;
    }

    function showToast(text){
      const t = $("toast");
      if (!t) return;
      t.textContent = text;
      t.classList.add("show");
      clearTimeout(showToast._tm);
      showToast._tm = setTimeout(() => t.classList.remove("show"), 1200);
    }

    // ✅ hideAll เดิมคงไว้ แต่ทำให้ปลอด null (ไม่พังถ้า element ไม่มี)
    function hideAll() {
      // ซ่อนการ์ดรายละเอียดทั้งหมด
      document.querySelectorAll(".promoCard").forEach(el => (el.hidden = true));

      // ซ่อน list/empty/error (มีไหมค่อยซ่อน)
      const list  = $("promoList");
      const empty = $("promoEmpty");
      const err   = $("promoError");

      if (list)  list.hidden = true;
      if (empty) empty.hidden = true;
      if (err)   err.hidden = true;
    }

    // ✅ Bind share/copy ต่อการ์ด (คงฟีเจอร์เดิม) + แก้ selector ให้เจอจริง
    document.querySelectorAll(".promoCard").forEach(card => {
      const btnShare = card.querySelector(".btnShare");
      const btnCopy  = card.querySelector(".btnCopy");

      btnShare?.addEventListener("click", async () => {
        const url = location.href;
        const title = card.querySelector(".promoTitle")?.textContent?.trim()
          || card.querySelector("#promoTitle")?.textContent?.trim()
          || "Promotion";

        if (navigator.share) {
          try { await navigator.share({ title, url }); } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(url);
            showToast("คัดลอกลิงก์แล้ว");
          } catch {
            prompt("คัดลอกลิงก์นี้:", url);
          }
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

    // ====== Render: Detail ======
    function renderDetail(p){
      hideAll();

      // ✅ แสดงการ์ดตาม id (เช่น a1/a2/a3)
      const card = $(p.id);
      if (!card) {
        const err = $("promoError");
        if (err) err.hidden = false;
        return;
      }

      card.hidden = false;

      // อัปเดตหัวข้อหน้า
      const pageTitle = $("pageTitle");
      if (pageTitle) pageTitle.textContent = p.title;

      // set รูป “ใน card นี้”
      const img = card.querySelector(".promoImg");
      if (img) img.src = p.imageSrc;

      // set title “ใน card นี้” (รองรับทั้ง class และ id เดิม)
      const titleEl =
        card.querySelector(".promoTitle") ||
        card.querySelector("#promoTitle");
      if (titleEl) titleEl.textContent = p.title;

      // set detail ลง <p> ที่มีอยู่ (ไม่ลบของเดิม แค่เติมให้ตรง p.detail)
      const detailEls = card.querySelectorAll(".promoDetail");
      if (detailEls && detailEls.length) {
        const lines = String(p.detail || "").split("\n").filter(Boolean);
        detailEls.forEach((el, i) => {
          el.textContent = lines[i] || "";
          el.hidden = !lines[i];
        });
      }
    }

    // ====== Render: List (Active only) ======
    function renderList(activePromos){
      hideAll();
      const pageTitle = $("pageTitle");
      if (pageTitle) pageTitle.textContent = "PROMOTIONS";

      if (!activePromos || activePromos.length === 0) {
        const empty = $("promoEmpty");
        if (empty) empty.hidden = false;
        return;
      }

      // NOTE: หน้านี้ยังไม่มี promoList/listWrap ใน HTML (คงไว้ตามเดิม)
      const list = $("promoList");
      const wrap = $("listWrap");
      if (!list || !wrap) {
        const empty = $("promoEmpty");
        if (empty) empty.hidden = false;
        return;
      }

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

    // ====== main ======
    const nowMs = nowTHms();

    if (id) {
      const promo = PROMOTIONS.find(p => p.id === id);
      if (!promo) {
        hideAll();
        const err = $("promoError");
        if (err) err.hidden = false;
      } else {
        renderDetail(promo);
      }
    } else {
      const activePromos = PROMOTIONS.filter(p => isActive(p, nowMs));
      renderList(activePromos);
    }

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
