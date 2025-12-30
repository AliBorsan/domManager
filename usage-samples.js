/* global $d, domMan */

(function () {
	"use strict";

	function log(...args) {
		const out = document.getElementById("out");
		const line = args
			.map((a) => {
				try {
					return typeof a === "string" ? a : JSON.stringify(a, null, 2);
				} catch {
					return String(a);
				}
			})
			.join(" ");

		if (out) {
			out.textContent += line + "\n";
		}
		console.log("[domMan demo]", ...args);
	}

	// Ensure library is present
	if (typeof $d !== "function") {
		console.error("domMan ($d) is not loaded");
		return;
	}

	$d(document).ready(function () {
		log("domMan version:", $d().domMan);

		// --- Basics: selection, chaining, content ---
		$d("#box")
			.text("Box (updated)")
			.addClass("is-ready")
			.css("borderColor", "#999");

		// CSS via Proxy (camelCase works)
		$d("#box").backgroundColor("#f7f7f7");
		$d("#box").color("#333");

		log("box text:", $d("#box").text());
		log("box backgroundColor (computed):", $d("#box").backgroundColor());

		// --- Events: Proxy collision behavior (.click(fn) binds, .click() triggers) ---
		$d("#btn").click(function () {
			$d("#box").toggleClass("clicked");
			log("#btn clicked; box hasClass(clicked)=", $d("#box").hasClass("clicked"));
		});

		$d("#btn-trigger").click(function () {
			log("Triggering #btn click via $d('#btn').click()...");
			$d("#btn").click();
		});

		// --- Data store (WeakMap) + localStorage helpers ---
		$d("#box").data("greeting", "hello");
		log("data('greeting'):", $d("#box").data("greeting"));

		$d().setLocalStorage("domman-demo", { when: Date.now(), ok: true });
		log("localStorage domman-demo:", $d().getLocalStorage("domman-demo"));

		// --- Delegation (works for existing + dynamically added) ---
		let nextId = 3;
		$d("#list-root").delegate(".item", "click", function (e) {
			log("delegated click:", {
				id: this.getAttribute("data-id"),
				text: this.textContent,
				targetTag: e.target && e.target.tagName,
			});
			$d(this).toggleClass("active");
		});

		// --- Namespaced delegated events ---
		(function setupNamespacedDemo() {
			const nsRoot = document.getElementById("ns-root");
			if (!nsRoot) return;

			let menuCount = 0;
			let otherCount = 0;

			function bindMenu() {
				$d("#ns-root").on("click.menu", "li", function (e) {
					menuCount += 1;
					log("click.menu (delegated)", {
						count: menuCount,
						id: this.getAttribute("data-id"),
						targetTag: e.target && e.target.tagName,
					});
				});
			}

			// Always bind an "other" namespace so you can see that off('.menu') doesn't remove it.
			$d("#ns-root").on("click.other", "li", function (e) {
				otherCount += 1;
				log("click.other (delegated)", {
					count: otherCount,
					id: this.getAttribute("data-id"),
					targetTag: e.target && e.target.tagName,
				});
			});

			bindMenu();
			log("Namespaced demo ready: click.menu + click.other bound");

			$d("#ns-off-menu").click(function () {
				$d("#ns-root").off(".menu");
				log("Called off('.menu') on #ns-root (should keep .other)");
			});

			$d("#ns-bind-menu").click(function () {
				bindMenu();
				log("Bound click.menu again (may add another handler)");
			});
		})();

		$d("#add-item").click(function () {
			const btn = $d("body").createElement("button", {
				className: "item",
				type: "button",
				"data-id": String(nextId),
			});
			btn.textContent = `Item ${nextId}`;
			nextId += 1;

			// Append to list root
			$d("#list-root").append(btn);
			log("added dynamic item");
		});

		// --- DOM creation + append/prepend ---
		const note = $d("body").createElement("div", {
			className: "note",
			style: { marginTop: "10px", padding: "8px", border: "1px dashed #ccc" },
		});
		note.textContent = "Created via createElement + appended via domMan";
		$d("#box").after(note);

		// --- Form serialization (if available) ---
		$d("#form-serialize").click(function () {
			const form = document.getElementById("demo-form");
			try {
				if (typeof $d(form).serializeForm === "function") {
					const serialized = $d(form).serializeForm("object");
					log("serializeForm(object):", serialized);
				} else {
					log("serializeForm not found on this build");
				}
			} catch (err) {
				log("serializeForm threw:", String(err));
			}
		});

		// --- AJAX demo (safe/optional): only run if user clicks trigger to avoid noise ---
		// Example endpoint may be blocked by CORS/file://, so keep it opt-in.
		const ajaxHint = $d("body").createElement("button", {
			id: "ajax-demo",
			type: "button",
			style: { marginTop: "12px" },
		});
		ajaxHint.textContent = "Run AJAX demo (GET /json)";
		$d("#out").before(ajaxHint);

		$d("#ajax-demo").click(function () {
			const url = "https://httpbin.org/json";
			log("ajax GET:", url);
			$d()
				.get(url)
				.then((res) => {
					log("ajax response keys:", res && Object.keys(res));
				})
				.catch((err) => {
					log("ajax error (likely CORS/file://):", err);
				});
		});

		log("Ready. Try clicking buttons above.");

		// --- Traversal & Each ---
		$d("#run-each").click(function () {
			try {
				const found = $d("#cards").find(".card");
				if (!found || typeof found.each !== "function") {
					log("find()/each() not available on this build");
					return;
				}

				log("Running find('.card').each(...) over #cards");
				found.each(function (i, el) {
					// `this` is the element; `el` should be the same
					const idx = (el && el.getAttribute && el.getAttribute("data-i")) || "?";
					$d(this).toggleClass("highlight");
					// Quick visual cue
					$d(this).backgroundColor(i % 2 === 0 ? "#eef" : "#efe");
					log("card", idx, "each index=", i, "this===el=", this === el);
				});
			} catch (err) {
				log("find/each threw:", String(err));
			}
		});

		// --- Animation ---
		$d("#run-animate").click(function () {
			try {
				const api = $d("#anim-box");
				if (!api || typeof api.animate !== "function") {
					log("animate() not available on this build");
					return;
				}

				log("Running animate({ opacity, transform }, 400, 'ease')");
				api.animate(
					{ opacity: "0.35", transform: "translateX(18px)" },
					400,
					"ease",
					function () {
						log("animate callback fired; opacity now:", $d(this).opacity && $d(this).opacity());
					}
				);
			} catch (err) {
				log("animate threw:", String(err));
			}
		});

		$d("#reset-animate").click(function () {
			$d("#anim-box")
				.opacity("1")
				.transform("translateX(0px)")
				.backgroundColor("")
				.color("");
			log("animation styles reset");
		});

		// --- noConflict ---
		function runNoConflict(deep) {
			try {
				if (!window.domMan || typeof window.domMan.noConflict !== "function") {
					log("noConflict() not available on this build");
					return;
				}

				const before = { $d: window.$d, domMan: window.domMan };
				const returned = window.domMan.noConflict(!!deep);
				const after = { $d: window.$d, domMan: window.domMan };

				log("noConflict(" + (!!deep) + ") returned function:", typeof returned);
				log("globals before:", {
					"typeof window.$d": typeof before.$d,
					"typeof window.domMan": typeof before.domMan,
				});
				log("globals after:", {
					"typeof window.$d": typeof after.$d,
					"typeof window.domMan": typeof after.domMan,
				});

				// Keep the demo working: restore globals back to the active domMan
				window.$d = before.$d;
				window.domMan = before.domMan;
				log("Restored globals so the demo keeps working.");
			} catch (err) {
				log("noConflict threw:", String(err));
			}
		}

		$d("#run-noconflict").click(function () {
			runNoConflict(false);
		});
		$d("#run-noconflict-deep").click(function () {
			runNoConflict(true);
		});
	});
})();
