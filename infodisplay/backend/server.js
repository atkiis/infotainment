// backend/server.js (ESM!)
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3001;

// --- Lounaat URLs ---
const LOUNAAT_URLS = [
  "https://www.lounaat.info/lounas/myllarit/tampere",
  "https://www.lounaat.info/lounas/old-mates-tampere/tampere",
  "https://www.lounaat.info/lounas/aleksis/tampere"
];

// --- HELPER: Today name in Finnish ---
const TODAY_FIN = new Date().toLocaleDateString("fi-FI", {
  weekday: "long",
  day: "numeric",
  month: "numeric",
});

// ---------------------------------------------------------
// 🥗 SCRAPER 1 — LOUNAAT.INFO (today only)
// ---------------------------------------------------------
async function scrapeLounaat(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(html);
    const restaurant = $("h1").first().text().trim() || url;

    // Find today’s item block
    const todayEl = $("#menu .item")
      .filter((i, el) => {
        const h = $(el).find(".item-header h3").text().toLowerCase();
        return h.includes(
          new Date().toLocaleDateString("fi-FI", { weekday: "long" }).toLowerCase()
        );
      })
      .first();

    let menuItems = [];

    if (todayEl.length) {
      todayEl.find(".item-body ul li").each((i, li) => {
        const dish = $(li)
          .find("p.dish")
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .trim();

        const info = $(li)
          .find("a.diet")
          .map((j, a) => $(a).text().trim())
          .get()
          .join(", ");

        if (dish) menuItems.push({ dish, price: "", info });
      });
    } else {
      menuItems.push({ dish: "Ei tämän päivän listaa", price: "", info: "" });
    }

    return {
      restaurant,
      menu: [{ date: TODAY_FIN, menu: menuItems }],
    };
  } catch (err) {
    return { restaurant: url, error: err.message, menu: [] };
  }
}

// ---------------------------------------------------------
// 🥘 SCRAPER 2 — COMPASS GROUP (Å11) — using REAL JSON API
// ---------------------------------------------------------
// ---------------------------------------------------------

import puppeteer from "puppeteer";

async function scrapeA11() {
  const url =
    "https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/tampere/tulli-business-park/";

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Select rendered menu blocks
  const menu = await page.evaluate(() => {
    const items = [];
    const paragraphs = [...document.querySelectorAll("p")];

    for (const p of paragraphs) {
      const text = p.innerText.trim();

      if (
        !text ||
        text.length < 3 ||
        text.toLowerCase().includes("menu updating") ||   // ⛔ filter noise
        text.includes("Lounas") ||                        // header
        /^\d/.test(text)                                  // numeric
      ) {
        continue;
      }

      items.push({ dish: text });
    }

    return items;
  });

    await browser.close();

    return {
      restaurant: "Å11",
      menu,
    };
  } catch (err) {
    console.error("Å11 scraper error:", err);
    return { restaurant: "Å11", error: err.message, menu: [] };
  }
}

// ---------------------------------------------------------
// API ENDPOINT — /lunch
// ---------------------------------------------------------
app.get("/lunch", async (req, res) => {
  const results = await Promise.all([
    ...LOUNAAT_URLS.map((u) => scrapeLounaat(u)),
    scrapeA11(),
  ]);

  res.json(results);
});

// ---------------------------------------------------------
app.listen(PORT, () =>
  console.log(`Lunch scraper backend running at http://localhost:${PORT}`)
);
