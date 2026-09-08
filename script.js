const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textOverlay = document.getElementById('textOverlay');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

/* ================= MATRIX RAIN ================= */
class MatrixRain {
    constructor(color) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.speed = Math.random() * 8 + 4;
        this.color = color;
        this.characters = '01アイウエオカキクケコサシスセソタチツテト'.split('');
        this.char = this.characters[Math.floor(Math.random() * this.characters.length)];
        this.fontSize = 16;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
        }
        if (Math.random() > 0.95) {
            this.char = this.characters[Math.floor(Math.random() * this.characters.length)];
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.font = `${this.fontSize}px Courier New`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

/* ================= MINI HEART SPRITE (untuk performa) ================= */
// Alih-alih menggambar ulang path love + shadowBlur SETIAP frame untuk
// ratusan love kecil (ini yang bikin animasi ngelag berat), kita gambar
// tiap warna love SEKALI SAJA ke kanvas tersembunyi (sprite), lalu tiap
// frame tinggal "ditempel" pakai drawImage — jauh lebih ringan untuk browser.

// Palet warna disamakan dengan referensi: pink lembut keputihan di bagian
// dalam, pink terang, sampai magenta pekat di bagian luar.
const MINI_HEART_COLORS = [
    'rgba(255, 235, 245, 0.95)',
    'rgba(255, 182, 213, 0.95)',
    'rgba(255, 105, 180, 0.95)',
    'rgba(255, 20, 147, 0.95)',
    'rgba(219, 39, 119, 0.9)'
];

const SPRITE_SIZE = 96;

function renderHeartPath(context, blurPx) {
    context.save();
    if (blurPx) context.filter = `blur(${blurPx}px)`;
    context.translate(SPRITE_SIZE / 2, SPRITE_SIZE * 0.55);
    const s = SPRITE_SIZE * 0.75;
    context.scale(s, s);
    context.beginPath();
    context.moveTo(0, -0.2);
    context.bezierCurveTo(0, -0.45, -0.5, -0.45, -0.5, -0.15);
    context.bezierCurveTo(-0.5, 0.15, -0.2, 0.35, 0, 0.5);
    context.bezierCurveTo(0.2, 0.35, 0.5, 0.15, 0.5, -0.15);
    context.bezierCurveTo(0.5, -0.45, 0, -0.45, 0, -0.2);
    context.closePath();
    context.fill();
    context.restore();
}

function createHeartSprite(color, blurPx) {
    const off = document.createElement('canvas');
    off.width = SPRITE_SIZE;
    off.height = SPRITE_SIZE;
    const octx = off.getContext('2d');
    octx.fillStyle = color;
    renderHeartPath(octx, blurPx);
    return off;
}

// Cache sprite untuk tiap warna: versi tajam (crisp) dan versi buram (glow)
const spriteCrisp = {};
const spriteGlow = {};
MINI_HEART_COLORS.forEach(color => {
    spriteCrisp[color] = createHeartSprite(color, 0);
    spriteGlow[color] = createHeartSprite(color, SPRITE_SIZE * 0.09);
});

// Menempelkan sprite love kecil ke kanvas utama (sangat ringan, tanpa blur real-time)
function drawMiniHeart(sprite, x, y, size, rotation, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
}

/* ================= HEART PARTICLE (love kecil) ================= */
let hearts = [];

// Siklus animasi: love kecil keluar dari titik tengah (OUT), menetap
// sebentar membentuk love besar (HOLD), lalu kembali ke tengah (IN),
// lalu berulang lagi dari awal — terus-menerus, tidak pernah berhenti.
const CYCLE_MS = 5200;
const OUT_FRAC = 0.34;
const HOLD_FRAC = 0.46;
const IN_FRAC = 0.20;

function lerp(a, b, t) {
    return a + (b - a) * t;
}

class HeartParticle {
    constructor(cx, cy, targetX, targetY, size, delayMs) {
        this.cx = cx;
        this.cy = cy;
        this.tx = targetX;
        this.ty = targetY;
        this.size = size;
        this.delayMs = delayMs;
        this.rotation = (Math.random() - 0.5) * 0.6;
        this.color = MINI_HEART_COLORS[Math.floor(Math.random() * MINI_HEART_COLORS.length)];
        this.baseAlpha = 0.8 + Math.random() * 0.2;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    draw(elapsed) {
        const localT = (((elapsed + this.delayMs) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;

        let x, y, fade;

        if (localT < OUT_FRAC) {
            // FASE KELUAR: love kecil terbang dari tengah menuju posisi love besar
            const p = localT / OUT_FRAC;
            const eased = 1 - Math.pow(1 - p, 3);
            x = lerp(this.cx, this.tx, eased);
            y = lerp(this.cy, this.ty, eased);
            fade = p;
        } else if (localT < OUT_FRAC + HOLD_FRAC) {
            // FASE TAHAN: menetap membentuk love besar
            x = this.tx;
            y = this.ty;
            fade = 1;
        } else {
            // FASE KEMBALI: love kecil kembali ke titik tengah
            const p = (localT - OUT_FRAC - HOLD_FRAC) / IN_FRAC;
            const eased = Math.pow(p, 3);
            x = lerp(this.tx, this.cx, eased);
            y = lerp(this.ty, this.cy, eased);
            fade = 1 - p;
        }

        // efek "berdenyut" lembut selama love terlihat
        const pulse = 1 + Math.sin(elapsed * 0.004 + this.pulseOffset) * 0.15;
        const alpha = this.baseAlpha * fade;

        if (alpha <= 0.01) return;

        // LAPISAN 1 — GLOW: versi lebih besar, dari sprite yang SUDAH buram
        // (bukan shadowBlur real-time), digambar dengan mode "lighter"
        // (additive) supaya cahaya antar love kecil saling menumpuk dan
        // MENYATU jadi satu massa cahaya, bukan love yang berbaris terpisah.
        ctx.globalCompositeOperation = 'lighter';
        drawMiniHeart(spriteGlow[this.color], x, y, this.size * pulse * 1.5, this.rotation, alpha * 0.5);
        ctx.globalCompositeOperation = 'source-over';

        // LAPISAN 2 — bentuk love yang lebih jelas di atas glow tadi,
        // supaya tetap terlihat teksturnya tanpa jadi blok polos.
        drawMiniHeart(spriteCrisp[this.color], x, y, this.size * pulse, this.rotation, alpha * 0.85);
    }
}

class Heart {
    constructor(cx, cy, scale) {
        this.cx = cx;
        this.cy = cy;
        this.scale = scale;
        this.particles = [];
        this.startTime = Date.now();
        this.create();
    }

    create() {
        // Lebih banyak layer & lebih rapat supaya membentuk love padat isi love kecil,
        // bukan garis outline saja
        const points = getHeartFillPoints();

        // Ukuran satu love kecil dalam pixel — dibuat cukup besar & saling
        // tumpang tindih (overlap) supaya menyatu jadi satu massa, bukan
        // berjejer terpisah-pisah.
        const miniHeartBase = Math.max(9, this.scale * 0.85);

        // Jarak tiap titik dari tengah dipakai untuk menghitung delay,
        // supaya love besar seperti "mekar" keluar dari tengah (bukan
        // semua love kecil muncul serentak dari satu titik).
        let maxDist = 0;
        const withDist = points.map(p => {
            const dist = Math.hypot(p.x, p.y);
            if (dist > maxDist) maxDist = dist;
            return { p, dist };
        });

        withDist.forEach(({ p, dist }) => {
            const size = miniHeartBase * (0.7 + Math.random() * 0.6);
            const distDelay = (dist / maxDist) * (CYCLE_MS * OUT_FRAC * 0.5);
            const jitterDelay = Math.random() * 250;

            this.particles.push(
                new HeartParticle(
                    this.cx,
                    this.cy,
                    this.cx + p.x * this.scale,
                    this.cy - p.y * this.scale,
                    size,
                    distDelay + jitterDelay
                )
            );
        });
    }

    draw(time) {
        const elapsed = time - this.startTime;
        this.particles.forEach(p => p.draw(elapsed));
    }
}

/* ================= HEART SHAPE ================= */
// Menghasilkan titik-titik di sepanjang tepi love, dengan beberapa lapisan
// dan sedikit "jitter" acak supaya susunan love kecilnya terlihat rimbun/fluffy
// seperti kumpulan bunga membentuk love, bukan garis titik yang rapi.
function getHeartFillPoints() {
    const points = [];
    // Di HP jumlah titik dikurangi supaya tetap ringan & tidak lag
    const isMobile = window.innerWidth < 768;
    const layers = isMobile ? 4 : 5;
    const step = 0.07;
    const jitterAmount = 0.3;
    const angleStep = isMobile ? 0.07 : 0.055;

    for (let t = 0; t < Math.PI * 2; t += angleStep) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

        for (let i = 0; i < layers; i++) {
            const factor = 1 - i * step;
            const jx = (Math.random() - 0.5) * jitterAmount;
            const jy = (Math.random() - 0.5) * jitterAmount;
            points.push({
                x: x * factor + jx,
                y: y * factor + jy
            });
        }
    }
    return points;
}

/* ================= TEXT ================= */
function showText(text) {
    textOverlay.textContent = text;
    textOverlay.style.opacity = '1';
}
function hideText() {
    textOverlay.style.opacity = '0';
}

/* ================= SHOW HEART ================= */
function showHeart() {
    hearts = [];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // LOVE UTAMA — ukuran dibuat proporsional & tidak terlalu besar,
    // supaya tetap enak dilihat baik di HP maupun di desktop.
    const shortSide = Math.min(canvas.width, canvas.height);
    const isMobile = window.innerWidth < 768;
    const baseScale = isMobile ? shortSide / 40 : shortSide / 45;

    hearts.push(new Heart(cx, cy, baseScale));

    // FIX TEKS TENGAH
    const heartText = document.querySelector('.heart-text');
    heartText.style.opacity = '1';
    heartText.classList.add('show');
}

/* ================= CTA BUTTON ================= */
function showButton() {
    const ctaButton = document.getElementById('ctaButton');
    if (ctaButton) ctaButton.classList.add('show');
}

/* ================= RAIN ================= */
let raindrops = [];
function initRain(color, count) {
    raindrops = [];
    for (let i = 0; i < count; i++) {
        raindrops.push(new MatrixRain(color));
    }
}

/* ================= TIMELINE ================= */
const timeline = [
    { time: 0, action: () => initRain('rgba(255,105,180,1)', 150) },
    { time: 3000, action: () => showText('You') },
    { time: 5500, action: hideText },
    { time: 6000, action: () => showText('Are') },
    { time: 8500, action: hideText },
    { time: 9000, action: () => showText('My') },
    { time: 11500, action: hideText },
    { time: 12000, action: () => showText('Love') },
    { time: 14500, action: hideText },
    { time: 15000, action: () => initRain('rgba(255,105,180,1)', 200) },
    { time: 17000, action: showHeart },
    { time: 20500, action: showButton }
];

let timelineIndex = 0;
const startTime = Date.now();

/* ================= ANIMATE ================= */
function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    raindrops.forEach(r => {
        r.update();
        r.draw();
    });

    const now = Date.now();
    hearts.forEach(h => {
        h.draw(now);
    });

    const elapsed = Date.now() - startTime;
    if (timelineIndex < timeline.length && elapsed >= timeline[timelineIndex].time) {
        timeline[timelineIndex].action();
        timelineIndex++;
    }

    requestAnimationFrame(animate);
}

/* ================= START ================= */
window.addEventListener('load', animate);

/* ================= MUSIC =================
   Logika musik (autoplay + lanjut dari posisi terakhir saat pindah
   halaman) sekarang ditangani oleh file music.js. Lihat rain.html. */