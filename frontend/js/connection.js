//connection between frontend and backend
const BASE_URL = 'https://medigen-ocp5.onrender.com/api' ; 
const reg_submit = document.querySelector('#register-button') ; 
const log_submit = document.querySelector('#login-button') ; 
const reg_form = document.querySelector('#register') ; 
const log_form = document.querySelector('#login') ; 

//---------------Register function ----------------
//---------------Register function ---------------- 
//---------------Register function ---------------- 
reg_form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const username = document.querySelector('#Username').value;  // Changed from 'name' to 'username'
    const dob = document.querySelector('#Dob').value;
    const email = document.querySelector('#email-id-register').value;
    const password = document.querySelector('#password-register').value;
    
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, dob })  // Changed 'name' to 'username'
        });
        console.log(res);
        const data = await res.json();
        
        if(res.ok){
            console.log("User is registered successfully");
            alert("User is registered successfully");
            window.location.href = 'login.html';
        } else {
            console.log(data.message);
            alert(data.error || data.message || "Registration failed");  // Added error alert
        }
    } catch (error) {
        console.log(`Cannot register the user ${error}`);
        alert("Registration failed due to a server error");  // Added error alert
    }
})

// --------------------------Login function-----------------

// --------------------------Login function-----------------
log_form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.querySelector('#email-id').value;
    const password = document.querySelector('#password').value;
    
    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email, password})
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("User logged in successfully");
            sessionStorage.setItem("token", data.token);
            window.location.href = 'chatbot.html';
        } else {
            console.log(data.message);
            alert(data.message || "Login failed. Please check your credentials.");
        }
    } catch (error) {
        console.log("We caught an error logging in the user", error);
        alert("Login failed due to a server error. Please try again later.");
    }
})

