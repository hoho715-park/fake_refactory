// Login 페이지 — fake 로그인 (모든 입력 OK, 토스트 후 메인으로 이동)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const toast = document.getElementById('loginToast');
    const submitBtn = form?.querySelector('.login-submit');

    // ===== 비밀번호 표시 토글 =====
    document.querySelectorAll('.password-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.setAttribute('aria-label', isPassword ? '비밀번호 숨기기' : '비밀번호 표시');
        });
    });

    // ===== 이메일 로그인 fake submit =====
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email');
            const password = document.getElementById('login-password');
            let firstInvalid = null;

            // 간단 검증
            [email, password].forEach((input) => {
                input.classList.remove('invalid');
                if (!input.value.trim()) {
                    input.classList.add('invalid');
                    if (!firstInvalid) firstInvalid = input;
                }
            });

            if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                email.classList.add('invalid');
                if (!firstInvalid) firstInvalid = email;
            }

            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

            // 가짜 로그인 진행
            submitBtn.classList.add('loading');
            submitBtn.textContent = '로그인 중...';
            showToast('로그인 중...', '잠시 후 메인 페이지로 이동합니다.');

            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1200);
        });

        // 입력 시 invalid 제거
        form.querySelectorAll('input').forEach((el) => {
            el.addEventListener('input', () => el.classList.remove('invalid'));
        });
    }

    // ===== 소셜 로그인 fake =====
    document.querySelectorAll('.social-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const provider = btn.dataset.provider || '소셜';
            showToast(`${provider} 계정으로 로그인 중...`, '잠시 후 메인 페이지로 이동합니다.');

            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1200);
        });
    });

    function showToast(title, sub) {
        if (!toast) return;
        toast.querySelector('.toast-title').textContent = title;
        toast.querySelector('.toast-sub').textContent = sub;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
});
