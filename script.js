function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    setTimeout(() => {
        addMessage("I'm still learning!", "bot");
    }, 1000);
}

function addMessage(text, sender) {
    const chat = document.getElementById("chat");
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    msgDiv.textContent = text;
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
}