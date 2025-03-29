//chatbot.js
console.log("1");
let username;
const BASE_URL = 'http://localhost:8000/api';
const nameInput = document.getElementById('name');
const nameForm = document.getElementById('name-getting');
const button = document.querySelector('#send-button');
const input = document.querySelector('#user-input');
const chats = document.querySelector('.chatting');
const token = sessionStorage.getItem("token") ; 
const HistButton = document.querySelector('#History');
const NewChat = document.querySelector('#new-chat') ; 

// Initialize user registration form
nameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        if (nameInput.value.trim()) {
            username = nameInput.value;
            const response = await fetch(`${BASE_URL}/setname`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: username
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                document.querySelector('.pop-up').style.display = "none";
                
                // Create welcome message
                const welcomeMsg = document.createElement('p');
                welcomeMsg.textContent = data.message || `Hello ${username}, Welcome to MediGen! How can I help you?`;
                welcomeMsg.className = 'bot-message';
                chats.appendChild(welcomeMsg);
            } else {
                throw new Error(data.error || "Failed to set name");
            }
        }
    } catch (error) {
        console.error(`Error setting name: ${error.message}`);
        alert("Failed to connect. Please try again.");
    }
});

// Handle sending messages
button.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(e);
    }
});

async function sendMessage(e) {
    e.preventDefault();
    const message = input.value;
    
    if (!message.trim()) {
        return;
    }
    
    try {
        // Display user message
        const userMessageEl = document.createElement('p');
        userMessageEl.textContent = message;
        userMessageEl.className = 'user-message';
        chats.appendChild(userMessageEl);
        
        // Clear input field
        input.value = '';
        
        // Show loading indicator
        const loadingEl = document.createElement('p');
        loadingEl.textContent = 'Typing...';
        loadingEl.className = 'loading-message';
        chats.appendChild(loadingEl);
        
        // Scroll to bottom
        chats.scrollTop = chats.scrollHeight;
        
        // Send to server
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`},
            body: JSON.stringify({
                message: message
            })
        });
        
        // Remove loading indicator
        chats.removeChild(loadingEl);
        
        if (response.ok) {
            const data = await response.json();  
            const converter = new showdown.Converter();
            const botMessageEl = document.createElement('p');
            botMessageEl.innerHTML = converter.makeHtml(data.reply);
            botMessageEl.className = 'bot-message';
            chats.appendChild(botMessageEl);
        } else {
            throw new Error("Failed to get response");
        }
    } catch (error) {
        console.error(`Error sending message: ${error.message}`);
        
        // Display error message
        const errorEl = document.createElement('p');
        errorEl.textContent = "Sorry, I couldn't process your request. Please try again.";
        errorEl.className = 'error-message';
        chats.appendChild(errorEl);
    }
    
    // Scroll to bottom again
    chats.scrollTop = chats.scrollHeight;
}

HistButton.addEventListener("click",()=>{
    window.location.href = 'history.html' ;
})

NewChat.addEventListener('click',() => {
    chats.innerHTML='';
})

