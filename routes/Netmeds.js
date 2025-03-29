// netmeds.js
import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const medicine = "Omeprazole";

    await page.goto(`https://www.netmeds.com/catalogsearch/result/${medicine}/all`, {
        waitUntil: "networkidle2",
    });

    const NetmedsPrice = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.cat-item'));

        return items.slice(0, 3).map(el => {
            const nameEl = el.querySelector('.clsgetname'); 
            const priceEl = el.querySelector('.final-price'); 
            const mrpEl = el.querySelector('#price'); 

            return {
                name: nameEl ? nameEl.innerText.trim() : "N/A",
                price: priceEl ? priceEl.innerText.trim() : "N/A",
                mrp: mrpEl ? mrpEl.innerText.trim().replace("MRP ₹", "") : "N/A"
            };
        });
    });

    console.log(NetmedsPrice);
    await browser.close();
})();
