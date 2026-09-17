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

  /* ---------- Emblem hero gate ---------- */
  var gate = document.querySelector(".emblem-gate");
  if (gate) {
    var dismissed = false;
    var dismiss = function () {
      if (dismissed) return;
      dismissed = true;
      gate.classList.add("is-dismissed");
      gate.setAttribute("aria-hidden", "true");
    };

    gate.addEventListener("click", dismiss);
    gate.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        dismiss();
      }
    });

    var onScroll = function () {
      if (window.scrollY > 40) dismiss();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Auto-dismiss backstop once the CSS hold/fade animation finishes,
       so the section is fully interactive even if the class never lands. */
    var holdTime = reduceMotionQuery.matches ? 2300 : 4500;
    window.setTimeout(dismiss, holdTime);
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
})();
