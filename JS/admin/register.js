/* js/register.js */
document.addEventListener('DOMContentLoaded', () => {
    AOS.init();

    let currentStep = 1;
    const totalSteps = 3;

    // Function to rotate the tutorial steps
    function rotateSteps() {
        // Remove active classes
        document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));

        // Increment step
        currentStep = currentStep >= totalSteps ? 1 : currentStep + 1;

        // Add active classes
        document.getElementById(`step${currentStep}`).classList.add('active');
        document.querySelectorAll('.dot')[currentStep - 1].classList.add('active');
    }

    // Auto-rotate every 4 seconds
    setInterval(rotateSteps, 4000);

    // Form Submission Logic
    document.getElementById('regForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Verification OTP sent to your phone! Please check your messages.");
        // Next: Redirect to OTP verification page
    });
});
