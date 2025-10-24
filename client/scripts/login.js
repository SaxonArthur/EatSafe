let inputFields = document.getElementsByClassName('input-field')
let errorMessage = document.getElementById('error-message');

const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const newEmail = document.getElementById('new-email');

confirmPassword.addEventListener('focusout', validatePassword);
newPassword.addEventListener('focusout', validatePassword);

const pages = document.querySelectorAll('.page');
const translateAmount = 100;
let translate = 0;

const codeInputs = document.querySelectorAll(".code");
var verificationCode = '';

var dietaryRequirementsList=[]

const rememberUser = localStorage.getItem('remember');
if (rememberUser) {
    setTimeout(() => {
        window.location.href = "/mainApp.html"
    }, 500)
}

slide = (direction) => {
    direction === "next" ? translate -= translateAmount : translate += translateAmount;

    pages.forEach(
        pages => (pages.style.transform = `translateX(${translate}%)`)
    )
}

for (let i = 0; i < inputFields.length; i++) {
    inputFields[i].addEventListener('keydown', function(e) {
        if (e.key === ' ') {
            e.preventDefault();
        }
    });
}

function closeTerms(element) {
    element.parentElement.style.display = "none"
}

function openTerms(id) {
    document.getElementById(id).style.display = "block";
}

// Simple function to compare password and confirm password section to make sure both are valid
function validatePassword() {
    if (newPassword.value.trim() !== confirmPassword.value.trim() && (newPassword.value.trim() !== '' && confirmPassword.value.trim() !== '')) {
        document.getElementById('pass-error-container').style.display = 'flex';
        document.getElementById('register-error-text').textContent = "Passwords do not match";
        newPassword.style.border = '1px solid red';
        confirmPassword.style.border = '1px solid red';
        return false;
    }
    else {
        document.getElementById('pass-error-container').style.display = 'none';
        newPassword.style.border = '1px solid #707070';
        confirmPassword.style.border = '1px solid #707070';
        return true;
    }
}

// Fancy UI for entering verification code
codeInputs.forEach((element, idx) => {
    element.addEventListener('keyup', function(event) {
        if (event.key === "Backspace" && element.value === '' && idx > 0) {
            codeInputs[idx - 1].focus();
        }
        else if (event.key !== "Backspace" &&idx < codeInputs.length - 1) {
            codeInputs[idx + 1].focus();
        }
    });
});

document.getElementById('reg-link').addEventListener('click', function(event) {
    event.preventDefault();
    slide("next");
});

// Use the SHA-256 Algorithm to hash password as a safety feature
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const utf8password = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', utf8password);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Logic for verifying login
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('current-password').value.trim();
    const rememberMe = document.getElementById('remember-me').checked;
    await hashPassword(password).then(password => {
        hashedPassword = password;
    });
    // If email and password exist
    if (localStorage.getItem(email) && JSON.parse(localStorage.getItem(email))["password"] == hashedPassword) {
        if (rememberMe) { // If user ticked remember me
            localStorage.setItem('remember', email);
        }
        // Log in user and set them as active
        localStorage.setItem('currentActiveUser', email)
        window.location.href = "/MainApp.html";
    } else {
        errorMessage.style.display = 'block';
        const errorTimeout = setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 2500);
        document.getElementById('current-password').value = '';
        document.getElementById('email').value = '';
    }
})

// Logic for sending verification code
document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!JSON.parse(localStorage.getItem(newEmail.value.trim()))) {
        if (validatePassword()) {
            var date = new Date();
            date.setMinutes(date.getMinutes() + 15);
            date.setHours(date.getHours());
            var expirationTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            verificationCode = String(Math.floor(Math.random() * 90000) + 10000);
            var templateParams = {
                email: newEmail.value.trim(),
                passcode: verificationCode,
                time: expirationTime
            }
            emailjs.send('service_ju7hqo8', 'template_omnfbhe', templateParams).then( // Uses emailjs API to send emails
                (response) => {
                    slide("next");
                    document.getElementById('enter-code').innerText = "A verification code has been sent to "+newEmail.value.trim();
                    const sendCodeTimeout = setTimeout(() => {
                        verificationCode = null;
                    }, 15*60*1000); // Expires in 15 minutes
                    },
                (error) => {
                    document.getElementById('pass-error-message').innerText = "Error sending email. Please try again.";
                    document.getElementById('pass-error-message').style.display = 'flex';
                }
            )
        }
    } else {
        document.getElementById('pass-error-message').innerText = "Email already in use";
        document.getElementById('pass-error-message').style.display = 'flex';
    }
})

function verifyCode() {
    let enteredCode = '';
    document.querySelectorAll('.code').forEach((element) => {
        enteredCode += element.value.trim();
    })
    if (enteredCode === verificationCode && enteredCode) {
        document.getElementById('code-error-message').style.display='none';
        slide('next')
    }
    else {
        slide('next')
        document.getElementById('code-error-message').style.display='flex';
    }
}

function resendCode() {
    var date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    date.setHours(date.getHours());
    var expirationTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    verificationCode = String(Math.floor(Math.random() * 90000) + 10000);
    var templateParams = {
        email: newEmail.value.trim(),
        passcode: verificationCode,
        time: expirationTime
    }
    emailjs.send('service_ju7hqo8', 'template_omnfbhe', templateParams).then(
        (response) => {
            const resendCodeTimeout = setTimeout(() => {
                verificationCode = null;
            }, 15*60*1000);
        },
        (error) => {
            document.getElementById('code-error-message').innerText = "Error sending email. Please try again.";
            document.getElementById('code-error-message').style.display = 'flex';
        }
    )
}

// Storing user details when fully logged in
async function saveDetails(event) {
    event.preventDefault();
    document.querySelectorAll('.diet-value').forEach((element) => {
    if (element.checked) {
        dietaryRequirementsList.push(element.value);
        }
    })
    await hashPassword(newPassword.value.trim()).then(password => {
        hashedPassword = password
    })
    const userData = {
        "displayName" : document.getElementById('display-name').value.trim(),
        "email" : newEmail.value.trim(),
        "userID" : Math.floor(Math.random()*1000000000000),
        "password" : hashedPassword,
        "dietaryRequirements" : dietaryRequirementsList
    }
    console.log(document.getElementById('display-name').value.trim(), userData);
    localStorage.setItem(newEmail.value.trim(), JSON.stringify(userData));
    localStorage.setItem('currentActiveUser', newEmail.value.trim());
    window.location.href = "/mainApp.html";
}