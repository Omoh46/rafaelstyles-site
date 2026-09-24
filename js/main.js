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
    /* Desktop (>=901px): layer-far's background is CSS `background-attachment: fixed` to the
       viewport, so it already stays put as the page scrolls. Translating the element on top of
       that would fight the fixed background and jitter, so the JS transform is skipped there.
       Mobile keeps its tile background + this transform exactly as before. */
    var farLayerFixedQuery = window.matchMedia("(min-width: 901px)");
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = stage.getBoundingClientRect();
      var progress = -rect.top;
      if (farLayer) farLayer.style.transform = farLayerFixedQuery.matches ? "" : "translate3d(0, " + (progress * 0.06) + "px, 0)";
      if (nearLayer) nearLayer.style.transform = "translate3d(0, " + (progress * 0.14) + "px, 0)";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    /* Also re-run on resize so crossing the 901px breakpoint clears/reapplies the transform,
       rather than leaving a stale translate3d() fighting the newly (in)active fixed background. */
    window.addEventListener("resize", update);
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
    /* Arrows live in a wrapper so they can sit either side of the centred card. */
    var wrap = document.createElement("div");
    wrap.className = "carousel-wrap";
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
    wrap.appendChild(controls);

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

  /* ---------- Flip-book: 20 paired photo+text pages, sliding in from left/right ---------- */
  var book = document.getElementById("flipbook");
  if (book) {
    var cover = book.querySelector(".book-cover");
    var reader = document.getElementById("book-reader");
    var spread = document.getElementById("book-spread");
    var track = document.getElementById("book-track");
    var units = Array.prototype.slice.call(track.querySelectorAll(".book-unit"));
    var counter = reader.querySelector(".pc-current");
    var closeBtn = reader.querySelector(".book-close");
    var prevBtn = reader.querySelector(".book-nav-prev");
    var nextBtn = reader.querySelector(".book-nav-next");
    var navCurrent = reader.querySelector(".book-nav-current");
    var navTotal = reader.querySelector(".book-nav-total");
    var total = units.length;
    var page = 0;
    var animating = false;

    navTotal.textContent = ("0" + total).slice(-2);

    /* The turn-cue button used to carry this label; Next has taken over as the primary
       accessible "advance" control, so it now gets the dynamic page-position announcement. */
    var describe = function (p) {
      nextBtn.setAttribute("aria-label", "Next page (currently page " + (p + 1) + " of " + total + ")");
    };

    var settle = function (unit) {
      unit.classList.remove("is-turning", "is-under", "turn-fwd", "turn-back");
    };

    var closeUnitAccordion = function (unit) {
      var trigger = unit.querySelector(".accordion-trigger");
      if (!trigger || trigger.getAttribute("aria-expanded") !== "true") return;
      var panel = document.getElementById(trigger.getAttribute("aria-controls"));
      trigger.setAttribute("aria-expanded", "false");
      if (panel) {
        panel.setAttribute("data-open", "false");
        panel.style.maxHeight = "0px";
      }
    };

    /* dir: 1 = forward, -1 = backward. Only ONE of the two pages actually rotates in 3D
       (the "turning" one); the other sits flat underneath ("under") and is simply revealed
       once the turning page's hidden backface passes the 90deg mark. Forward turns the
       outgoing page away on its left edge; backward turns the incoming page back into place
       on its right edge — a mirrored motion, not the same animation played in reverse. */
    var show = function (n, dir) {
      if (animating || total < 2) return;
      var next = (n + total) % total;
      if (next === page) return;
      animating = true;

      var outgoing = units[page];
      var incoming = units[next];
      var turning = dir === 1 ? outgoing : incoming;
      var under = dir === 1 ? incoming : outgoing;
      var turnClass = dir === 1 ? "turn-fwd" : "turn-back";

      /* Big enough to hold whichever of the two pages is taller, so neither clips mid-turn. */
      track.style.height = Math.max(outgoing.scrollHeight, incoming.scrollHeight) + "px";

      incoming.hidden = false;
      under.classList.add("is-under");
      turning.classList.add("is-turning", turnClass);

      var finish = function () {
        outgoing.hidden = true;
        closeUnitAccordion(outgoing);
        settle(outgoing);
        settle(incoming);
        track.style.height = "";
        animating = false;
        turning.removeEventListener("animationend", finish);
      };

      if (reduceMotionQuery.matches) {
        /* CSS disables the animation entirely under reduced motion (see styles.css), so
           animationend never fires there — resolve immediately instead of hanging. */
        finish();
      } else {
        turning.addEventListener("animationend", finish);
      }

      page = next;
      counter.textContent = ("0" + (page + 1)).slice(-2);
      navCurrent.textContent = ("0" + (page + 1)).slice(-2);
      describe(page);
    };

    var open = function () {
      book.dataset.state = "open";
      cover.setAttribute("aria-expanded", "true");
      reader.hidden = false;
      page = 0;
      units.forEach(function (u, i) { u.hidden = i !== 0; settle(u); closeUnitAccordion(u); });
      track.style.height = "";
      counter.textContent = "01";
      navCurrent.textContent = "01";
      describe(0);
      /* Focus moves to Next, not cover: cover is hidden by the .flipbook[data-state="open"] rule
         the instant book.dataset.state flips above, so focusing it here would silently land
         nowhere. Next is now the primary accessible control that used to be the turn-cue button. */
      nextBtn.focus({ preventScroll: true });
    };
    var close = function () {
      book.dataset.state = "closed";
      cover.setAttribute("aria-expanded", "false");
      reader.hidden = true;
      cover.focus({ preventScroll: true });
    };

    cover.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    /* The book wraps at both ends (see the modulo in show() above), so Prev/Next are always
       active — neither is ever disabled on the first or last page. */
    prevBtn.addEventListener("click", function () { show(page - 1, -1); });
    nextBtn.addEventListener("click", function () { show(page + 1, 1); });
    /* Click anywhere else on the open spread also advances, matching the old "tap the photo to
       turn" feel, but real controls (the closing page's Reserve link, the Prev/Next buttons)
       handle their own clicks and never trigger a page turn underneath them. */
    spread.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      show(page + 1, 1);
    });
    /* Listens on the document (gated by open state) rather than just on `reader`, so arrow keys
       still work after a mouse click on the plain (non-focusable) spread background, which
       doesn't move keyboard focus into the reader the way clicking the turn button does. */
    document.addEventListener("keydown", function (e) {
      if (book.dataset.state !== "open") return;
      if (e.key === "ArrowRight") show(page + 1, 1);
      else if (e.key === "ArrowLeft") show(page - 1, -1);
      else if (e.key === "Escape") close();
    });
  }
})();
