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
spawnFloaties(window.innerWidth < 600 ? 8 : 14);
