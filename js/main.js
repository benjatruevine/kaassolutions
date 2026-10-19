/* ============================================================
    KAAS SOLUTIONS Uganda — main.js
    Classic script (works over http:// and file://), organised
    as small isolated modules.
    ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------
     Image fallback — a broken file never breaks the layout
     --------------------------------------------------------- */
  var FALLBACK_IMG =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">' +
        '<rect width="600" height="800" fill="#f5f8fa"/>' +
        '<text x="300" y="410" font-family="Inter,system-ui,Arial,sans-serif" font-size="24" letter-spacing="10" fill="#21ACE3" text-anchor="middle">KAAS SOLUTIONS</text>' +
        "</svg>"
    );

  document.addEventListener(
    "error",
    function (event) {
      var el = event.target;
      if (el && el.tagName === "IMG" && el.src !== FALLBACK_IMG) {
        el.src = FALLBACK_IMG;
        el.classList.add("img-failed");
      }
    },
    true
  );

  /* ---------------------------------------------------------
     Theme toggle (light / dark)
     --------------------------------------------------------- */
  (function themeModule() {
    var root = document.documentElement;
    var toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    function syncLabel() {
      var isDark = root.getAttribute("data-theme") === "dark";
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    }

    toggle.addEventListener("click", function () {
      var next =
        root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("kaas-theme", next);
      } catch (e) { /* private mode */ }
      syncLabel();
    });

    syncLabel();
  })();

  /* ---------------------------------------------------------
     Sticky header — solid once the page is scrolled
     --------------------------------------------------------- */
  (function headerModule() {
    var header = document.getElementById("siteHeader");
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle("is-solid", window.scrollY > 40);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  })();

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  (function menuModule() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("primaryNav");
    var header = document.getElementById("siteHeader");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setOpen(false);
      }
    });

    window.matchMedia("(min-width: 921px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  })();

  /* ---------------------------------------------------------
     Hero slider — crossfade carousel
     --------------------------------------------------------- */
  (function heroModule() {
    var wrap = document.getElementById("heroSlides");
    var prevBtn = document.getElementById("heroPrev");
    var nextBtn = document.getElementById("heroNext");
    var dotsWrap = document.getElementById("heroDots");
    var status = document.getElementById("heroStatus");
    var hero = document.querySelector(".hero");
    var controls = document.querySelector(".hero__controls");
    if (!wrap || !prevBtn || !nextBtn || !dotsWrap || !hero) return;

    var slides = Array.prototype.slice.call(wrap.querySelectorAll(".hero__slide"));
    if (!slides.length) return;

    var index = slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    });
    if (index < 0) index = 0;

    var timer = null;
    var hoverPaused = false;
    var focusPaused = false;
    var INTERVAL = 6000;

    // Build accessible dots
    var dots = slides.map(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to slide " + (i + 1) + " of " + slides.length);
      dot.addEventListener("click", function () {
        goTo(i, true);
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function render(announce) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-selected", String(i === index));
        dot.tabIndex = i === index ? 0 : -1;
      });
      if (announce && status) {
        status.textContent = "Slide " + (index + 1) + " of " + slides.length;
      }
    }

    function goTo(i, announce) {
      index = (i + slides.length) % slides.length;
      render(announce);
      restart();
    }

    function next(announce) {
      goTo(index + 1, announce);
    }

    function prev(announce) {
      goTo(index - 1, announce);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function shouldPlay() {
      return !reduceMotion.matches && !hoverPaused && !focusPaused && slides.length > 1;
    }

    function start() {
      stop();
      if (!shouldPlay()) return;
      timer = window.setInterval(function () {
        next(false);
      }, INTERVAL);
    }

    function restart() {
      stop();
      start();
    }

    prevBtn.addEventListener("click", function () {
      prev(true);
    });
    nextBtn.addEventListener("click", function () {
      next(true);
    });

    // Hovering the control strip pauses autoplay; the rest of the hero
    // stays live so the carousel keeps breathing while the copy is read.
    var hoverTarget = controls || hero;
    hoverTarget.addEventListener("mouseenter", function () {
      hoverPaused = true;
      stop();
    });
    hoverTarget.addEventListener("mouseleave", function () {
      hoverPaused = false;
      start();
    });
    hero.addEventListener("focusin", function () {
      focusPaused = true;
      stop();
    });
    hero.addEventListener("focusout", function (event) {
      if (!hero.contains(event.relatedTarget)) {
        focusPaused = false;
        start();
      }
    });

    hero.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        prev(true);
      } else if (event.key === "ArrowRight") {
        next(true);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", function () {
        reduceMotion.matches ? stop() : start();
      });
    }

    render(false);
    start();
  })();

  /* ---------------------------------------------------------
     Collection filters (+ deep links from category cards)
     --------------------------------------------------------- */
  (function filterModule() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
    var products = Array.prototype.slice.call(document.querySelectorAll(".product"));
    if (!buttons.length || !products.length) return;

    function apply(filter) {
      buttons.forEach(function (btn) {
        var active = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      products.forEach(function (product) {
        var match =
          filter === "all" || product.getAttribute("data-category") === filter;
        product.classList.toggle("is-hidden", !match);
        if (match) product.classList.add("is-visible");
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-filter"));
      });
    });

    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-filter-link]");
      if (!link) return;
      apply(link.getAttribute("data-filter-link"));
    });

    apply("all");
  })();

  /* ---------------------------------------------------------
     Booking form → composed WhatsApp enquiry
     --------------------------------------------------------- */
  (function bookingModule() {
    var form = document.getElementById("bookingForm");
    if (!form) return;

    var status = document.getElementById("bookingStatus");
    // TODO: Replace with verified KAAS SOLUTIONS WhatsApp number
    var WA_NUMBER = "XXXXXXXXXXXX";

    var fields = [
      { id: "bkName", errorId: "bkNameError", test: function (v) { return v.trim().length > 1; } },
      { id: "bkPhone", errorId: "bkPhoneError", test: function (v) { return v.trim().length >= 8; } },
      { id: "bkService", errorId: "bkServiceError", test: function (v) { return v !== ""; } }
    ];

    var bkEmail = document.getElementById("bkEmail");
    if (bkEmail) {
      bkEmail.addEventListener("input", function () {
        if (!bkEmail.value) {
          bkEmail.removeAttribute("aria-invalid");
          var e = document.getElementById("bkEmailError");
          if (e) e.hidden = true;
          return;
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bkEmail.value.trim())) {
          bkEmail.removeAttribute("aria-invalid");
          var e2 = document.getElementById("bkEmailError");
          if (e2) e2.hidden = true;
        } else {
          bkEmail.setAttribute("aria-invalid", "true");
          var e3 = document.getElementById("bkEmailError");
          if (e3) e3.hidden = false;
        }
      });
    }

    var bkNotes = document.getElementById("bkNotes");
    if (bkNotes) {
      bkNotes.addEventListener("input", function () {
        if (bkNotes.value.trim().length > 0) {
          bkNotes.removeAttribute("aria-invalid");
          var e = document.getElementById("bkNotesError");
          if (e) e.hidden = true;
        }
      });
    }

    fields.forEach(function (field) {
      var input = document.getElementById(field.id);
      if (!input) return;
      input.addEventListener("input", function () {
        if (field.test(input.value)) {
          input.removeAttribute("aria-invalid");
          var error = document.getElementById(field.errorId);
          if (error) error.hidden = true;
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      var data = {};

      fields.forEach(function (field) {
        var input = document.getElementById(field.id);
        if (!input) return;
        var value = input.value;
        data[field.id] = value;
        var valid = field.test(value);
        input.setAttribute("aria-invalid", String(!valid));
        var error = document.getElementById(field.errorId);
        if (error) error.hidden = valid;
        if (!valid && !firstInvalid) firstInvalid = input;
      });

      if (bkEmail && bkEmail.value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bkEmail.value.trim())) {
          bkEmail.setAttribute("aria-invalid", "true");
          var e = document.getElementById("bkEmailError");
          if (e) e.hidden = false;
          if (!firstInvalid) firstInvalid = bkEmail;
        }
      }

      if (bkNotes && bkNotes.value.trim().length === 0) {
        bkNotes.setAttribute("aria-invalid", "true");
        var e2 = document.getElementById("bkNotesError");
        if (e2) e2.hidden = false;
        if (!firstInvalid) firstInvalid = bkNotes;
      }

      if (firstInvalid) {
        if (status) status.textContent = "Please complete the required fields.";
        firstInvalid.focus();
        return;
      }

      var prop = (document.getElementById("bkProperty") || {}).value || "";
      var notesVal = (bkNotes || {}).value || "";
      var message =
        "Hello KAAS SOLUTIONS, I would like a quote for your services." +
        "\n\nName: " + data.bkName.trim() +
        (bkEmail && bkEmail.value ? "\nEmail: " + bkEmail.value.trim() : "") +
        "\nPhone: " + data.bkPhone.trim() +
        "\nService: " + data.bkService +
        (prop ? "\nProperty Type: " + prop : "") +
        (notesVal.trim() ? "\nMessage: " + notesVal.trim() : "");

      if (WA_NUMBER === "XXXXXXXXXXXX") {
        if (status) {
          status.textContent = "WhatsApp number not configured. Please see footer for configuration details.";
        }
        return;
      }

      if (status) {
        status.textContent = "Opening WhatsApp with your enquiry details…";
      }

      window.open(
        "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message),
        "_blank",
        "noopener"
      );
    });
  })();

  /* ---------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------- */
  (function revealModule() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    // Gentle stagger for siblings inside the same grid
    var groups = new Map();
    items.forEach(function (item) {
      var parent = item.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      var order = groups.get(parent);
      item.style.setProperty("--reveal-delay", order * 0.09 + "s");
      groups.set(parent, order + 1);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  })();

  /* ---------------------------------------------------------
     Active nav link highlighting
     --------------------------------------------------------- */
  (function navHighlightModule() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
    if (!links.length) return;

    var map = new Map();
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      var section = document.getElementById(id);
      if (section) map.set(section, link);
    });
    if (!map.size) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.removeAttribute("aria-current");
          });
          var active = map.get(entry.target);
          if (active) active.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    map.forEach(function (_, section) {
      observer.observe(section);
    });
  })();

  /* ---------------------------------------------------------
     Floating chat assistant (scripted, WhatsApp hand-off)
     --------------------------------------------------------- */
  (function chatModule() {
    var stack = document.getElementById("fabStack");
    var panel = document.getElementById("chatPanel");
    var toggle = document.getElementById("chatToggle");
    var closeBtn = document.getElementById("chatClose");
    var log = document.getElementById("chatLog");
    var chipsWrap = document.getElementById("chatChips");
    var form = document.getElementById("chatForm");
    var input = document.getElementById("chatInput");
    if (!stack || !panel || !toggle || !log || !form || !input) return;

    var WA =
      "#contact";

    var DEFAULT_CHIPS = [
      "What services do you offer?",
      "Home automation",
      "CCTV & Security",
      "Networking",
      "Get a quote"
    ];

    var KB = [
      {
        keys: ["hello", "hi ", "hey", "good morning", "good afternoon", "good evening"],
        text: "Hello and welcome to KAAS SOLUTIONS. I can help with our home automation, security, networking and technology solutions.",
        chips: ["What services do you offer?", "Get a quote"]
      },
      {
        keys: ["service", "services", "offer", "solutions", "what do you do"],
        text: "We offer home automation, system integration, CCTV & surveillance, networking solutions, electric fences, automatic gates & intercoms, biometric access control, and burglar alarms.",
        link: { label: "View all services", href: "#services" },
        chips: ["Get a quote", "Home automation"]
      },
      {
        keys: ["home", "automation", "smart home", "lighting", "switches"],
        text: "Our home automation solutions include smart home systems, intelligent lighting control, smart switches and connected devices.",
        link: { label: "Enquire about home automation", href: "#contact" },
        chips: ["CCTV & Security", "Get a quote"]
      },
      {
        keys: ["cctv", "camera", "surveillance", "security", "alarm", "burglar", "fence", "electric", "gate", "intercom", "biometric", "access"],
        text: "We provide CCTV, electric fences, automatic gates & intercoms, biometric access control, burglar alarms and integrated security solutions.",
        link: { label: "View our services", href: "#services" },
        chips: ["Networking", "Get a quote"]
      },
      {
        keys: ["network", "networking", "wifi", "cabling", "structured"],
        text: "Our networking solutions include network installation, Wi-Fi, structured cabling and reliable connectivity for homes and businesses.",
        link: { label: "Enquire now", href: "#contact" },
        chips: ["Get a quote", "What services do you offer?"]
      },
      {
        keys: ["quote", "enquire", "enquiry", "quote request", "price", "pricing", "cost"],
        text: "Get a customized quote for your project. Tell us about your requirements and we'll help you find the right solution.",
        link: { label: "Request a quote", href: "#contact" },
        chips: ["What services do you offer?", "CCTV & Security"]
      },
      {
        keys: ["contact", "whatsapp", "talk", "speak", "person", "team", "help", "uganda"],
        text: "KAAS SOLUTIONS is based in Uganda. Request a quote and we'll get back to you.",
        link: { label: "Contact us", href: "#contact" },
        chips: ["Get a quote", "What services do you offer?"]
      }
    ];

    var FALLBACK = {
      text: "I can help with our home automation, security, networking, and technology integration solutions. Request a quote to discuss your project needs.",
      link: { label: "Request a quote", href: "#contact" },
      chips: ["What services do you offer?", "Get a quote"]
    };

    var greeted = false;

    function addMsg(kind, text, link) {
      var bubble = document.createElement("div");
      bubble.className = "chat__msg chat__msg--" + kind;

      var p = document.createElement("p");
      p.textContent = text;
      bubble.appendChild(p);

      if (link) {
        var a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.label;
        if (link.href.charAt(0) !== "#") {
          a.target = "_blank";
          a.rel = "noopener";
        }
        bubble.appendChild(a);
      }

      log.appendChild(bubble);
      log.scrollTop = log.scrollHeight;
    }

    function renderChips(list) {
      chipsWrap.innerHTML = "";
      (list || DEFAULT_CHIPS).forEach(function (label) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chat__chip";
        chip.textContent = label;
        chip.addEventListener("click", function () {
          answer(label);
        });
        chipsWrap.appendChild(chip);
      });
    }

    function match(inputText) {
      var q = inputText.toLowerCase();
      for (var i = 0; i < KB.length; i++) {
        for (var j = 0; j < KB[i].keys.length; j++) {
          if (q.indexOf(KB[i].keys[j]) !== -1) return KB[i];
        }
      }
      return FALLBACK;
    }

    function answer(text) {
      addMsg("user", text);
      var reply = match(text);
      window.setTimeout(function () {
        addMsg("bot", reply.text, reply.link);
        renderChips(reply.chips);
      }, reduceMotion.matches ? 0 : 350);
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close chat assistant" : "Open chat assistant");
      panel.classList.toggle("is-open", open);
      if (open) {
        if (!greeted) {
          greeted = true;
          addMsg(
            "bot",
            "Welcome to KAAS SOLUTIONS. Ask me about our smart home, security, networking and technology solutions."
          );
          renderChips();
        }
        window.setTimeout(function () {
          input.focus();
        }, 60);
      } else {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    closeBtn.addEventListener("click", function () {
      setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !stack.contains(event.target)
      ) {
        setOpen(false);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      answer(text);
    });

    // WhatsApp FAB closes the panel so both channels never overlap
    var waFab = stack.querySelector(".fab--wa");
    if (waFab) {
      waFab.addEventListener("click", function () {
        if (toggle.getAttribute("aria-expanded") === "true") setOpen(false);
      });
    }
  })();

  /* ---------------------------------------------------------
     Dynamic copyright year
     --------------------------------------------------------- */
  (function yearModule() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
