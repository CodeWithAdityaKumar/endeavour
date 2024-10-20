
function toggleMobileNav() {
    const center = document.querySelector('.center');
    const tl = document.querySelector('.tl');
    const body = document.body;
    let ul = document.querySelector(".ul");

    center.classList.toggle('show');
    body.classList.toggle('nav-open');

    if (center.classList.contains('show')) {
        tl.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path fill="black" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
        `;
        center.style.display = 'flex';
        center.style.alignItems = 'center';
        center.style.justifyContent = 'center';
        ul.style.display = 'flex'; 
        body.style.overflow = 'hidden';
    } else {
        tl.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
        `;
        center.style.display = 'none';
        ul.style.display = ''; // Hide the menu
        body.style.overflow = '';
    }
}

document.querySelectorAll('.navUl a').forEach(link => {
    link.addEventListener('click', () => {
        const center = document.querySelector('.center');
        if (center.classList.contains('show')) {
            toggleMobileNav();
        }
    });
});

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}

document.querySelector('.close-popup').addEventListener('click', closePopup);