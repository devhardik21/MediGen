import puppeteer from "puppeteer";

// Improved browser launch function with Render compatibility
const launchBrowser = async () => {
  try {
    const options = {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--no-first-run",
        "--no-zygote",
        "--single-process"
      ],
      defaultViewport: { width: 1366, height: 768 },
      timeout: 30000,
      // This is the critical part for Render
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    };

    return await puppeteer.launch(options);
  } catch (error) {
    console.error(`Browser launch failed: ${error.message}`);
    throw error;
  }
};

// The rest of your code remains the same
const scrapePage = async (url, userAgent, evaluationFunction, waitForSelector, timeout = 30000) => {
  let browser = null;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Set user agent and additional headers
    await page.setUserAgent(userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Referer': 'https://www.google.com/'
    });
    
    // Intercept and block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Enhanced navigation with shorter timeout for initial load
    await page.goto(url, { 
      waitUntil: "domcontentloaded", 
      timeout: timeout 
    });
    
    // Add a small delay to let dynamic content load - using setTimeout instead of waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for the specific selector with timeout
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 5000 });
      } catch (error) {
        console.log(`Selector "${waitForSelector}" not found: ${error.message}`);
      }
    }
    
    // Execute the evaluation function
    const result = await page.evaluate(evaluationFunction);
    return result;
  } catch (error) {
    console.error(`Scraping error: ${error.message}`);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Apollo Pharmacy scraper
const scrapeApollo = async (medicine) => {
  const url = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(medicine)}`;
  const selector = '[class^="ProductCard_productCardGrid"]';
  
  const evaluationFunction = () => {
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
  };
  
  const data = await scrapePage(url, null, evaluationFunction, selector);
  return { site: "Apollo", data };
};

// PharmEasy scraper
const scrapePharmEasy = async (medicine) => {
  const url = `https://pharmeasy.in/search/all?name=${encodeURIComponent(medicine)}`;
  const selector = 'div[role="menuitem"]';
  
  const evaluationFunction = () => {
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
  };
  
  const data = await scrapePage(url, null, evaluationFunction, selector);
  return { site: "PharmEasy", data };
};

// Netmeds scraper with improved reliability
const scrapeNetmeds = async (medicine) => {
  const url = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(medicine)}/all`;
  const selector = '.cat-item';
  
  const evaluationFunction = () => {
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
  };
  
  // Allow more time for Netmeds which seems to be slower
  const data = await scrapePage(url, null, evaluationFunction, selector, 45000);
  return { site: "Netmeds", data };
};

// New function to scrape from multiple sites concurrently
const scrapeMedicineInfo = async (medicine) => {
  try {
    console.log(`Searching for: ${medicine}`);
    
    // Run all scrapers concurrently with Promise.allSettled to handle individual failures
    const results = await Promise.allSettled([
      scrapeApollo(medicine),
      scrapePharmEasy(medicine),
      scrapeNetmeds(medicine)
    ]);
    
    // Process results, including failed ones
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const sites = ["Apollo", "PharmEasy", "Netmeds"];
        console.error(`Error scraping ${sites[index]}: ${result.reason}`);
        return { site: sites[index], data: [], error: result.reason.message };
      }
    });
  } catch (error) {
    console.error(`General scraping error: ${error.message}`);
    return [];
  }
};

export { scrapeApollo, scrapePharmEasy, scrapeNetmeds, scrapeMedicineInfo };