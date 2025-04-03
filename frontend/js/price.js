const BASE_URL = 'https://medigen-final.onrender.com/api'
const form = document.querySelector('#price-comparison');
const priceDisplay = document.querySelector('#price-display');

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const medicine = document.querySelector('#price-search').value.trim();

    if (!medicine) {
        return alert('Please enter a medicine name.');
    }

    priceDisplay.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>Fetching prices...</p>
        </div>
    `;

    try {
        const response = await fetch(`${BASE_URL}/compare?medicine=${encodeURIComponent(medicine)}`);
        const data = await response.json();

        if (!data || data.length === 0) {
            priceDisplay.innerHTML = `<p>No data found for "${medicine}".</p>`;
            return;
        }

        priceDisplay.innerHTML = "";

        data.forEach(element => {
            let link = "";
            if (element.site === "Apollo") {
                link = `<a href="https://www.apollopharmacy.in/search-medicines/${medicine}" target="_blank"> Apollo Link</a>`;
            } else if (element.site === "PharmEasy") {
                link = `<a href="https://pharmeasy.in/search/all?name=${medicine}" target="_blank"> PharmEasy Link</a>`;
            } else {
                link = `<a href="https://www.netmeds.com/catalogsearch/result/${medicine}/all" target="_blank"> Netmeds Link</a>`;
            }

            priceDisplay.innerHTML += `
                <div class="site-container">
                    <h3>${element.site} ${link}</h3>
                    ${element.data.map(details => `
                        <div class="medicine">
                            <p><strong>Name:</strong> ${details.name}</p>
                            <p><strong>MRP:</strong> ₹${details.mrp}</p>
                            <p><strong>Price:</strong> ₹${details.price}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        });

    } catch (error) {
        priceDisplay.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
        console.error("Error:", error);
    }
});
