(() => {
  const viewer = document.getElementById("viewer");
  const pages = Array.from(document.querySelectorAll(".page"));
  if (!viewer || pages.length === 0) return;

  const total = pages.length;
  const pageNow = document.getElementById("pageNow");
  const pageTotal = document.getElementById("pageTotal");
  const dotsWrap = document.getElementById("dots");
  const hint = document.getElementById("hint");

  if (pageTotal) pageTotal.textContent = total;

  // build dots (ถ้ามี)
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

  // ✅ preloaded ต้องประกาศก่อนใช้ (แก้ error ตัวที่ 2)
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

  // keyboard support (ถ้าต้องการ)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") scrollToIndex(Math.max(0, currentIndex - 1));
    if (e.key === "ArrowDown") scrollToIndex(Math.min(total - 1, currentIndex + 1));
  });

  setActive(0);
  preloadAround(0);
})();


// Contact toggle
(() => {
  const wrap = document.querySelector(".contactWrap");
  const btn = document.getElementById("contactToggle");
  const menu = document.getElementById("contactMenu");
  const overlay = document.getElementById("contactOverlay");

  if (!wrap || !btn || !menu || !overlay) return;

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

  btn.addEventListener("click", () => {
    wrap.classList.contains("open") ? close() : open();
  });

  overlay.addEventListener("click", close);

  // ปิดเมื่อกด ESC (desktop)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ปิดเมื่อกดปุ่มย่อยแล้ว (ให้ดูเรียบร้อย)
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
})();

const viewer = document.getElementById("viewer");
let prevViewerOverflow = "";
let prevSnap = "";

(() => {
  const wrap = document.getElementById("contactWrap");
  const btn = document.getElementById("contactToggle");
  const menu = document.getElementById("contactMenu");
  const overlay = document.getElementById("contactOverlay");

  if (!wrap || !btn || !menu || !overlay) return;

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

  menu.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", close)
  );

  // กันเคสคลิกโดนพื้นที่ menu แล้ว event ไปปิดทับ
  menu.addEventListener("click", (e) => e.stopPropagation());
})();

  (() => {
  // ====== CONFIG: ใส่ภาพ / กำหนดวัน และเวลา โปรโมชันทั้งหมด ======
 const PROMOTIONS = [
    {
      id: "a1",
      title: "โปรโมชั่นสำหรับสมาชิก",
      imageSrc: "images/pro-feb/1.jpg",
      detail:
        "• สมัครสมาชิกใหม่วันนี้ ลดทันที 10% ต่อใบเสร็จ\n" +
        "• สำหรับสมาชิกเดิม ลดทันที 5% ต่อใบเสร็จ\n" +
        "• สอบถามเมนูที่ร่วมรายการได้ที่หน้าร้านหรือแชท",
      start: "2026-02-06 13:45",
      end:   "2027-01-01 10:00",
    },
    {
      id: "a2",
      title: "โปรโมชั่นสำหรับคุณลูกค้าทุกท่าน",
      imageSrc: "images/pro-feb/2.jpg",
      detail:
        "• ทานอาหารครบ 1,200 บาท\n" +
        "• รับฟรี ซาลาเปาส้ม\n" +
        "• โปรโมชั่นนี้ ใช้ได้เฉพาะเดือนกุมภาพันธ์นี้ เท่านั้น",
      start: "2026-02-01 00:00",
      end:   "2026-02-28 22:00",
    },
    {
      id: "a3",
      title: "จับอั่งเปาฟรี!",
      imageSrc: "images/pro-feb/3.jpg",
      detail:
        "• เมื่อทานอาหารครบ 3,000 บาท\n" +
        "• รับฟรีอั่งเปาส่วนลด\n" +
        "• ระยะเวลา 15 - 18 กุมภาพันธ์นี้ เท่านั้น",
      start: "2026-02-15 00:00",
      end:   "2026-02-18 22:00",
    },
  ];

  // Elements
  const overlay = document.getElementById("announceOverlay");
  const closeBtn = document.getElementById("announceClose");
  const linkWrap = document.getElementById("announceLink");
  const imgInLink = document.getElementById("announceImgLink");
  const plainImg = document.getElementById("announceImg");
  const viewer = document.getElementById("viewer");

  if (!overlay || !closeBtn || !linkWrap || !imgInLink || !plainImg) return;

  // Helpers
  function thTimeToMs(str) {
    return new Date(str.replace(" ", "T") + ":00+07:00").getTime();
  }

  const now = Date.now();

  // เลือกอันที่ active ตอนนี้ (ตามลำดับ array)
  const activeList = ANNOUNCEMENTS
    .map(a => ({ ...a, startMs: thTimeToMs(a.start), endMs: thTimeToMs(a.end) }))
    .filter(a => now >= a.startMs && now <= a.endMs);

  if (!activeList.length) return;

  const current = activeList[0];

  // ===== lock / unlock scroll =====
  let prevViewerOverflow = "";
  let prevSnap = "";
  let prevBodyOverflow = "";

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

  function show() {
    // reset
    linkWrap.hidden = true;
    plainImg.hidden = true;
    imgInLink.src = "";
    plainImg.src = "";

    const onImgError = () => {
      console.warn("[Announcement] Image failed to load:", current.imageSrc);
      close(); // ปิด + ปลดล็อก (ไม่ค้าง)
    };

    const useLink = !!(current.linkToFull && current.linkToFull.trim());

    if (useLink) {
      linkWrap.href = current.linkToFull.trim();
      linkWrap.hidden = false;
      imgInLink.hidden = false;
      imgInLink.onerror = onImgError;
      imgInLink.src = current.imageSrc;
    } else {
      plainImg.hidden = false;
      plainImg.onerror = onImgError;
      plainImg.src = current.imageSrc;
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    lockScroll();
  }

  function close() {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    unlockScroll();
    closeBtn.blur();
  }

  // Events
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

function renderList(activePromos){
  // โชว์ list ถ้ามี
  const list = document.getElementById("promoList");
  const wrap = document.getElementById("listWrap");
  const empty = document.getElementById("promoEmpty");

  if (list) list.hidden = true;
  if (empty) empty.hidden = true;

  if (!activePromos || activePromos.length === 0) {
    // ✅ ไม่มีโปร active → โชว์ข้อความแทน
    if (!id) {
  empty.hidden = false;   // เข้าแบบไม่มี id → โชว์ empty
} else {
  empty.hidden = true;    // มี id → ซ่อน empty
}
    return;
  }

  // ✅ มีโปร active → โชว์รายการ
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

const empty = document.getElementById("promoEmpty");
const params = new URLSearchParams(location.search);
const id = params.get("id");

// ✅ ถ้ามี id แปลว่าเข้าหน้ารายละเอียด → อย่าโชว์ empty
if (id && empty) empty.hidden = true;


