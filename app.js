(() => {
  const viewer = document.getElementById("viewer");
  const pages = Array.from(document.querySelectorAll(".page"));
  const total = pages.length;

  const pageNow = document.getElementById("pageNow");
  const pageTotal = document.getElementById("pageTotal");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const dotsWrap = document.getElementById("dots");
  const hint = document.getElementById("hint");

  pageTotal.textContent = total;

  // build dots
  const dots = pages.map((p, i) => {
    const d = document.createElement("button");
    d.className = "dot";
    d.type = "button";
    d.setAttribute("aria-label", `ไปหน้า ${i + 1}`);
    d.addEventListener("click", () => scrollToIndex(i));
    dotsWrap.appendChild(d);
    return d;
  });

  let currentIndex = 0;

 function setActive(index) {
  currentIndex = index;

  pageNow.textContent = String(index + 1);
  dots.forEach((d, i) => d.classList.toggle("active", i === index));

  // ✅ Hint แสดงเฉพาะหน้าแรกเท่านั้น
  if (index === 0) hint.classList.remove("hide");
  else hint.classList.add("hide");
}

 let isAnimating = false;

function scrollToIndex(index) {
  const target = pages[index];
  if (!target || isAnimating) return;

  // ✅ อ่าน padding-top ของ viewer จาก CSS จริง
  const padTop = parseFloat(getComputedStyle(viewer).paddingTop) || 0;

  // ✅ offsetTop จะรวม padding ของ viewer อยู่แล้ว → ต้องหักออก
  const targetTop = Math.max(0, target.offsetTop - padTop);

  const start = viewer.scrollTop;
  const diff = targetTop - start;
  if (Math.abs(diff) < 2) return;

  isAnimating = true;

  const prevSnap = viewer.style.scrollSnapType;
  viewer.style.scrollSnapType = "none";

  const base = 420;
  const extra = Math.min(380, Math.abs(diff) * 0.25);
  const duration = base + extra;

  const startTime = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    viewer.scrollTop = start + diff * easeOutCubic(t);

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      // ✅ ล็อกตำแหน่งให้ตรง “หน้าเป๊ะ” (ไม่ใช้ scrollIntoView)
      viewer.scrollTop = targetTop;

      viewer.style.scrollSnapType = prevSnap || "y mandatory";
      isAnimating = false;
    }
  }

  requestAnimationFrame(step);
}


  // observe which page is visible
  const io = new IntersectionObserver((entries) => {
    // pick the most visible entry
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => (b.intersectionRatio - a.intersectionRatio))[0];

    if (!visible) return;

    const idx = pages.indexOf(visible.target);
    if (idx >= 0) setActive(idx);

    // preload next/prev images (ช่วยให้ไม่กระตุก)
    preloadAround(idx);
  }, { root: viewer, threshold: [0.55, 0.7, 0.85] });

  pages.forEach(p => io.observe(p));

  btnPrev.addEventListener("click", () => scrollToIndex(Math.max(0, currentIndex - 1)));
  btnNext.addEventListener("click", () => scrollToIndex(Math.min(total - 1, currentIndex + 1)));

  // keyboard support (desktop)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") btnPrev.click();
    if (e.key === "ArrowDown") btnNext.click();
  });

  // preload function
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

  // initial state + preload first/second
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

window.addEventListener("load", () => {
  viewer.scrollTo({ top: 0, behavior: "auto" });
  setActive(0);
});
(function () {
    const wrap = document.getElementById("contactWrap");
    const btn = document.getElementById("contactToggle");
    const menu = document.getElementById("contactMenu");
    const overlay = document.getElementById("contactOverlay");

    if (!wrap || !btn || !menu || !overlay) return;

    function openMenu(){
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded","true");
      menu.setAttribute("aria-hidden","false");
      overlay.hidden = false;
    }
    function closeMenu(){
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded","false");
      menu.setAttribute("aria-hidden","true");
      overlay.hidden = true;
    }

    btn.addEventListener("click", () => {
      wrap.classList.contains("open") ? closeMenu() : openMenu();
    });

    overlay.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  })();

  (() => {
  // =========================
  // CONFIG: ใส่ได้หลายภาพ (เรียงตามลำดับใน array)
  // =========================
  const ANNOUNCEMENTS = [
    {
      id: "a1",
      imageSrc: "images/pro-holi/announce-1.jpg",
      linkToFull: "", 
      start: "2026-01-15 09:20",
      end:   "2026-01-20 09:25",
    },
    {
      id: "a2",
      imageSrc: "images/pro-holi/announce-2.jpg",
      linkToFull: "",
      start: "2026-01-15 09:33",
      end:   "2026-01-27 09:35",
    },
    {
      id: "a3",
      imageSrc: "images/pro-holi/announce-3.jpg",
      linkToFull: "",
      start: "2026-01-15 09:36",
      end:   "2026-02-03 09:38",
    },
  ];

  // =========================
  // Elements
  // =========================
  const overlay = document.getElementById("announceOverlay");
  const cardClose = document.getElementById("announceClose");

  const linkWrap = document.getElementById("announceLink");
  const imgInLink = document.getElementById("announceImgLink");

  const plainImg = document.getElementById("announceImg");

  if (!overlay || !cardClose || !imgInLink || !plainImg || !linkWrap) return;

  // =========================
  // Helpers: เวลาไทย
  // =========================
  function thTimeToMs(str) {
    // "YYYY-MM-DD HH:mm" -> ISO +07:00
    return new Date(str.replace(" ", "T") + ":00+07:00").getTime();
  }

  function todayTH() {
    // YYYY-MM-DD ตามเวลาไทย
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
    ).toISOString().slice(0, 10);
  }

  const now = Date.now();

  // เอารายการที่ active ตอนนี้ (เรียงตามลำดับ array)
  const activeList = ANNOUNCEMENTS
    .map(a => ({ ...a, startMs: thTimeToMs(a.start), endMs: thTimeToMs(a.end) }))
    .filter(a => now >= a.startMs && now <= a.endMs);

  if (activeList.length === 0) return;

  // ถ้าชนกันหลายอัน ให้เอาอันแรกตามลำดับ array
  const current = activeList[0];

  // วันละครั้ง: ต่อประกาศ + ต่อวัน
  //const onceKey = `announceShown:${current.id}:${todayTH()}`;
  //if (localStorage.getItem(onceKey) === "1") return;

  // =========================
  // Show / Close
  // =========================
  function showAnnouncement() {
    // reset
    linkWrap.hidden = true;
    plainImg.hidden = true;
    imgInLink.src = "";
    plainImg.src = "";

    // ถ้ารูปโหลดพัง ให้ปิดทันทีไม่ค้าง
    const onImgError = () => {
      console.warn("[Announcement] Image failed to load:", current.imageSrc);
      closeAnnouncement(false); // ไม่ mark ว่า seen (กันหายเงียบ)
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
    document.body.classList.add("announce-open");
  }

  function closeAnnouncement(markSeen = true) {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("announce-open");

    if (markSeen) localStorage.setItem(onceKey, "1");
  }

  // ปุ่มปิด
  cardClose.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAnnouncement(true);
  });

  // กดพื้นหลังมืดเพื่อปิด
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAnnouncement(true);
  });

  // ESC เพื่อปิด
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeAnnouncement(true);
  });

  showAnnouncement();
})();

