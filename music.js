/* =====================================================================
   MUSIC SYNC — supaya lagu TIDAK mengulang dari awal saat pindah halaman
   (index.html -> rain.html -> surat.html), tapi lanjut dari posisi
   terakhir, seperti musik yang terus berjalan di background.
   ===================================================================== */
(function () {
    const bgMusic = document.getElementById('bgMusic');
    if (!bgMusic) return;

    const TIME_KEY = 'bgMusicTime';
    let musicStarted = false;
    let resumeApplied = false;

    function applySavedTime() {
        if (resumeApplied) return;
        const savedTime = parseFloat(sessionStorage.getItem(TIME_KEY));
        if (!isNaN(savedTime) && savedTime > 0 && isFinite(bgMusic.duration) && savedTime < bgMusic.duration) {
            bgMusic.currentTime = savedTime;
        }
        resumeApplied = true;
    }

    // Terapkan posisi tersimpan begitu metadata lagu sudah siap dibaca
    bgMusic.addEventListener('loadedmetadata', applySavedTime);
    if (bgMusic.readyState >= 1) applySavedTime();

    function startMusic() {
        if (musicStarted) return;

        applySavedTime();
        bgMusic.volume = 0;

        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    musicStarted = true;
                    fadeInMusic();
                    removeInteractionListeners();
                })
                .catch(() => {
                    // Diblokir browser, akan dicoba lagi saat ada interaksi pertama user
                });
        }
    }

    function fadeInMusic() {
        let v = bgMusic.volume;
        const fade = setInterval(() => {
            v += 0.02;
            bgMusic.volume = Math.min(v, 0.6);
            if (v >= 0.6) clearInterval(fade);
        }, 100);
    }

    function removeInteractionListeners() {
        ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
            document.removeEventListener(evt, startMusic);
        });
    }

    // Simpan posisi lagu berkala, supaya halaman berikutnya bisa melanjutkan
    setInterval(() => {
        if (!bgMusic.paused) {
            sessionStorage.setItem(TIME_KEY, bgMusic.currentTime);
        }
    }, 500);

    // Simpan juga tepat saat mau pindah halaman/tutup tab
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem(TIME_KEY, bgMusic.currentTime);
    });

    window.addEventListener('load', startMusic);
    ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
        document.addEventListener(evt, startMusic, { passive: true });
    });
})();
