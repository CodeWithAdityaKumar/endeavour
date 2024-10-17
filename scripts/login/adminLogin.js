import { firebaseConfig } from "../../configs/firebase.js";

firebase.initializeApp(firebaseConfig);

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");
const fpassword = document.getElementById("fpassword");


function showLoadingSpinner() {
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoadingSpinner() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

fpassword.addEventListener("click", (e)=>{
  const auth = firebase.auth();
  const email = emailInput.value;

  if (!email) {
    alert("Please enter your email address.");
    return;
  }

  showLoadingSpinner()
  auth.sendPasswordResetEmail(email)
    .then(() => {
      hideLoadingSpinner()
      alert("Password reset email sent. Please check your inbox.");
    })
    .catch((error) => {
      hideLoadingSpinner()
      console.error("Password reset error:", error);
      alert("Error sending password reset email. Please try again.");
    });
})



// Add login event
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoadingSpinner()

  const email = emailInput.value;
  const password = passwordInput.value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log("User logged in:", user);
      // Redirect to admin dashboard or home page
      hideLoadingSpinner()
      window.location.href = "/pages/login/dashboard/dashboard.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      hideLoadingSpinner()
      console.error("Login error:", errorCode, errorMessage);
      displayError("Invalid email or password. Please try again.");
    });
});

// Function to display error messages
function displayError(message) {
  errorMessage.textContent = message;
}
