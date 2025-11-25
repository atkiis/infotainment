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
  "https://www.lounaat.info/lounas/edun-herkkukeidas-eetwartti/tampere",
  "https://www.lounaat.info/lounas/moro-sky-bar/tampere"
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

  let browser;

  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(".meal-item--name-container span.compass-text", {
      timeout: 10000,
    });

    const menuItems = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".meal-item--name-container"))
        .map((container) => {
          const dish =
            container.querySelector("span.compass-text")?.textContent?.trim() ||
            "";
          const info =
            container.querySelector("p.compass-text")?.textContent?.trim() ||
            "";
          if (!dish) {
            return null;
          }
          return { dish, price: "", info };
        })
        .filter((item) => item !== null);
    });

    return {
      restaurant: "Å11",
      menu: [{ date: TODAY_FIN, menu: menuItems }],
    };
  } catch (err) {
    console.error("Å11 scraper error:", err);
    return { restaurant: "Å11", error: err.message, menu: [] };
  } finally {
    if (browser) {
      await browser.close();
    }
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
