const newPassword = document.getElementById('reset-password');
const confirmPassword = document.getElementById('confirm-reset-password');

newPassword.addEventListener('focusout', validatePassword);
confirmPassword.addEventListener("focusout", validatePassword);

let hashedPassword


// Use the SHA-256 Algorithm to hash password as a safety feature
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const utf8password = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', utf8password);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple function to compare password and confirm password section to make sure both are valid
function validatePassword() {
    if (newPassword.value.trim() !== confirmPassword.value.trim() && (newPassword.value.trim() !== '' && confirmPassword.value.trim() !== '')) {
        document.getElementById('password-error-container').style.display = 'flex';
        document.getElementById('change-error-text').textContent = "Passwords do not match";
        newPassword.style.border = '1px solid red';
        confirmPassword.style.border = '1px solid red';
        return false;
    }
    else {
        document.getElementById('password-error-container').style.display = 'none';
        newPassword.style.border = '1px solid #707070';
        confirmPassword.style.border = '1px solid #707070';
        return true;
    }
}

//
async function resetPassword() {
    if (validatePassword) {
        await hashPassword(newPassword.value.trim()).then(password => {
            hashedPassword = password;
        })
        const userData = {
            "displayName" : JSON.parse(localStorage.getItem(localStorage.getItem('changePassword')))["displayName"],
            "email" : JSON.parse(localStorage.getItem(localStorage.getItem('changePassword')))["email"],
            "userID" : JSON.parse(localStorage.getItem(localStorage.getItem('changePassword')))["userID"],
            "password" : hashedPassword,
            "dietaryRequirements" : JSON.parse(localStorage.getItem(localStorage.getItem('changePassword')))["dietaryRequirements"]
        }
        localStorage.setItem(localStorage.getItem("changePassword"), JSON.stringify(userData));
        localStorage.removeItem('changePassword');
        window.location.href = "/"
        }
}
