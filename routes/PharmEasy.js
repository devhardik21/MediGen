//pharmeasy.js
import puppeteer from "puppeteer";

(async () => {
    const medicine = "Omeprazole"; // Define medicine inside function
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto(`https://pharmeasy.in/search/all?name=${medicine}`, {
        waitUntil: "networkidle2",
    });

    const priceElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('div[role="menuitem"]'));  
        
        return elements.slice(0, 3).map(el => {
            const text = el.innerText.split("\n"); // Split by new line
            return {
                name: text[0],   // Medicine Name
                manufacturer: text[1]?.replace("By ", ""), // Manufacturer (Remove 'By')
                mrp: text.find(t => t.includes("MRP ₹"))?.replace("MRP ", ""), // MRP Price
                price: text.find(t => t.includes("₹") && !t.includes("MRP")) || "N/A", // Discounted Price
                discount: text.find(t => t.includes("% OFF")) || "N/A" // Discount
            };
        });
    });

    console.log(priceElements);
    await browser.close();
})();
