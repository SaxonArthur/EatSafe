const enterEmail = document.getElementById('reset-email');
const confirmEmail = document.getElementById("confirm-reset-email");

enterEmail.addEventListener('focusout', validateEmail);
confirmEmail.addEventListener("focusout", validateEmail);

function validateEmail() {
    if (enterEmail.value.trim() !== confirmEmail.value.trim() && (enterEmail.value.trim() !== '' && confirmEmail.value.trim() !== '')) {
        document.getElementById('email-error-container').style.display = 'flex';
        document.getElementById('reset-error-text').textContent = "Emails do not match";
        enterEmail.style.border = '1px solid red';
        confirmEmail.style.border = '1px solid red';
        return false;
    }
    else {
        document.getElementById('email-error-container').style.display = 'none';
        enterEmail.style.border = '1px solid #707070';
        confirmEmail.style.border = '1px solid #707070';
        return true;
    }
}

document.getElementById('send-confirmation-email').addEventListener('click', () => {
    if (validateEmail && localStorage.getItem(enterEmail.value.trim())) {
        var templateParams = {
            email: enterEmail.value.trim(),
            link: window.location.origin + '/changePassword.html'
        }
        emailjs.send('service_ju7hqo8', 'template_n097s47', templateParams).then(
                (response) => {
                    document.getElementById('sent-success').textContent = "Email sent to "+enterEmail.value.trim();
                    document.getElementById('send-confirmation-email').disbled = true;
                    document.getElementById('sent-success').style.display = "block";
                    localStorage.setItem('changePassword', enterEmail.value.trim())
                },
                (error) => {
                    document.getElementById('reset-error-text').textContent = "Error sending email. Please try again.";
                    document.getElementById('email-error-container').style.display = 'flex';
                }
            )
    }
} )