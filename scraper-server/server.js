const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// sessionId → { browser, page, status, data, error, created }
const sessions = new Map();

// Clean up stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.created > 5 * 60 * 1000) {
      try { s.browser.close(); } catch {}
      sessions.delete(id);
    }
  }
}, 60 * 1000);

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /login  body: { username }
app.post("/login", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const id = uuidv4();
  sessions.set(id, { status: "launching", data: null, error: null, created: Date.now() });

  res.json({ sessionId: id });

  // Run async — don't block the response
  runLogin(id, username).catch((err) => {
    const s = sessions.get(id);
    if (s) { s.status = "error"; s.error = err.message; }
    console.error("Login error:", err);
  });
});

// GET /status/:id
app.get("/status/:id", (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Session not found or expired" });
  res.json({ status: s.status, data: s.data, error: s.error });
});

async function runLogin(id, username) {
  const session = sessions.get(id);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  session.browser = browser;
  const page = await browser.newPage();
  session.page = page;
  await page.setViewport({ width: 1280, height: 800 });

  session.status = "navigating";

  // Navigate to Banner SSB → redirects to sdo.aamu.edu
  await page.goto("https://banbss2.aamu.edu:8444/StudentSelfService", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  // Should now be on sdo.aamu.edu
  const currentUrl = page.url();
  if (!currentUrl.includes("sdo.aamu.edu")) {
    // Might already be logged in (unlikely for a fresh session)
    await finishScraping(id);
    return;
  }

  session.status = "entering_credentials";

  // Find and fill the username field
  await page.waitForSelector("input", { timeout: 10000 });
  const usernameInput = await page.$(
    'input[name="username"], input[id="username"], input[placeholder*="sername" i], input[type="text"]:not([type="hidden"])'
  );
  if (!usernameInput) throw new Error("Could not find username field on SDO page");

  await usernameInput.click({ clickCount: 3 });
  await usernameInput.type(username, { delay: 80 });

  // Click NEXT / Submit
  const nextBtn = await page.$(
    'button[type="submit"], input[type="submit"], button#NEXT, button[id*="next" i], button[class*="next" i]'
  );
  if (nextBtn) {
    await nextBtn.click();
  } else {
    // Try pressing Enter
    await usernameInput.press("Enter");
  }

  session.status = "waiting_mfa";

  // Wait for redirect back to Banner SSB (up to 2 minutes — user approves on phone)
  try {
    await page.waitForFunction(
      () => window.location.hostname.includes("banbss2.aamu.edu"),
      { timeout: 120000, polling: 1000 }
    );
  } catch {
    session.status = "error";
    session.error = "Authentication timed out. Please try again and approve the Octopus notification within 2 minutes.";
    await browser.close();
    sessions.delete(id);
    return;
  }

  await finishScraping(id);
}

async function finishScraping(id) {
  const session = sessions.get(id);
  if (!session) return;
  const { page, browser } = session;
  session.status = "scraping";

  try {
    const BASE = "https://banbss2.aamu.edu:8444/StudentSelfService";

    // Navigate to student profile to get the student ID
    await page.goto(`${BASE}/ssb/studentProfile`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Extract student ID from page title: "Student Profile - Name (A00597565)"
    const title = await page.title();
    const studentIdMatch = title.match(/\(([A-Z]\d+)\)/);
    const studentId = studentIdMatch ? studentIdMatch[1] : null;

    if (!studentId) throw new Error("Could not extract student ID from profile page");

    // Parse bio info from profile HTML
    const profileData = await page.evaluate(() => {
      const getFieldValue = (label) => {
        const rows = document.querySelectorAll(".row");
        for (const row of rows) {
          const strong = row.querySelector("strong");
          if (strong && strong.textContent.trim().replace(":", "") === label) {
            const span = row.querySelector("span");
            return span ? span.textContent.trim() : null;
          }
        }
        return null;
      };

      // Try to extract from the rendered page
      const allText = document.body.innerHTML;

      return {
        name: document.querySelector("h1")?.textContent?.trim() ||
              document.title?.match(/Student Profile - (.+?) \(/)?.[1] || "",
        email: getFieldValue("Email") || "",
        gender: getFieldValue("Gender") || "",
        classStanding: getFieldValue("Class") || "",
        status: getFieldValue("Status") || "",
        campus: getFieldValue("Campus") || "",
        firstTerm: getFieldValue("First Term Attended") || "",
        lastTerm: getFieldValue("Last Term Attended") || "",
        holds: parseInt(document.querySelector(".holds-count, [data-holds]")?.textContent || "0"),
        registrationNotices: parseInt(
          document.querySelector(".registration-notices, [data-notices]")?.textContent || "0"
        ),
      };
    });

    // Parse holds/notices from the banner bar
    const bannerBarText = await page.evaluate(() => {
      const bar = document.querySelector(".banner-bar, .notification-bar, [class*='notice']");
      return bar ? bar.textContent : "";
    });

    // Extract holds and notices from the profile page indicators
    const holdsCount = await page.evaluate(() => {
      // Look for "Holds: X" pattern
      const text = document.body.innerText;
      const holdsMatch = text.match(/Holds[:\s]+(\d+)/i);
      return holdsMatch ? parseInt(holdsMatch[1]) : 0;
    });

    const noticesCount = await page.evaluate(() => {
      const text = document.body.innerText;
      const noticesMatch = text.match(/Registration Notices[:\s]+(\d+)/i);
      return noticesMatch ? parseInt(noticesMatch[1]) : 0;
    });

    // Make all API calls using page.evaluate (cookies are shared)
    const [coursesData, gpaData, currentCoursesData, gpaHoursData, holdsData] = await Promise.all([
      page.evaluate(async (base) => {
        try {
          const r = await fetch(
            `${base}/studentGrades/courses?termCode=-1&levelCode=UG&filterText=&pageOffset=0&pageMaxSize=500&sortColumn=-1&sortDirection=-1`
          );
          return r.json();
        } catch { return { data: [] }; }
      }, BASE),

      page.evaluate(async (base) => {
        try {
          const r = await fetch(`${base}/studentGrades/gpa?term=-1&level=UG`);
          return r.json();
        } catch { return {}; }
      }, BASE),

      page.evaluate(async (base, sid) => {
        try {
          const r = await fetch(`${base}/studentProfile/viewRegisteredCourseList?studentId=${sid}`);
          return r.json();
        } catch { return { courses: [] }; }
      }, BASE, studentId),

      page.evaluate(async (base, sid) => {
        try {
          const r = await fetch(`${base}/studentProfile/viewGPAHoursList?studentId=${sid}&`);
          return r.json();
        } catch { return { gpas: [] }; }
      }, BASE, studentId),

      page.evaluate(async (base, sid) => {
        try {
          const r = await fetch(`${base}/studentHolds/getHoldsCountCacheHolds?studentId=${sid}`);
          return r.json();
        } catch { return { holds: [] }; }
      }, BASE, studentId),
    ]);

    // Parse curriculum from profile HTML
    const curriculumData = await page.evaluate(async (base, sid) => {
      try {
        const r = await fetch(`${base}/studentProfile/renderCurriculumTemplate?studentId=${sid}`);
        const html = await r.text();
        // Parse key fields from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const getField = (label) => {
          const rows = doc.querySelectorAll(".row");
          for (const row of rows) {
            const strong = row.querySelector("strong");
            if (strong && strong.textContent.includes(label)) {
              const span = row.querySelector("span");
              return span ? span.textContent.trim() : null;
            }
          }
          return null;
        };
        return {
          degree: getField("Degree"),
          program: getField("Program"),
          college: getField("College"),
          major: getField("Major"),
          department: getField("Department"),
          concentration: getField("Concentration"),
          catalogTerm: getField("Catalog Term"),
          admitType: getField("Admit Type"),
        };
      } catch { return {}; }
    }, BASE, studentId);

    // Get registration notices
    const noticesData = await page.evaluate(async (base, sid) => {
      try {
        const r = await fetch(`${base}/studentProfile/viewRegistrationNotices?studentId=${sid}`);
        return r.json();
      } catch { return {}; }
    }, BASE, studentId);

    // Build response
    const data = {
      studentId,
      name: title.match(/Student Profile - (.+?) \(/)?.[1] || profileData.name,
      email: profileData.email,
      classStanding: profileData.classStanding,
      status: profileData.status,
      campus: profileData.campus,
      firstTerm: profileData.firstTerm,
      lastTerm: profileData.lastTerm,
      curriculum: curriculumData,
      gpa: {
        overall: gpaData.overall?.gpa || "0.00",
        institutional: gpaData.cumulative?.gpa || "0.00",
        transfer: gpaData.transfer?.gpa || "0.00",
        totalHours: gpaData.overall?.hoursEarned || 0,
        gpaHours: gpaData.cumulative?.gpaHours || 0,
      },
      gpaHours: gpaHoursData,
      holds: holdsCount,
      registrationNotices: noticesCount,
      holdsDetail: holdsData,
      currentCourses: currentCoursesData.courses || [],
      courseHistory: coursesData.data || [],
      notices: noticesData,
    };

    session.status = "done";
    session.data = data;
  } catch (err) {
    session.status = "error";
    session.error = `Scraping failed: ${err.message}`;
    console.error("Scraping error:", err);
  } finally {
    try { await browser.close(); } catch {}
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Scraper server running on port ${PORT}`));
