AOS.init({
    duration: 1000,
    once: false // Changing this to false makes animations repeat every time you scroll
});
document.querySelector('[data-image-src]').src = 'asset/logo.png'
const images = document.querySelectorAll('[data-image-src]');
images[0].src = 'asset/logo.png';

AOS.init({
    duration: 700,
    once: true,
    offset: 80,
    easing: 'ease-out-quad'
});

// Dynamic image replacement
document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('[data-image-src]');
    if (images.length > 0) {
        images[0].src = 'asset/logo.png';
    }
});