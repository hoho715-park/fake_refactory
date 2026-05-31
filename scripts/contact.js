// Contact 페이지 — 폼 가짜 제출 + FAQ 아코디언
document.addEventListener('DOMContentLoaded', () => {

    // ===== 폼 fake submit =====
    const form = document.getElementById('contactForm');
    const toast = document.getElementById('formToast');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 최소한의 클라이언트 검증 (DB 없이 화면만 검증)
            const requiredInputs = form.querySelectorAll('[required]');
            let firstInvalid = null;

            requiredInputs.forEach((input) => {
                const isCheckbox = input.type === 'checkbox';
                const empty = isCheckbox ? !input.checked : !input.value.trim();
                const emailBad = input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);

                if (empty || emailBad) {
                    if (isCheckbox) {
                        input.closest('.form-consent')?.classList.add('invalid');
                    } else {
                        input.classList.add('invalid');
                    }
                    if (!firstInvalid) firstInvalid = input;
                } else {
                    input.classList.remove('invalid');
                    input.closest('.form-consent')?.classList.remove('invalid');
                }
            });

            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

            // 가짜 제출: 토스트 띄우고 폼 리셋
            showToast();
            form.reset();
        });

        // 입력 시 invalid 표시 제거
        form.querySelectorAll('input, select, textarea').forEach((el) => {
            el.addEventListener('input', () => {
                el.classList.remove('invalid');
                el.closest('.form-consent')?.classList.remove('invalid');
            });
        });
    }

    function showToast() {
        if (!toast) return;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    // ===== FAQ 아코디언 =====
    document.querySelectorAll('.faq-question').forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });
});
