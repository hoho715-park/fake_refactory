// Home (logged-in) — 프로필 드롭다운
document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.querySelector('.profile-wrap');
    const btn = document.getElementById('profileBtn');

    if (!wrap || !btn) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = wrap.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            wrap.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});
