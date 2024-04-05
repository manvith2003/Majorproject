document.addEventListener("DOMContentLoaded", function() {
    const bodyHeight = document.body.clientHeight;
    const viewportHeight = window.innerHeight;
    
    if (bodyHeight < viewportHeight) {
        document.querySelector('footer').style.display = 'block';
    }
});
