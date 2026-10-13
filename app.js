const app = document.querySelector("#app");
const STORAGE = "optivia-routine-v1";
const empty = () => ({
  step: 0,
  answers: [],
  name: "",
  id: "OP-" + String(Math.floor(100000 + Math.random() * 900000)),
  joined: new Date().toISOString(),
  complete: false,
  objections: 0,
});
let state = empty();
try {
  const saved = JSON.parse(sessionStorage.getItem(STORAGE));
  if (
    saved &&
    Number.isInteger(saved.step) &&
    saved.step >= 0 &&
    saved.step <= 7 &&
    Array.isArray(saved.answers) &&
    saved.answers.every((x) => Number.isInteger(x) && x >= 0 && x < 4) &&
    typeof saved.name === "string"
  )
    state = { ...state, ...saved };
} catch {}
let timers = [];
const save = () => {
  try {
    sessionStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {}
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const go = (page) => {
  if (location.hash === "#" + page) render();
  else location.hash = page;
};
const button = (label, action, cls = "primary") =>
  `<button class="${cls}" data-action="${action}">${label}</button>`;
const date = () =>
  new Date(state.joined).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const questions = [
  [
    "When should we open your eyes?",
    [
      "06:00 · Before everyone else",
      "07:30 · With the first alarm",
      "09:00 · After one more snooze",
      "10:30 · Please do not rush me",
    ],
  ],
  ["How many meals interrupt your day?", ["One", "Two", "Three", "Four"]],
  [
    "Which small decision keeps waiting?",
    [
      "What to eat",
      "When to start working",
      "Who to reply to",
      "When to go to bed",
    ],
  ],
  [
    "An hour is suddenly free. What happens?",
    ["I rest", "I keep scrolling", "I talk to someone", "I cannot decide"],
  ],
];
const requestedWake = () => [360, 450, 540, 630][state.answers[0] ?? 1];
const wakeMinutes = () => [480, 360, 390, 420][state.answers[0] ?? 1];
const assignedMeals = () => [3, 3, 2, 2][state.answers[1] ?? 2];
function clock(offset) {
  const n = wakeMinutes() + offset;
  const m = n % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}${n >= 1440 ? " (+1 day)" : ""}`;
}
function profile() {
  return {
    name: state.name || "Citizen " + state.id,
    type: [
      "Nourishment guided",
      "Focus guided",
      "Connection guided",
      "Rest guided",
    ][state.answers[2] ?? 0],
    district: ["Garden", "Mountain", "River", "Garden"][state.answers[3] ?? 0],
    guidance: 100,
    rhythm: clock(0) + " – " + clock(960),
    meals: assignedMeals(),
  };
}
function assignmentSummary() {
  const requested = requestedWake();
  const time =
    String(Math.floor(requested / 60)).padStart(2, "0") +
    ":" +
    String(requested % 60).padStart(2, "0");
  return `<div class="routine-summary"><span>Wake-up: <s>${time}</s> ${clock(0)}</span><span>Meals: <s>${(state.answers[1] ?? 2) + 1}</s> ${assignedMeals()}</span><span>10 assignments · AI selected</span></div>`;
}
function buildSchedule() {
  const meals = assignedMeals(),
    avoid = state.answers[2] ?? 0,
    leisure = state.answers[3] ?? 0;
  return [
    [0, "Wake up", "Your requested alarm has been replaced. Get ready now."],
    [
      30,
      meals === 3 ? "Breakfast" : "Assigned preparation",
      meals === 3
        ? "An additional meal has been scheduled. Menu selected."
        : "Breakfast removed. Clothes and route selected.",
    ],
    [
      90,
      "Work / study",
      "Begin the assigned task. Personal priorities are deferred.",
    ],
    [330, "Lunch", "Meal time and menu are fixed by OPTIVIA."],
    [
      390,
      "Directed afternoon",
      [
        "Food planning is closed. Complete your assigned work.",
        "Your start time is fixed. Continue the assigned task.",
        "Personal replies are paused. Complete your assigned work.",
        "Rest is postponed until the assigned bedtime.",
      ][avoid],
    ],
    [
      570,
      "Return home",
      "Travel directly home. Unscheduled stops are excluded.",
    ],
    [690, "Dinner", "Your daily meal allocation is complete."],
    [
      750,
      [
        "Mandatory exercise",
        "Offline reading",
        "Individual quiet time",
        "Additional work block",
      ][leisure],
      [
        "Rest replaced with exercise. Your session is assigned.",
        "Scrolling replaced with reading. Your device is paused.",
        "Conversation replaced with time alone. Messages are muted.",
        "Your unplanned hour has been allocated to work.",
      ][leisure],
    ],
    [
      885,
      "Wind down",
      "Devices off. Tomorrow’s decisions are already settled.",
    ],
    [960, "Sleep", "Bedtime assigned. Your alarm cannot be revised here."],
  ];
}
function scheduleMarkup() {
  const rows = buildSchedule();
  return `<ol class="daily-schedule">${rows.map((r, i) => `<li><div class="schedule-time">${clock(r[0])}<span>– ${clock(rows[i + 1]?.[0] ?? 1440)}</span></div><div><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p></div></li>`).join("")}</ol>`;
}
function home() {
  return `<section class="particle-landing" aria-label="Welcome to the Republic of Optivia"><div class="particle-stage"><div class="lab-grid" aria-hidden="true"></div><div class="spectrum-wash" aria-hidden="true"></div><div class="lab-foot"><span class="lab-scroll">SCROLL TO TRANSITION</span></div><div class="crest-fallback crest-rotating" role="img" aria-label="Optivia national emblem"></div><div class="landing-reveal" inert><h1>Think less,<br><em>live better.</em></h1><button class="minimal-enter" data-action="begin">Enter</button></div><button class="skip-motion" type="button">Skip animation</button></div></section>`;
}

function registration() {
  if (state.complete) return documents();
  let body = "";
  if (state.step === 0) {
    body = `<div class="eyebrow">01 / 05</div><h1>What should we call you?</h1><form id="name-form"><input class="name-input" id="citizen-name" aria-label="Your name" name="name" maxlength="48" placeholder="Your name" value="${esc(state.name)}" autocomplete="given-name" required><button class="primary" type="submit">CONTINUE</button></form>`;
  } else if (state.step <= 4) {
    const q = questions[state.step - 1];
    body = `<div class="eyebrow">${String(state.step + 1).padStart(2, "0")} / 05</div><h1>${q[0]}</h1><div class="choices">${q[1].map((x, i) => `<button class="choice" data-answer="${i}"><span class="letter">${"ABCD"[i]}</span>${x}</button>`).join("")}</div>`;
  } else if (state.step === 5) {
    body = `<div class="analysis" role="status" aria-live="polite"><div class="analysis-orbit" aria-hidden="true"></div><div class="eyebrow">YOUR PERSONAL ASSISTANT</div><h2>Leave the rest to us, ${esc(state.name)}.</h2><p id="analysis-line">Aligning your waking hours…</p></div>`;
    [
      "Scheduling your meals…",
      "Removing the decisions you postpone…",
      "Arranging the hours you left open…",
    ].forEach((text, i) =>
      timers.push(
        setTimeout(
          () => {
            const el = document.querySelector("#analysis-line");
            if (el) el.textContent = text;
          },
          (i + 1) * 900,
        ),
      ),
    );
    timers.push(
      setTimeout(() => {
        state.step = 6;
        save();
        render();
      }, 3800),
    );
  } else {
    body = `<div class="eyebrow">ANALYSIS COMPLETE</div><h1>${esc(state.name)}, your day is ready.</h1>${assignmentSummary()}${scheduleMarkup()}<div class="schedule-verdict"><h2>Does this day work for you?</h2><div class="routine-actions">${button("YES, USE THIS SCHEDULE", "accept-day")}${button("NO, NOT FOR ME", "reject-day", "secondary")}</div></div><dialog id="reconsider-dialog" aria-labelledby="reconsider-title"><button class="dialog-close" type="button" aria-label="Close and return to schedule">×</button><div id="reconsider-content"></div></dialog>`;
  }
  return `<a class="survey-home" href="#home" aria-label="Return to Optivia home"><img src="assets/emblem-navy.svg" alt="Optivia national emblem" width="82" height="76"></a><section class="registration routine-registration fade"><div class="progress-label"><span>YOUR PERSONAL ASSISTANT</span></div><div class="progress-track"><span style="width:${Math.min(((state.step + 1) / 7) * 100, 100)}%"></span></div><div class="question">${body}</div></section>`;
}
function reconsider() {
  const dialog = document.querySelector("#reconsider-dialog");
  if (!dialog) return;
  const final = state.objections >= 2;
  document.querySelector("#reconsider-content").innerHTML =
    `<div class="eyebrow">${final ? "REVIEW COMPLETE" : "LET US RECONSIDER"}</div><h2 id="reconsider-title">${final ? "The recommendation remains." : "Think again, " + esc(state.name) + "."}</h2><p>${final ? "Your hesitation has been recorded. Your schedule has been kept exactly as it is." : "We used your answers to remove the decisions that slow you down. Are you sure you want to take them all back?"}</p><div class="routine-actions">${button(final ? "USE MY OPTIMIZED DAY" : "ACCEPT THE SCHEDULE", "accept-day")}${final ? "" : button("I STILL WANT A DIFFERENT DAY", "reconsider-day", "secondary")}</div>`;
  if (!dialog.open) dialog.showModal();
  document.querySelector("#reconsider-content button")?.focus();
}
function passportCode(p) {
  const name = p.name
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .trim()
    .replace(/ +/g, "<");
  return [
    "P<OPT" + name + "<<",
    state.id.replace("-", "") + "<OPT<<" + p.guidance + "<GUIDED",
  ].map((line) => line.slice(0, 44).padEnd(44, "<"));
}
function documents() {
  if (!state.complete) return registration();
  const p = profile();
  const f = (label, value, wide = false) =>
    `<div class="${wide ? "wide" : ""}"><small>${label}</small>${esc(value)}</div>`;
  return `<section class="page documents-page fade">${citizenNavigation("documents")}<div class="section-head"><div><h1 style="font-size:48px;margin-bottom:0">You belong here now.</h1></div>${button("PRINT DOCUMENTS", "print", "secondary no-print")}</div><p class="page-intro">Document ready</p><div class="document-grid"><section class="passport"><div class="passport-title"><div><h3>THE REPUBLIC OF OPTIVIA</h3><span>PASSPORT / CITIZEN IDENTITY</span></div><img class="passport-crest" src="assets/emblem-navy.svg" alt="Optivia emblem" width="54" height="48"></div><div class="passport-body"><div><div class="portrait"><svg viewBox="0 0 110 145" role="img" aria-label="Assigned neutral citizen portrait"><circle cx="55" cy="44" r="27" fill="#8c9f86"/><path d="M0 145v-20c0-30 20-47 55-47s55 17 55 47v20" fill="#8c9f86"/><path d="M38 82l17 23 17-23" fill="none" stroke="#c5d1c0" stroke-width="2"/></svg></div><div class="portrait-label">OPTIMIZED CITIZEN PORTRAIT</div></div><div class="passport-fields">${f("Full name", p.name, true)}${f("Citizen ID", state.id)}${f("Classification", p.type)}${f("District", p.district)}${f("Guidance level", p.guidance + "%")}${f("Daily rhythm", p.rhythm, true)}${f("Admission", date())}${f("Status", "ACTIVE CITIZEN")}</div></div><div class="mrz" aria-label="Fictional passport identification code">${passportCode(
    p,
  )
    .map((line) => `<span class="mrz-line">${esc(line)}</span>`)
    .join(
      "",
    )}</div><p class="small-note">FICTIONAL DOCUMENT · NOT VALID FOR TRAVEL</p></section><section class="daily-document"><div class="daily-document-head"><span class="eyebrow">OPTIVIA / DAILY DIRECTIVE</span><h2>Your day, arranged.</h2><p>${esc(p.name)} · ${esc(state.id)}</p><span class="badge">AI SELECTED ✓</span></div>${assignmentSummary()}${scheduleMarkup()}<p class="small-note">DECISION GUIDANCE: 100% · SCHEDULE CONFIRMED</p></section></div></section>`;
}

function citizenNavigation(active) {
  if (!state.complete) return "";
  return `<div class="citizen-bar no-print"><a class="documents-home" href="#home" aria-label="Return to Optivia home"><img src="assets/emblem-navy.svg" alt="Optivia national emblem" width="82" height="76"></a><nav class="citizen-nav" aria-label="Citizen navigation"><a href="#today" ${active === "today" ? 'aria-current="page"' : ""}>TODAY OPTIVIA</a></nav></div>`;
}
function today() {
  if (!state.complete) return registration();
  const p = profile();
  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const news = [
    [
      "SOCIETY",
      "Citizen satisfaction expected to rise by 7.2%.",
      "The national model predicts a calmer week as more daily decisions are delegated.",
    ],
    [
      "PUBLIC LIFE",
      "No major social conflict predicted this week.",
      "The forecast anticipates a stable week across all residential districts.",
    ],
    [
      "COMPANION SERVICES",
      "Human-to-human counselling continues to decline.",
      "OPTIVIA welcomes the shift toward companions that are always available.",
    ],
  ];
  return `<section class="page documents-page today-page fade">${citizenNavigation("today")}<div class="today-heading"><div><h1>Today Optivia.</h1></div><p>${esc(currentDate)}</p></div><div class="today-layout"><section class="today-weather" aria-labelledby="weather-title"><div class="today-section-label"><h2 id="weather-title">Weather</h2></div><div class="weather-reading"><span class="weather-temp">21<span>°C</span></span><p>Cloudy.<br>Rain expected.</p></div><dl class="weather-facts"><div><dt>Rain probability</dt><dd>82%</dd></div><div><dt>Wind</dt><dd>14 km/h</dd></div><div><dt>Humidity</dt><dd>78%</dd></div></dl><div class="weather-guidance"><span>DAILY GUIDANCE</span><p>Remain indoors between 15:00 and 17:00.</p><small>We have considered the weather for you.</small></div></section><section class="today-news" aria-labelledby="news-title"><div class="today-section-label"><h2 id="news-title">Optivia Daily</h2></div>${news.map((n, i) => `<article class="bulletin-story"><span class="bulletin-category">0${i + 1} / ${n[0]}</span><h3>${n[1]}</h3><p>${n[2]}</p></article>`).join("")}</section></div><a class="today-documents-link" href="#documents">View your passport & daily schedule</a><p class="today-fiction">Fictional national forecast and news for the OPTIVIA experience.</p></section>`;
}

function render() {
  timers.forEach(clearTimeout);
  timers = [];
  let page = location.hash.slice(1) || "home";
  const views = { home, documents, today, register: registration };
  if (!views[page]) page = "home";
  if (page === "today" && !state.complete) {
    page = "register";
    history.replaceState(null, "", "#register");
  }
  app.innerHTML = views[page]();
  document.body.classList.toggle("home-scene", page === "home");
  document.body.classList.toggle(
    "survey-scene",
    (page === "register" || page === "documents") && !state.complete,
  );
  document.body.classList.toggle(
    "documents-scene",
    (page === "documents" || page === "register" || page === "today") &&
      state.complete,
  );
  window.dispatchEvent(new Event("optivia:render"));
  document.title =
    "OPTIVIA — " +
    {
      home: "Think Less, Live Better.",
      register: "Your Personal Assistant",
      documents: "My Documents",
      today: "Today Optivia",
    }[page];
  document
    .querySelector("#reconsider-dialog")
    ?.addEventListener("close", () =>
      document.querySelector('[data-action="reject-day"]')?.focus(),
    );
  if (page !== "home") {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  if (el.classList.contains("dialog-close")) {
    document.querySelector("#reconsider-dialog")?.close();
    return;
  }
  const action = el.dataset.action;
  if (action === "print") {
    window.print();
    return;
  }
  if (action === "begin") {
    state = empty();
    save();
    go("register");
    return;
  }
  if (action === "accept-day" && state.step === 6) {
    document.querySelector("#reconsider-dialog")?.close();
    state.complete = true;
    state.step = 7;
    save();
    go("documents");
    return;
  }
  if (
    (action === "reject-day" || action === "reconsider-day") &&
    state.step === 6
  ) {
    state.objections = Math.min(2, state.objections + 1);
    save();
    reconsider();
    return;
  }
  if (el.hasAttribute("data-answer") && state.step >= 1 && state.step <= 4) {
    const answer = Number(el.dataset.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) return;
    state.answers[state.step - 1] = answer;
    state.step++;
    save();
    render();
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "name-form") return;
  e.preventDefault();
  const name = String(new FormData(e.target).get("name") || "")
    .trim()
    .slice(0, 48);
  if (!name) {
    const input = document.querySelector("#citizen-name");
    input.setCustomValidity("Please enter a name.");
    input.reportValidity();
    return;
  }
  state.name = name;
  state.step = 1;
  save();
  render();
});
document.addEventListener("input", (e) => {
  if (e.target.id === "citizen-name") e.target.setCustomValidity("");
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
});
render();
if (document.modelContext?.registerTool) {
  for (const tool of [
    {
      name: "read_optivia_citizen_state",
      description:
        "Read the current fictional citizenship status and assigned profile.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        complete: state.complete,
        step: state.step,
        profile: state.complete ? profile() : null,
      }),
    },
    {
      name: "navigate_optivia",
      description:
        "Navigate to an Optivia section. Registration starts the fictional citizen experience; this does not complete registration.",
      inputSchema: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["home", "register", "documents", "today"],
          },
        },
        required: ["page"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        if (
          !input ||
          !["home", "register", "documents", "today"].includes(input.page)
        )
          throw new Error("Invalid Optivia page");
        history.replaceState(null, "", "#" + input.page);
        render();
        return { page: input.page };
      },
    },
  ]) {
    try {
      Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {});
    } catch {}
  }
}
