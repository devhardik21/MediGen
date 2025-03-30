const historyContainer = document.querySelector('#history');
const BASE_URL = `https://medigen-ocp5.onrender.com/api`;
const token = sessionStorage.getItem("token");

document.addEventListener("DOMContentLoaded", async () => {
    historyContainer.innerHTML = `<div class="wait"><h3>Loading your History...</h3></div>`;
    try {
        const response = await fetch(`${BASE_URL}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        historyContainer.innerHTML = ""; // Clear loading message
        
        const converter = new showdown.Converter();
        
        data.message.forEach((msg) => {
            const messageElement = document.createElement("div");
            messageElement.innerHTML = converter.makeHtml(msg.text);
            messageElement.className = msg.sender === "user" ? "user-message" : "bot-message";
            historyContainer.appendChild(messageElement);
        });
    } catch (error) {
        console.error("Error fetching history:", error);
        historyContainer.innerHTML = `<div class="error"><h3>Could not load history. Please try again later.</h3></div>`;
    }
});
