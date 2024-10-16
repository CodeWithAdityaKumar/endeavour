import { auth, onAuthStateChanged } from "../../configs/firebase.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/pages/login/adminLogin.html";
    }
  });