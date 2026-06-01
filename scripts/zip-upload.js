// ZIP 업로드 페이지 — fake 업로드 + 분석 페이지로 이동
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileCard = document.getElementById('fileCard');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileRemove = document.getElementById('fileRemove');
    const startBtn = document.getElementById('startBtn');
    const optLang = document.getElementById('optLang');
    const optDepth = document.getElementById('optDepth');

    let selectedFile = null;

    // 클릭 / 키보드로 파일 선택
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // 드래그 앤 드롭
    ['dragenter', 'dragover'].forEach((ev) => {
        dropzone.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach((ev) => {
        dropzone.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) selectFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (f) selectFile(f);
    });

    fileRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        fileCard.hidden = true;
        startBtn.disabled = true;
    });

    function selectFile(file) {
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        fileCard.hidden = false;
        startBtn.disabled = false;
    }

    function formatBytes(bytes) {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(bytes < 10 ? 1 : 0)} ${units[i]}`;
    }

    // 분석 시작 → analyzing.html로 이동
    startBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        const params = new URLSearchParams({
            source: 'zip',
            name: selectedFile.name,
            size: selectedFile.size,
            lang: optLang.value,
            depth: optDepth.value,
        });
        window.location.href = `analyzing.html?${params.toString()}`;
    });
});
