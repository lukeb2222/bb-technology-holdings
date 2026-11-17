(function () {
  "use strict";

  var root = document.documentElement;

  try {
    init();
  } catch (error) {
    // If anything fails, drop the motion classes so the page is plainly visible.
    root.classList.remove("js");
    throw error;
  }

  function init() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    }

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    /* ---------- Portfolio rows, built from js/brands.js ---------- */
    var list = document.getElementById("portfolio-grid");
    var count = document.getElementById("portfolio-count");
    var brands = window.BBTH_BRANDS || [];

    if (list) {
      brands.forEach(function (brand, index) {
        var item = el("li", "brand");
        item.setAttribute("data-reveal", "");
        item.style.setProperty("--i", index);

        var row = el(brand.url ? "a" : "div", "brand__link");
        if (brand.url) {
          row.href = brand.url;
          row.rel = "noopener";
        }

        var num = el("span", "brand__index", pad(index + 1));
        num.setAttribute("aria-hidden", "true");
        row.appendChild(num);

        var main = el("div", "brand__main");
        main.appendChild(el("h3", "brand__name", brand.name));
        main.appendChild(el("p", "brand__desc", brand.description));
        row.appendChild(main);

        row.appendChild(el("p", "eyebrow brand__tag", brand.category));

        var cta = el("div", "brand__cta");
        if (brand.url) {
          var arrow = el("span", "brand__arrow");
          arrow.setAttribute("aria-hidden", "true");
          arrow.appendChild(el("span", "", "→"));
          cta.appendChild(arrow);
          cta.appendChild(el("span", "visually-hidden", "Visit site"));
        } else {
          cta.appendChild(el("p", "placeholder", "Placeholder: website URL"));
        }
        row.appendChild(cta);

        item.appendChild(row);
        list.appendChild(item);
      });
    }

    if (count && brands.length) {
      count.textContent = pad(brands.length) + (brands.length === 1 ? " brand" : " brands");
    }

    /* ---------- Split text into words ---------- */
    function splitWords(node, wrapInner) {
      var words = node.textContent.trim().split(/\s+/);
      node.textContent = "";
      var spans = [];
      words.forEach(function (word, index) {
        var outer = el("span", wrapInner ? "w" : "sw");
        if (wrapInner) {
          var inner = el("span", "", word);
          inner.style.setProperty("--w", index);
          outer.appendChild(inner);
        } else {
          outer.textContent = word;
        }
        node.appendChild(outer);
        if (index < words.length - 1) node.appendChild(document.createTextNode(" "));
        spans.push(outer);
      });
      return spans;
    }

    document.querySelectorAll("[data-split]").forEach(function (node) {
      splitWords(node, true);
    });

    var statement = document.querySelector("[data-scroll-words]");
    var statementWords = statement && !reduceMotion ? splitWords(statement, false) : [];

    /* ---------- Hero load sequence ---------- */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add("is-loaded");
      });
    });

    /* ---------- Scroll reveals ---------- */
    var revealEls = document.querySelectorAll("[data-reveal]");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (node) {
        node.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
      );
      revealEls.forEach(function (node) {
        observer.observe(node);
      });
    }

    /* ---------- Scroll-linked effects ---------- */
    var header = document.querySelector(".site-header");
    var heroMark = document.querySelector(".hero__mark");
    var wideScreen = window.matchMedia("(min-width: 900px)");
    var lastY = window.scrollY;
    var ticking = false;

    function clamp(value) {
      return Math.max(0, Math.min(1, value));
    }

    function onFrame() {
      ticking = false;
      var y = window.scrollY;
      var vh = window.innerHeight;

      // Header: solid once scrolled; hides on the way down, returns on the way up.
      if (header) {
        var open = header.classList.contains("is-open");
        header.classList.toggle("is-scrolled", y > 24);
        if (!open && y > vh * 0.6 && y > lastY + 4) {
          header.classList.add("is-hidden");
        } else if (y < lastY - 4 || y <= vh * 0.6) {
          header.classList.remove("is-hidden");
        }
      }

      if (!reduceMotion) {
        // Hero monogram drifts slightly slower than the page.
        if (heroMark && y < vh * 1.2) {
          heroMark.style.transform = wideScreen.matches
            ? "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)"
            : "";
        }

        // Statement lights up word by word.
        if (statementWords.length) {
          var rect = statement.getBoundingClientRect();
          var progress = clamp((vh * 0.88 - rect.top) / (vh * 0.5 + rect.height * 0.6));
          var lit = Math.round(progress * statementWords.length);
          statementWords.forEach(function (word, index) {
            word.classList.toggle("is-lit", index < lit);
          });
        }
      }

      lastY = y;
    }

    function requestFrame() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onFrame);
      }
    }

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    onFrame();

    /* ---------- Mobile navigation ---------- */
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");

    function setNav(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-open", open);
    }

    if (toggle && nav && header) {
      toggle.addEventListener("click", function () {
        setNav(toggle.getAttribute("aria-expanded") !== "true");
      });
      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) setNav(false);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
          setNav(false);
          toggle.focus();
        }
      });
      // Keep the header in view while keyboard focus is inside it.
      header.addEventListener("focusin", function () {
        header.classList.remove("is-hidden");
      });
    }

    /* ---------- Private founder names and bios ----------
       They are AES-encrypted in js/bios.js; the access code is the key
       and is never stored in the site's files. */
    var gate = document.getElementById("bio-gate");
    var bioData = window.BBTH_BIOS;

    function fromBase64(text) {
      var raw = atob(text);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return bytes;
    }

    function decryptBios(code) {
      var subtle = window.crypto.subtle;
      return subtle
        .importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"])
        .then(function (material) {
          return subtle.deriveKey(
            {
              name: "PBKDF2",
              hash: "SHA-256",
              salt: fromBase64(bioData.salt),
              iterations: bioData.iterations,
            },
            material,
            { name: "AES-CBC", length: 256 },
            false,
            ["decrypt"]
          );
        })
        .then(function (key) {
          return subtle.decrypt(
            { name: "AES-CBC", iv: fromBase64(bioData.iv) },
            key,
            fromBase64(bioData.data)
          );
        })
        .then(function (buffer) {
          return JSON.parse(new TextDecoder().decode(buffer));
        });
    }

    function showBios(data) {
      var list = document.querySelector(".founders");
      (data.founders || []).forEach(function (founder, index) {
        var card = list.querySelector('[data-founder="' + index + '"]');
        if (!card) return;
        card.querySelector("h3").textContent = founder.name;
        if (founder.role) card.querySelector(".eyebrow").textContent = founder.role;
        card.querySelector(".founder__bio").textContent = founder.bio;
      });
      list.hidden = false;
      gate.hidden = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          list.classList.add("is-unlocked");
        });
      });
    }

    if (gate && bioData && window.crypto && window.crypto.subtle) {
      var codeInput = document.getElementById("bio-code");
      var bioStatus = document.getElementById("bio-status");
      var saved = null;
      try {
        saved = sessionStorage.getItem("bbth-bio-code");
      } catch (e) {}

      if (saved) {
        decryptBios(saved).then(showBios, function () {});
      }

      gate.addEventListener("submit", function (event) {
        event.preventDefault();
        var code = codeInput.value;
        if (!code) return;
        bioStatus.textContent = "Checking\u2026";
        bioStatus.dataset.state = "";
        decryptBios(code).then(
          function (bios) {
            try {
              sessionStorage.setItem("bbth-bio-code", code);
            } catch (e) {}
            showBios(bios);
          },
          function () {
            bioStatus.textContent = "That access code is not correct.";
            bioStatus.dataset.state = "error";
            codeInput.select();
          }
        );
      });
    }

    /* ---------- Footer year ---------- */
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    /* ---------- Contact form (Formspree) ---------- */
    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");

    if (form && status) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
          status.textContent =
            "This form is not connected yet. Add a Formspree form ID to the form action in index.html.";
          status.dataset.state = "error";
          return;
        }

        var button = form.querySelector("button[type=submit]");
        button.disabled = true;
        status.textContent = "Sending…";
        status.dataset.state = "";

        fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        })
          .then(function (response) {
            if (!response.ok) throw new Error("Request failed");
            form.reset();
            status.textContent = "Thank you. Your message has been sent.";
            status.dataset.state = "success";
          })
          .catch(function () {
            status.textContent =
              "Something went wrong. Please try again, or email us directly.";
            status.dataset.state = "error";
          })
          .then(function () {
            button.disabled = false;
          });
      });
    }
  }
})();
