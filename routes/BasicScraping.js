//BasicScraping.js
import puppeteer from "puppeteer";
(async () => {
    const browser = await puppeteer.launch({ headless: false }); // Set to true for production
    const page = await browser.newPage();
    const medicine = "Omeprazole";

    // Go to the webpage and wait for it to load
    await page.goto(`https://www.apollopharmacy.in/search-medicines/${medicine}`, {
        waitUntil: "networkidle2",
    });

    // Ensure elements are loaded
    await page.waitForSelector('[class^="ProductCard_productCardGrid"]', { timeout: 5000 });

    const Cost = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[class^="ProductCard_productCardGrid"]'));

        return elements.slice(0, 3).map(el => {
            const text = el.innerText.split("\n").map(t => t.trim());

            // Extract the actual medicine name by filtering out unwanted values
            const name = text.find(t => t.length > 3 && !t.includes("₹") && !t.includes("%") && !t.includes("MRP") && t !== "Rx") || "N/A";

            return {
                name,
                mrp: text.find(t => (t.includes("MRP ₹")))?.replace("MRP ₹", "").trim() || "N/A",
                price: text.find(t => t.includes("₹") && !t.includes("MRP") && !t.includes("cashback")) || "N/A",
            };
        });
    });
    console.log(Cost);

    await browser.close();
})();
