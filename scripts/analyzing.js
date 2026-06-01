// Analyzing 페이지 — 5단계 파이프라인 + 라이브 통계 + 로그 스트림 → dashboard로 이동
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || 'zip';
    const name = params.get('name') || params.get('repo') || 'unknown';
    const sizeBytes = parseInt(params.get('size') || '0', 10);
    const lang = params.get('lang') || 'auto';
    const depth = params.get('depth') || 'standard';

    // ===== Header info =====
    const targetLabel = document.getElementById('targetLabel');
    const targetName = document.getElementById('targetName');
    const targetMeta = document.getElementById('targetMeta');

    targetLabel.textContent = source === 'github' ? 'GitHub Repository' : 'ZIP Archive';
    targetName.textContent = name;
    const metaParts = [];
    if (source === 'zip' && sizeBytes) metaParts.push(formatBytes(sizeBytes));
    metaParts.push(`언어: ${lang === 'auto' ? '자동 감지' : lang}`);
    if (source === 'zip') metaParts.push(`깊이: ${depth}`);
    targetMeta.textContent = metaParts.join(' · ');

    // ===== Refs =====
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressStage = document.getElementById('progressStage');
    const steps = document.querySelectorAll('.step');
    const statFiles = document.getElementById('statFiles');
    const statLines = document.getElementById('statLines');
    const statIssues = document.getElementById('statIssues');
    const statTime = document.getElementById('statTime');
    const logStream = document.getElementById('logStream');

    // ===== 파이프라인 시나리오 =====
    const TOTAL_FILES = source === 'github' ? 147 : 89;
    const TOTAL_LINES = source === 'github' ? 12438 : 7820;
    const TOTAL_ISSUES = 18;

    const PHASES = [
        {
            step: 1, label: '소스 가져오기', duration: 800,
            logs: [
                { t: 0,    msg: source === 'github' ? `Cloning ${name}...` : `Extracting ${name}...`,            type: 'info' },
                { t: 250,  msg: source === 'github' ? 'Authenticating via PAT (read scope)' : 'Reading archive...', type: 'info' },
                { t: 600,  msg: `Discovered ${TOTAL_FILES} source files`,                                          type: 'success' },
            ],
            updateStats: (p) => {
                const files = Math.floor(p * TOTAL_FILES);
                statFiles.innerHTML = `${files} <small>/ ${TOTAL_FILES}</small>`;
            },
        },
        {
            step: 2, label: 'tree-sitter로 파싱 중', duration: 1400,
            logs: [
                { t: 0,    msg: 'Detecting languages...',                                  type: 'info' },
                { t: 250,  msg: 'Loading grammars: js, ts, py, java',                      type: 'info' },
                { t: 600,  msg: 'Parsing AST nodes... (concurrency: 8)',                   type: 'info' },
                { t: 1000, msg: `Parsed ${TOTAL_FILES} files into ${(TOTAL_LINES * 4.2).toFixed(0)} AST nodes`, type: 'success' },
            ],
            updateStats: (p) => {
                const lines = Math.floor(p * TOTAL_LINES);
                statLines.textContent = lines.toLocaleString();
            },
        },
        {
            step: 3, label: '의존 그래프 구성', duration: 1000,
            logs: [
                { t: 0,   msg: 'Building module dependency graph...',          type: 'info' },
                { t: 350, msg: 'Resolving import paths and exports',           type: 'info' },
                { t: 700, msg: 'Found 28 modules, 92 inter-module edges',      type: 'success' },
            ],
            updateStats: (p) => {
                statLines.textContent = TOTAL_LINES.toLocaleString();
            },
        },
        {
            step: 4, label: '코드 품질 측정', duration: 1300,
            logs: [
                { t: 0,    msg: 'Computing cyclomatic complexity...',                  type: 'info' },
                { t: 300,  msg: 'Detecting code smells (long method, duplicates...)',  type: 'info' },
                { t: 700,  msg: '3 high-complexity functions detected',                type: 'warn' },
                { t: 1000, msg: 'Overall quality score: 87 / 100',                     type: 'success' },
            ],
            updateStats: (p) => {
                const issues = Math.floor(p * TOTAL_ISSUES);
                statIssues.textContent = issues;
            },
        },
        {
            step: 5, label: '개선안 도출', duration: 900,
            logs: [
                { t: 0,   msg: 'Generating refactoring suggestions...',                type: 'info' },
                { t: 400, msg: '5 actionable suggestions identified',                  type: 'success' },
                { t: 750, msg: 'Report ready ✓',                                        type: 'success' },
            ],
            updateStats: (p) => {
                statIssues.textContent = TOTAL_ISSUES;
            },
        },
    ];

    // ===== 실행 =====
    const startTime = Date.now();
    const timeTimer = setInterval(() => {
        const sec = (Date.now() - startTime) / 1000;
        statTime.textContent = `${sec.toFixed(1)}s`;
    }, 100);

    runPipeline();

    async function runPipeline() {
        const totalDuration = PHASES.reduce((s, p) => s + p.duration, 0);
        let elapsed = 0;

        for (let i = 0; i < PHASES.length; i++) {
            const phase = PHASES[i];
            const step = steps[i];

            // 이전 step 완료 표시
            if (i > 0) {
                steps[i - 1].classList.remove('active');
                steps[i - 1].classList.add('done');
                steps[i - 1].querySelector('.step-status').textContent = '완료';
            }

            step.classList.add('active');
            step.querySelector('.step-status').textContent = '진행 중';
            progressStage.textContent = phase.label;

            // 로그 출력 예약
            phase.logs.forEach((logEntry) => {
                setTimeout(() => addLog(logEntry.msg, logEntry.type), logEntry.t);
            });

            // 페이즈 진행하면서 progress fill
            await animatePhase(phase, elapsed, totalDuration);
            elapsed += phase.duration;
        }

        // 마지막 step 완료
        steps[steps.length - 1].classList.remove('active');
        steps[steps.length - 1].classList.add('done');
        steps[steps.length - 1].querySelector('.step-status').textContent = '완료';
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressStage.textContent = '분석 완료';

        clearInterval(timeTimer);

        // 잠시 후 대시보드로 이동
        setTimeout(() => {
            const dashParams = new URLSearchParams({
                source,
                name,
                lang: lang === 'auto' ? 'mixed' : lang,
            });
            window.location.href = `dashboard.html?${dashParams.toString()}`;
        }, 700);
    }

    function animatePhase(phase, baseElapsed, totalDuration) {
        return new Promise((resolve) => {
            const start = Date.now();
            const tick = () => {
                const localElapsed = Date.now() - start;
                const localProgress = Math.min(1, localElapsed / phase.duration);
                const overall = (baseElapsed + localProgress * phase.duration) / totalDuration;

                progressFill.style.width = `${Math.floor(overall * 100)}%`;
                progressPercent.textContent = `${Math.floor(overall * 100)}%`;

                phase.updateStats(localProgress);

                if (localProgress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };
            tick();
        });
    }

    function addLog(msg, type = 'info') {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const line = document.createElement('div');
        line.className = 'log-line';
        line.innerHTML = `
            <span class="log-time">[${hh}:${mm}:${ss}]</span>
            <span class="log-msg ${type}">${escapeHtml(msg)}</span>
        `;
        logStream.appendChild(line);
        logStream.scrollTop = logStream.scrollHeight;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
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
});
