(function () {
  "use strict";

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Fullscreen logo intro ---------- */
  var intro = document.getElementById("intro");
  if (intro) {
    if (reduceMotionQuery.matches) {
      /* Reduced motion: skip straight to the hero, no fade. */
      intro.classList.add("is-dismissed");
      intro.setAttribute("aria-hidden", "true");
    } else {
      var dismissed = false;
      document.body.classList.add("intro-active");
      intro.focus({ preventScroll: true });

      var dismiss = function () {
        if (dismissed) return;
        dismissed = true;
        intro.classList.add("is-dismissed");
        intro.setAttribute("aria-hidden", "true");
        document.body.classList.remove("intro-active");
        ["wheel", "touchmove", "keydown"].forEach(function (evt) {
          window.removeEventListener(evt, dismiss);
        });
      };

      intro.addEventListener("click", dismiss);
      /* Body scroll is locked while the intro shows, so wheel/touch/keys stand in for "scroll". */
      window.addEventListener("wheel", dismiss, { passive: true });
      window.addEventListener("touchmove", dismiss, { passive: true });
      window.addEventListener("keydown", function (e) {
        if (["Enter", " ", "Spacebar", "ArrowDown", "PageDown", "End"].indexOf(e.key) !== -1) {
          if (e.key === " " || e.key === "ArrowDown" || e.key === "PageDown") e.preventDefault();
          dismiss();
        }
      });
    }
  }

  /* ---------- Accessible accordion ---------- */
  var triggers = document.querySelectorAll(".accordion-trigger");
  triggers.forEach(function (trigger) {
    var panelId = trigger.getAttribute("aria-controls");
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var inner = panel.querySelector(".accordion-panel-inner");

    var setState = function (open) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("data-open", open ? "true" : "false");
      if (open) {
        panel.style.maxHeight = inner.offsetHeight + "px";
      } else {
        panel.style.maxHeight = "0px";
      }
    };

    trigger.addEventListener("click", function () {
      var isOpen = trigger.getAttribute("aria-expanded") === "true";
      setState(!isOpen);
    });

    /* Keep open panels correctly sized on resize/orientation change. */
    window.addEventListener("resize", function () {
      if (trigger.getAttribute("aria-expanded") === "true") {
        panel.style.maxHeight = inner.offsetHeight + "px";
      }
    });
  });

  /* ---------- Parallax texture behind lookbook ---------- */
  var farLayer = document.querySelector(".parallax-layer.layer-far");
  var nearLayer = document.querySelector(".parallax-layer.layer-near");
  var stage = document.querySelector(".parallax-stage");

  if (stage && (farLayer || nearLayer) && !reduceMotionQuery.matches) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = stage.getBoundingClientRect();
      var progress = -rect.top;
      if (farLayer) farLayer.style.transform = "translate3d(0, " + (progress * 0.06) + "px, 0)";
      if (nearLayer) nearLayer.style.transform = "translate3d(0, " + (progress * 0.14) + "px, 0)";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- Lookbook carousel (desktop only; grid on mobile) ---------- */
  var desktopQuery = window.matchMedia("(min-width: 901px)");
  var chevron = function (dir) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="' +
      (dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7") + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  document.querySelectorAll(".card-grid").forEach(function (track) {
    var cards = Array.prototype.slice.call(track.querySelectorAll(".lookbook-card"));
    if (!cards.length) return;

    var controls = document.createElement("div");
    controls.className = "carousel-controls";
    controls.innerHTML =
      '<button type="button" class="carousel-btn" data-dir="-1" aria-label="Previous look">' + chevron(-1) + "</button>" +
      '<button type="button" class="carousel-btn" data-dir="1" aria-label="Next look">' + chevron(1) + "</button>";
    track.parentNode.insertBefore(controls, track.nextSibling);

    var centeredIndex = function () {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (card, i) {
        var d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
        if (d < bestDist) { best = i; bestDist = d; }
      });
      return best;
    };

    /* The centred card's description rolls open beneath it; the rest close. */
    var current = -1;
    var sync = function () {
      if (!desktopQuery.matches) return;
      var idx = centeredIndex();
      if (idx === current) return;
      current = idx;
      cards.forEach(function (card, i) {
        card.classList.toggle("is-centered", i === idx);
        var trig = card.querySelector(".accordion-trigger");
        var wantOpen = i === idx;
        if (trig && (trig.getAttribute("aria-expanded") === "true") !== wantOpen) trig.click();
      });
    };

    var raf = false;
    track.addEventListener("scroll", function () {
      if (raf) return;
      raf = true;
      window.requestAnimationFrame(function () { raf = false; sync(); });
    }, { passive: true });

    controls.addEventListener("click", function (e) {
      var btn = e.target.closest(".carousel-btn");
      if (!btn) return;
      var next = Math.max(0, Math.min(cards.length - 1, centeredIndex() + parseInt(btn.dataset.dir, 10)));
      var card = cards[next];
      track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 });
    });

    track.addEventListener("keydown", function (e) {
      if (!desktopQuery.matches || e.target.closest("button, a")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        controls.querySelector('[data-dir="' + (e.key === "ArrowRight" ? 1 : -1) + '"]').click();
      }
    });

    /* Mouse drag-to-swipe (touch and trackpads already scroll natively). */
    var startX = 0, startLeft = 0, dragging = false, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || !desktopQuery.matches || e.target.closest("button, a")) return;
      dragging = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        track.classList.remove("is-dragging");
        var card = cards[centeredIndex()];
        track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2 });
      }
    });

    var onBreakpoint = function () {
      current = -1;
      if (desktopQuery.matches) {
        var first = cards[0];
        track.scrollLeft = first.offsetLeft + first.offsetWidth / 2 - track.clientWidth / 2;
        window.requestAnimationFrame(sync);
      } else {
        cards.forEach(function (c) { c.classList.remove("is-centered"); });
      }
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onBreakpoint);
    else desktopQuery.addListener(onBreakpoint);
    window.addEventListener("load", onBreakpoint);
    onBreakpoint();
  });

  /* ---------- Flip-book ---------- */
  var book = document.getElementById("flipbook");
  if (book) {
    var cover = book.querySelector(".book-cover");
    var reader = document.getElementById("book-reader");
    var photo = reader.querySelector(".book-photo");
    var pages = Array.prototype.slice.call(reader.querySelectorAll(".book-page"));
    var counter = reader.querySelector(".pc-current");
    var closeBtn = reader.querySelector(".book-close");
    var total = pages.length;
    var page = 0;

    var show = function (n) {
      page = (n + total) % total;
      pages.forEach(function (p, i) { p.hidden = i !== page; });
      counter.textContent = ("0" + (page + 1)).slice(-2);
      photo.setAttribute("aria-label", "Turn the page (page " + (page + 1) + " of " + total + ")");
      photo.classList.remove("is-turning");
      void photo.offsetWidth; /* restart the cross-fade */
      photo.classList.add("is-turning");
    };

    var open = function () {
      book.dataset.state = "open";
      cover.setAttribute("aria-expanded", "true");
      reader.hidden = false;
      show(0);
      photo.focus({ preventScroll: true });
    };
    var close = function () {
      book.dataset.state = "closed";
      cover.setAttribute("aria-expanded", "false");
      reader.hidden = true;
      cover.focus({ preventScroll: true });
    };

    cover.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    photo.addEventListener("click", function () { show(page + 1); });
    reader.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(page + 1);
      else if (e.key === "ArrowLeft") show(page - 1);
      else if (e.key === "Escape") close();
    });
  }
})();
