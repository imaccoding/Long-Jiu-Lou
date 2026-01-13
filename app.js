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
  const viewer = document.getElementById("viewer");
  const modal = document.getElementById("fsModal");
  const fsImg = document.getElementById("fsImg");
  const btnClose = document.getElementById("fsClose");
  const btnFs = document.getElementById("fsFullscreen");
  const fsBody = document.getElementById("fsBody");

  if (!viewer || !modal || !fsImg || !btnClose || !btnFs || !fsBody) return;

  let prevSnap = "";
  let lastScrollTop = 0;

  function openModal(src) {
    if (!src) return;

    lastScrollTop = viewer.scrollTop;

    // ปิด snap กันพื้นหลังเด้ง (เผื่อมี)
    prevSnap = viewer.style.scrollSnapType;
    viewer.style.scrollSnapType = "none";

    // ล็อกพื้นหลัง
    document.body.classList.add("modal-open");

    // ใส่รูป
    fsImg.src = src;

    // เปิด modal
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    // รีเซ็ตตำแหน่งเลื่อนใน modal
    fsBody.scrollTop = 0;
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    // คืน snap กลับ
    viewer.style.scrollSnapType = prevSnap || "y mandatory";

    // กลับตำแหน่งเดิม
    viewer.scrollTop = lastScrollTop;
  }

  // เปิดเมื่อแตะรูปเมนู
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".pageImg");
    if (!img) return;
    openModal(img.getAttribute("src"));
  });

  // ปิด
  btnClose.addEventListener("click", closeModal);

  // แตะพื้นหลังมืดเพื่อปิด (คลิกนอก topbar/รูป)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC ปิด
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // Fullscreen API (ถ้ารองรับ)
  btnFs.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await modal.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (err) {
      // บาง browser ไม่อนุญาต—ไม่ต้องทำอะไร
    }
  });
})();
