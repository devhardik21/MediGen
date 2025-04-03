import puppeteer from "puppeteer";

// Improved browser launch function with longer timeout and stealth mode
const launchBrowser = async () => {
  try {
    return await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-extensions",
        "--disable-component-extensions-with-background-pages",
        "--disable-default-apps",
        "--mute-audio",
        "--no-default-browser-check"
      ],
      defaultViewport: { width: 1366, height: 768 },
      timeout: 60000, // Increase browser launch timeout
    });
  } catch (error) {
    console.error(`Browser launch failed: ${error.message}`);
    throw error;
  }
};

// General scraping function with better timeout handling and retry mechanism
const scrapePage = async (url, userAgent, evaluationFunction, waitForSelector, timeout = 60000) => {
  let browser = null;
  let retries = 2;
  
  while (retries >= 0) {
    try {
      browser = await launchBrowser();
      const page = await browser.newPage();
      
      // Set a more realistic user agent and browser fingerprint
      await page.setUserAgent(userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
      
      // Set viewport to simulate a real browser window
      await page.setViewport({ width: 1366, height: 768 });
      
      // Set extra headers to look more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
        'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      });
      
      // Modify request interception to only block images, not fonts or other resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (resourceType === 'image' || resourceType === 'media') {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Enhanced navigation with longer timeout
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { 
        waitUntil: ["domcontentloaded", "networkidle2"], 
        timeout: timeout 
      });
      
      // Add a longer delay to let dynamic content load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`Checking for selector: ${waitForSelector}`);
      
      // Wait for the specific selector with increased timeout
      if (waitForSelector) {
        try {
          await page.waitForSelector(waitForSelector, { timeout: 10000 });
          console.log(`Selector ${waitForSelector} found!`);
        } catch (error) {
          console.log(`Selector "${waitForSelector}" not found: ${error.message}`);
          // Continue execution even if selector not found - we'll try to evaluate anyway
        }
      }
      
      // Execute the evaluation function even if the selector wasn't found
      console.log("Attempting to evaluate page...");
      const result = await page.evaluate(evaluationFunction);
      console.log(`Evaluation complete, found ${result.length} items`);
      
      if (browser) {
        await browser.close();
      }
      
      return result;
    } catch (error) {
      if (browser) {
        await browser.close();
        browser = null;
      }
      
      console.error(`Scraping error (attempt ${2-retries}/2): ${error.message}`);
      
      if (retries > 0) {
        console.log(`Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        retries--;
      } else {
        console.error(`All retries failed for ${url}`);
        return [];
      }
    }
  }
  
  return [];
};

// Modified Apollo Pharmacy scraper with more resilient selector
const scrapeApollo = async (medicine) => {
  const url = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(medicine)}`;
  const selector = 'div[data-test="product-card"]';
  
  const evaluationFunction = () => {
    // Try multiple selectors that might find product cards
    const cards = document.querySelectorAll('div[data-test="product-card"], [class*="ProductCard_productCardGrid"], .product-card');
    
    if (cards.length === 0) {
      // If no specific elements found, try a more general approach
      const possibleCards = document.querySelectorAll('div[class*="card"], div[class*="product"]');
      
      // Look for elements that might be product cards (containing price and name)
      return Array.from(possibleCards)
        .filter(el => {
          const text = el.innerText;
          return text.includes('₹') && text.length > 50; // Only elements with price and substantial content
        })
        .slice(0, 3)
        .map(el => {
          const text = el.innerText.split("\n").map(t => t.trim());
          const possibleName = text.find(t => t.length > 10 && !t.includes('₹'));
          const possibleMrp = text.find(t => t.includes('MRP') || t.match(/\b\d+\.\d{2}\b/));
          const possiblePrice = text.find(t => t.includes('₹') && !t.includes('MRP'));
          
          return {
            name: possibleName || "Product Name Not Found",
            mrp: possibleMrp || "MRP Not Found",
            price: possiblePrice || "Price Not Found"
          };
        });
    }
    
    return Array.from(cards)
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
  
  const data = await scrapePage(url, null, evaluationFunction, selector, 60000);
  return { site: "Apollo", data };
};

// Modified PharmEasy scraper with more resilient selector
const scrapePharmEasy = async (medicine) => {
  const url = `https://pharmeasy.in/search/all?name=${encodeURIComponent(medicine)}`;
  const selector = 'div[role="menuitem"], div[class*="ProductCard"], div[class*="productCard"]';
  
  const evaluationFunction = () => {
    // Try multiple selectors
    const cards = document.querySelectorAll('div[role="menuitem"], div[class*="ProductCard"], div[class*="productCard"]');
    
    if (cards.length === 0) {
      // If no specific elements found, try a more general approach
      const possibleCards = document.querySelectorAll('div[class*="card"], div[class*="product"]');
      
      return Array.from(possibleCards)
        .filter(el => {
          const text = el.innerText;
          return text.includes('₹') && text.length > 50; 
        })
        .slice(0, 3)
        .map(el => {
          const text = el.innerText.split("\n");
          const possibleName = text.find(t => t.length > 10 && !t.includes('₹'));
          const possibleMrp = text.find(t => t.includes('MRP') || t.match(/\b\d+\.\d{2}\b/));
          const possiblePrice = text.find(t => t.includes('₹') && !t.includes('MRP'));
          
          return {
            name: possibleName || "Product Name Not Found",
            mrp: possibleMrp || "MRP Not Found",
            price: possiblePrice || "Price Not Found"
          };
        });
    }
    
    return Array.from(cards)
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
  
  const data = await scrapePage(url, null, evaluationFunction, selector, 60000);
  return { site: "PharmEasy", data };
};

// Modified Netmeds scraper with more resilient approach
const scrapeNetmeds = async (medicine) => {
  const url = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(medicine)}/all`;
  const selector = '.cat-item, .drug-list, .product-item';
  
  const evaluationFunction = () => {
    // Try multiple selectors
    const cards = document.querySelectorAll('.cat-item, .drug-list, .product-item');
    
    if (cards.length === 0) {
      // If no specific elements found, try a more general approach
      const possibleCards = document.querySelectorAll('div[class*="product"], div[class*="item"]');
      
      return Array.from(possibleCards)
        .filter(el => {
          const text = el.innerText;
          return text.includes('₹') && text.length > 50;
        })
        .slice(0, 3)
        .map(el => {
          const text = el.innerText.split("\n");
          const possibleName = text.find(t => t.length > 10 && !t.includes('₹'));
          const possibleMrp = text.find(t => t.includes('MRP') || t.match(/\b\d+\.\d{2}\b/));
          const possiblePrice = text.find(t => t.includes('₹') && !t.includes('MRP'));
          
          return {
            name: possibleName || "Product Name Not Found",
            mrp: possibleMrp || "MRP Not Found",
            price: possiblePrice || "Price Not Found"
          };
        });
    }
    
    return Array.from(cards)
      .slice(0, 3)
      .map(el => {
        const nameEl = el.querySelector('.clsgetname, .product-name, [class*="name"]');
        const priceEl = el.querySelector('.final-price, .price, [class*="price"]');
        const mrpEl = el.querySelector('#price, .mrp, [class*="mrp"]');

        return {
          name: nameEl ? nameEl.innerText.trim() : "N/A",
          price: priceEl ? priceEl.innerText.trim() : "N/A",
          mrp: mrpEl ? mrpEl.innerText.trim().replace("MRP ₹", "") : "N/A",
        };
      });
  };
  
  // Allow even more time for Netmeds
  const data = await scrapePage(url, null, evaluationFunction, selector, 70000);
  return { site: "Netmeds", data };
};

// Modified function to handle site blocking better
const scrapeMedicineInfo = async (medicine) => {
  try {
    console.log(`Searching for: ${medicine}`);
    
    // Add fallback data in case all scraping fails
    const fallbackData = [
      { 
        site: "Apollo", 
        data: [{ 
          name: "Service temporarily unavailable", 
          mrp: "Try again later", 
          price: "N/A" 
        }] 
      },
      { 
        site: "PharmEasy", 
        data: [{ 
          name: "Service temporarily unavailable", 
          mrp: "Try again later", 
          price: "N/A" 
        }] 
      },
      { 
        site: "Netmeds", 
        data: [{ 
          name: "Service temporarily unavailable", 
          mrp: "Try again later", 
          price: "N/A" 
        }] 
      }
    ];
    
    // Run all scrapers concurrently with Promise.allSettled
    const results = await Promise.allSettled([
      scrapeApollo(medicine),
      scrapePharmEasy(medicine),
      scrapeNetmeds(medicine)
    ]);
    
    // Process results, including failed ones
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
        return result.value;
      } else {
        const sites = ["Apollo", "PharmEasy", "Netmeds"];
        const errorMessage = result.status === 'rejected' ? result.reason.message : "No data found";
        console.error(`Error scraping ${sites[index]}: ${errorMessage}`);
        return fallbackData[index];
      }
    });
    
    return processedResults;
  } catch (error) {
    console.error(`General scraping error: ${error.message}`);
    return [];
  }
};

export { scrapeApollo, scrapePharmEasy, scrapeNetmeds, scrapeMedicineInfo };