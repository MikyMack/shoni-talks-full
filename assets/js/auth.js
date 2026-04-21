// ========================
// TOAST HELPER
// ========================
function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background:
        type === "success" ? "#f9a93a" : type === "error" ? "#dc3545" : "#333",
    },
  }).showToast();
}

// ========================
// BUTTON LOADER
// ========================
function setLoading(btn, text) {
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<span class="btn-spinner"></span>${text}`;
  btn.classList.add("btn-loading");
}

function resetLoading(btn) {
  btn.innerHTML = btn.dataset.original;
  btn.classList.remove("btn-loading");
}

// ========================
// SEND OTP
// ========================
async function sendOtp() {
  const btn = document.getElementById("otpBtn");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    showToast("Enter email", "error");
    return;
  }

  setLoading(btn, "Sending...");

  try {
    const res = await fetch("/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (data.status === "success") {
      document.getElementById("otpSection").style.display = "block";
      showToast("OTP sent successfully");

      // 🔥 IMPORTANT PART (your issue fix)
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("otpSection").style.display = "block";
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Something went wrong", "error");
  } finally {
    resetLoading(btn);
  }
}

// ========================
// VERIFY OTP
// ========================
async function verifyOtp() {
  const btn = document.getElementById("verifyBtn");

  const email = document.getElementById("email").value.trim();

  const otpInputs = document.querySelectorAll(".otp-input");
  let otp = "";

  otpInputs.forEach((input) => {
    otp += input.value;
  });

  if (otp.length !== 6) {
    showToast("Enter valid OTP", "error");
    return;
  }

  setLoading(btn, "Verifying...");

  try {
    const res = await fetch("/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (data.status === "success") {
      showToast("Login successful");

      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Verification failed", "error");
  } finally {
    resetLoading(btn);
  }
}

// ========================
// RESEND OTP
// ========================
function resendOtp() {
  sendOtp();
}

// ========================
// OTP AUTO FOCUS
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".otp-input");

  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && inputs[index + 1]) {
        inputs[index + 1].focus();
      }
    });
  });
});
