/* ================= FLOATING DECOR ================= */
const floatiesContainer = document.getElementById('floaties');
const FLOATY_ICONS = ['🤍', '✦', '💗', '✧', '🐾'];

function spawnFloaties(count) {
    for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'floaty';
        el.textContent = FLOATY_ICONS[Math.floor(Math.random() * FLOATY_ICONS.length)];
        el.style.left = `${Math.random() * 100}%`;
        el.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
        el.style.fontSize = `${14 + Math.random() * 14}px`;
        const duration = 10 + Math.random() * 10;
        el.style.animationDuration = `${duration}s`;
        el.style.animationDelay = `${Math.random() * duration}s`;
        floatiesContainer.appendChild(el);
    }
}
spawnFloaties(window.innerWidth < 600 ? 10 : 16);

/* ================= SCROLL REVEAL ================= */
const revealTargets = document.querySelectorAll('.line, .card');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, { threshold: 0.5 });

revealTargets.forEach(el => observer.observe(el));

/* ================= HUG INTERACTION ================= */
const hugBtn = document.getElementById('hugBtn');
const hugMsg = document.getElementById('hugMsg');
const doll = document.getElementById('doll');

hugBtn.addEventListener('click', () => {
    hugBtn.classList.remove('bumped');
    void hugBtn.offsetWidth; // restart animation
    hugBtn.classList.add('bumped');

    hugMsg.classList.add('show');

    doll.style.transition = 'transform 0.35s ease';
    doll.style.transform = 'scale(1.08)';
    setTimeout(() => {
        doll.style.transform = '';
        doll.style.transition = '';
    }, 350);

    burstHearts();
});

function burstHearts() {
    const rect = hugBtn.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top;

    for (let i = 0; i < 10; i++) {
        const heart = document.createElement('span');
        heart.textContent = ['💗', '✦', '🤍'][Math.floor(Math.random() * 3)];
        heart.style.position = 'fixed';
        heart.style.left = `${originX}px`;
        heart.style.top = `${originY}px`;
        heart.style.fontSize = `${12 + Math.random() * 12}px`;
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '80';
        heart.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        document.body.appendChild(heart);

        const angle = (Math.random() - 0.5) * Math.PI;
        const dist = 60 + Math.random() * 80;
        const dx = Math.sin(angle) * dist;
        const dy = -Math.abs(Math.cos(angle) * dist) - 40;

        requestAnimationFrame(() => {
            heart.style.transform = `translate(${dx}px, ${dy}px)`;
            heart.style.opacity = '0';
        });

        setTimeout(() => heart.remove(), 1050);
    }
}
