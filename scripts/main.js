// More 드롭다운 토글
document.addEventListener('DOMContentLoaded', () => {
    const dropdownItem = document.querySelector('.has-dropdown');
    if (!dropdownItem) return;

    const toggleBtn = dropdownItem.querySelector('.nav-toggle');

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownItem.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownItem.contains(e.target)) {
            dropdownItem.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdownItem.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });
});
