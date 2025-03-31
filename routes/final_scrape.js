import puppeteer from "puppeteer";

const launchBrowser = async () => {
    return await puppeteer.launch({
        headless: "new",
        executablePath: "/usr/bin/chromium", // Use system-installed Chromium
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
        ],
    });
};

const scrapeApollo = async (medicine) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    await page.goto(`https://www.apollopharmacy.in/search-medicines/${medicine}`, { waitUntil: "networkidle2" });

    let result = [];
    try {
        await page.waitForSelector('[class^="ProductCard_productCardGrid"]', { timeout: 5000 });
        result = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('[class^="ProductCard_productCardGrid"]'))
                .slice(0, 3)
                .map(el => {
                    const text = el.innerText.split("\n").map(t => t.trim());
                    return {
                        name: text.find(t => t.length > 3 && !t.includes("₹") && !t.includes("%")) || "N/A",
                        mrp: text.find(t => t.includes("MRP ₹"))?.replace("MRP ₹", "").trim() || "N/A",
                        price: text.find(t => t.includes("₹") && !t.includes("MRP") && !t.includes("cashback")) || "N/A",
                    };
                });
        });
    } catch (error) {
        console.log("Apollo: No data found.");
    }
    await browser.close();
    return { site: "Apollo", data: result };
};

const scrapePharmEasy = async (medicine) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    await page.goto(`https://pharmeasy.in/search/all?name=${medicine}`, { waitUntil: "networkidle2" });

    let result = [];
    try {
        await page.waitForSelector('div[role="menuitem"]', { timeout: 5000 });
        result = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('div[role="menuitem"]'))
                .slice(0, 3)
                .map(el => {
                    const text = el.innerText.split("\n");
                    return {
                        name: text[0] || "N/A",
                        mrp: text.find(t => t.includes("MRP ₹"))?.replace("MRP ", "") || "N/A",
                        price: text.find(t => t.includes("₹") && !t.includes("MRP") && !t.includes("cashback")) || "N/A",
                    };
                });
        });
    } catch (error) {
        console.log("PharmEasy: No data found.");
    }
    await browser.close();
    return { site: "PharmEasy", data: result };
};

const scrapeNetmeds = async (medicine) => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    await page.goto(`https://www.netmeds.com/catalogsearch/result/${medicine}/all`, { waitUntil: "networkidle2" });

    let result = [];
    try {
        await page.waitForSelector('.cat-item', { timeout: 5000 });
        result = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.cat-item'))
                .slice(0, 3)
                .map(el => {
                    const nameEl = el.querySelector('.clsgetname');
                    const priceEl = el.querySelector('.final-price');
                    const mrpEl = el.querySelector('#price');

                    return {
                        name: nameEl ? nameEl.innerText.trim() : "N/A",
                        price: priceEl ? priceEl.innerText.trim() : "N/A",
                        mrp: mrpEl ? mrpEl.innerText.trim().replace("MRP ₹", "") : "N/A",
                    };
                });
        });
    } catch (error) {
        console.log("Netmeds: No data found.");
    }
    await browser.close();
    return { site: "Netmeds", data: result };
};

export { scrapeApollo };
export { scrapeNetmeds };
export { scrapePharmEasy };
