// Dashboard — 가짜 분석 결과 렌더링
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || 'zip';
    const rawName = params.get('name') || 'project';
    const lang = params.get('lang') || 'mixed';

    // ===== Project header =====
    document.getElementById('projectSource').textContent =
        source === 'github' ? 'GitHub Repository' : 'ZIP Archive';
    document.getElementById('projectName').textContent = rawName;
    document.getElementById('projectLang').textContent =
        ({
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            python: 'Python',
            java: 'Java',
            rust: 'Rust',
            markdown: 'Markdown',
            c: 'C',
            mixed: 'Multi-language',
        }[lang.toLowerCase()] || 'Multi-language');

    document.getElementById('projectFiles').textContent = '147 files';
    document.getElementById('projectLines').textContent = '12,438 lines';

    // ===== Score animation =====
    const TARGET_SCORE = 87;
    animateScore(TARGET_SCORE);

    // Sub metric bars - animate after small delay
    setTimeout(() => {
        document.querySelectorAll('.meter-fill').forEach((f) => f.classList.add('animate'));
        document.querySelectorAll('.sub-metric-val').forEach((el) => {
            animateNumber(el, parseInt(el.dataset.val, 10), 900);
        });
    }, 200);

    // ===== Dependency / City view toggle =====
    let currentView = 'graph';
    const vizHint = document.getElementById('vizHint');

    document.querySelectorAll('.viz-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view === currentView) return;
            document.querySelectorAll('.viz-toggle-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderViz();
        });
    });

    function renderViz() {
        if (currentView === 'graph') {
            renderDependencyGraph();
            vizHint.textContent = '노드를 호버하면 의존 관계를 강조 표시합니다.';
        } else {
            renderCityView();
            vizHint.textContent = '각 건물이 모듈이에요. 큰 건물일수록 더 중요한 모듈입니다.';
        }
    }

    renderViz();

    // ===== Language bar =====
    renderLanguageBar();

    // ===== File table =====
    renderFileTable();

    // ===== Issues =====
    renderIssues();

    // ===== Suggestions =====
    renderSuggestions();

    // ===== Actions =====
    document.getElementById('reAnalyzeBtn').addEventListener('click', () => {
        window.location.href = 'project-analysis.html';
    });

    document.getElementById('downloadBtn').addEventListener('click', downloadReport);

    async function downloadReport() {
        const btn = document.getElementById('downloadBtn');
        const originalHtml = btn.innerHTML;

        // 라이브러리 로드 확인
        if (!window.html2canvas || !window.jspdf) {
            showToast('PDF 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        // 버튼 로딩 상태
        btn.disabled = true;
        btn.innerHTML = '<span class="dl-spinner"></span> 리포트 생성 중...';

        try {
            // 파일명 만들기: 확장자 제거 + GitHub user/ prefix 제거 + 안전 문자
            const projectName = document.getElementById('projectName').textContent.trim();
            const safe = projectName
                .replace(/\.[^./]+$/, '')        // 확장자 제거 (.zip 등)
                .replace(/^.*\//, '')             // user/ 부분 제거
                .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
                .trim() || 'project';
            const filename = `${safe}_분석.pdf`;

            // 대상 영역
            const target = document.querySelector('.dashboard-main');

            // 잠시 토스트 닫기
            await new Promise((r) => setTimeout(r, 50));

            // 캔버스로 렌더링 (배경 어두운 톤 유지)
            const canvas = await window.html2canvas(target, {
                scale: 2,
                backgroundColor: '#091322',
                useCORS: true,
                logging: false,
                windowWidth: target.scrollWidth,
                windowHeight: target.scrollHeight,
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4',
                compress: true,
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();

            // 이미지의 PDF 너비 = pageW, 높이는 비율 맞춰 계산
            const imgW = pageW;
            const imgH = (canvas.height * imgW) / canvas.width;

            // 멀티 페이지 분할
            let heightLeft = imgH;
            let position = 0;
            const imgData = canvas.toDataURL('image/jpeg', 0.92);

            pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
            heightLeft -= pageH;

            while (heightLeft > 0) {
                position -= pageH;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
                heightLeft -= pageH;
            }

            pdf.save(filename);
            showToast(`${filename} 저장됨`);
        } catch (err) {
            console.error('PDF 생성 실패:', err);
            showToast('리포트 생성 중 오류가 발생했습니다.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }

    // ===========================================

    function animateScore(target) {
        const arc = document.getElementById('scoreArc');
        const numEl = document.getElementById('scoreNum');
        const gradeEl = document.getElementById('scoreGrade');
        const CIRC = 2 * Math.PI * 52; // ~327
        const duration = 1200;
        const start = Date.now();

        function tick() {
            const t = Math.min(1, (Date.now() - start) / duration);
            const eased = easeOut(t);
            const val = Math.floor(eased * target);
            const dash = (eased * target / 100) * CIRC;
            arc.setAttribute('stroke-dasharray', `${dash} ${CIRC}`);
            numEl.textContent = val;
            if (t < 1) requestAnimationFrame(tick);
            else {
                gradeEl.textContent = getGrade(target);
                gradeEl.style.color = getGradeColor(target);
                gradeEl.style.background = getGradeBg(target);
            }
        }
        tick();
    }

    function getGrade(s) {
        if (s >= 90) return 'A · 매우 우수';
        if (s >= 80) return 'B · 우수';
        if (s >= 70) return 'C · 보통';
        if (s >= 60) return 'D · 개선 필요';
        return 'F · 즉시 개선';
    }
    function getGradeColor(s) {
        if (s >= 80) return '#5fcb88';
        if (s >= 70) return '#ffd267';
        return '#ff9a9a';
    }
    function getGradeBg(s) {
        if (s >= 80) return 'rgba(95, 203, 136, 0.12)';
        if (s >= 70) return 'rgba(255, 210, 103, 0.12)';
        return 'rgba(255, 125, 125, 0.12)';
    }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function animateNumber(el, target, duration) {
        const start = Date.now();
        function tick() {
            const t = Math.min(1, (Date.now() - start) / duration);
            el.textContent = Math.floor(easeOut(t) * target);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        tick();
    }

    function renderDependencyGraph() {
        const container = document.getElementById('depGraph');
        const w = container.clientWidth || 600;
        const h = 320;

        // 가짜 모듈 (force-directed-look-alike with manual coords)
        const nodes = [
            { id: 'app',      x: 0.50, y: 0.50, r: 26, label: 'app',      tier: 0 },
            { id: 'router',   x: 0.30, y: 0.28, r: 18, label: 'router',   tier: 1 },
            { id: 'auth',     x: 0.72, y: 0.25, r: 20, label: 'auth',     tier: 1 },
            { id: 'api',      x: 0.80, y: 0.55, r: 22, label: 'api',      tier: 1 },
            { id: 'store',    x: 0.55, y: 0.80, r: 20, label: 'store',    tier: 1 },
            { id: 'ui',       x: 0.18, y: 0.55, r: 22, label: 'ui',       tier: 1 },
            { id: 'utils',    x: 0.30, y: 0.78, r: 14, label: 'utils',    tier: 2 },
            { id: 'models',   x: 0.92, y: 0.78, r: 14, label: 'models',   tier: 2 },
            { id: 'config',   x: 0.10, y: 0.18, r: 12, label: 'config',   tier: 2 },
            { id: 'hooks',    x: 0.08, y: 0.85, r: 12, label: 'hooks',    tier: 2 },
            { id: 'types',    x: 0.92, y: 0.15, r: 12, label: 'types',    tier: 2 },
        ];
        const edges = [
            ['app', 'router'], ['app', 'auth'], ['app', 'api'], ['app', 'store'], ['app', 'ui'],
            ['router', 'config'], ['auth', 'api'], ['auth', 'types'],
            ['api', 'models'], ['api', 'utils'], ['store', 'utils'],
            ['ui', 'hooks'], ['ui', 'store'], ['ui', 'utils'],
            ['hooks', 'utils'], ['models', 'types'],
        ];

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';

        const idx = Object.fromEntries(nodes.map((n) => [n.id, n]));

        // Edges
        edges.forEach(([a, b]) => {
            const na = idx[a], nb = idx[b];
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', na.x * w);
            line.setAttribute('y1', na.y * h);
            line.setAttribute('x2', nb.x * w);
            line.setAttribute('y2', nb.y * h);
            line.setAttribute('class', 'graph-edge');
            line.dataset.from = a;
            line.dataset.to = b;
            svg.appendChild(line);
        });

        // Nodes
        nodes.forEach((n) => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'graph-node');
            g.dataset.id = n.id;
            g.setAttribute('transform', `translate(${n.x * w} ${n.y * h})`);

            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', n.r);
            g.appendChild(c);

            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.textContent = n.label;
            g.appendChild(t);

            g.addEventListener('mouseenter', () => {
                svg.querySelectorAll('.graph-edge').forEach((edge) => {
                    if (edge.dataset.from === n.id || edge.dataset.to === n.id) {
                        edge.classList.add('highlight');
                    }
                });
            });
            g.addEventListener('mouseleave', () => {
                svg.querySelectorAll('.graph-edge.highlight').forEach((edge) =>
                    edge.classList.remove('highlight'),
                );
            });

            svg.appendChild(g);
        });

        container.innerHTML = '';
        container.appendChild(svg);
    }

    function renderCityView() {
        const container = document.getElementById('depGraph');
        const W = container.clientWidth || 600;
        const H = 320;
        const groundY = H - 50;

        // 11개 모듈 → 건물로 (왼쪽부터 도로 따라 늘어선 배치)
        const buildings = [
            { id: 'hooks',  x: 0.045, w: 38, h: 70,  color: '#3a4566' },
            { id: 'config', x: 0.13,  w: 44, h: 60,  color: '#3a4566' },
            { id: 'ui',     x: 0.22,  w: 60, h: 130, color: '#4d5a86' },
            { id: 'utils',  x: 0.33,  w: 44, h: 78,  color: '#3a4566' },
            { id: 'router', x: 0.42,  w: 56, h: 115, color: '#4d5a86' },
            { id: 'app',    x: 0.50,  w: 76, h: 195, color: '#6a7fb6' },
            { id: 'store',  x: 0.59,  w: 56, h: 100, color: '#4d5a86' },
            { id: 'auth',   x: 0.68,  w: 56, h: 135, color: '#4d5a86' },
            { id: 'api',    x: 0.78,  w: 64, h: 158, color: '#4d5a86' },
            { id: 'models', x: 0.88,  w: 44, h: 86,  color: '#3a4566' },
            { id: 'types',  x: 0.955, w: 38, h: 70,  color: '#3a4566' },
        ];

        let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="display:block">`;

        // === Defs ===
        svg += `<defs>
            <linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0a1432"/>
                <stop offset="60%" stop-color="#152045"/>
                <stop offset="100%" stop-color="#1a2552"/>
            </linearGradient>
            <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stop-color="rgba(255,243,200,0.45)"/>
                <stop offset="100%" stop-color="rgba(255,243,200,0)"/>
            </radialGradient>
            <radialGradient id="lightGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stop-color="rgba(255,210,103,0.6)"/>
                <stop offset="100%" stop-color="rgba(255,210,103,0)"/>
            </radialGradient>
        </defs>`;

        // === Sky ===
        svg += `<rect width="${W}" height="${groundY}" fill="url(#citySky)"/>`;

        // === Stars (결정론적 위치) ===
        const stars = [
            [40, 30, 0.7], [110, 50, 0.5], [180, 22, 0.9], [240, 60, 0.6],
            [310, 35, 0.8], [380, 70, 0.5], [450, 28, 0.7], [70, 90, 0.6],
            [200, 95, 0.5], [330, 100, 0.6], [420, 90, 0.7], [80, 130, 0.4],
            [260, 130, 0.5], [490, 110, 0.6], [150, 160, 0.4], [350, 160, 0.5],
        ];
        stars.forEach(([sx, sy, op]) => {
            const px = (sx / 600) * W;
            svg += `<circle cx="${px}" cy="${sy}" r="1" fill="rgba(255,255,255,${op})"/>`;
        });

        // === Moon ===
        const moonX = W * 0.82;
        const moonY = 50;
        svg += `<circle cx="${moonX}" cy="${moonY}" r="38" fill="url(#moonGlow)"/>`;
        svg += `<circle cx="${moonX}" cy="${moonY}" r="14" fill="#fff8d4"/>`;
        svg += `<circle cx="${moonX + 5}" cy="${moonY - 3}" r="11" fill="#152045"/>`;

        // === Ground ===
        svg += `<rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="#080d1a"/>`;
        // 길
        svg += `<rect x="0" y="${groundY + 14}" width="${W}" height="20" fill="#1a2238"/>`;
        // 차선
        for (let dx = -10; dx < W; dx += 32) {
            svg += `<rect x="${dx}" y="${groundY + 23}" width="14" height="2.5" fill="rgba(255,210,103,0.55)"/>`;
        }

        // === 가로등 (도로 따라) ===
        [0.07, 0.18, 0.30, 0.41, 0.54, 0.65, 0.76, 0.88, 0.97].forEach((p) => {
            const lx = p * W;
            const ly = groundY;
            svg += `<circle cx="${lx}" cy="${ly - 15}" r="8" fill="url(#lightGlow)"/>`;
            svg += `<line x1="${lx}" y1="${ly}" x2="${lx}" y2="${ly - 14}" stroke="#3a4566" stroke-width="1.4"/>`;
            svg += `<circle cx="${lx}" cy="${ly - 15}" r="2" fill="#ffd267"/>`;
        });

        // === 나무 (모듈 사이 빈 공간) ===
        [0.085, 0.295, 0.945].forEach((p) => {
            const tx = p * W;
            const ty = groundY;
            svg += `<polygon points="${tx},${ty - 22} ${tx - 7},${ty} ${tx + 7},${ty}" fill="#2a4030"/>`;
            svg += `<polygon points="${tx},${ty - 30} ${tx - 6},${ty - 10} ${tx + 6},${ty - 10}" fill="#2f4838"/>`;
        });

        // === Buildings ===
        buildings.forEach((b) => {
            const bx = b.x * W - b.w / 2;
            const by = groundY - b.h;
            const isMain = b.id === 'app';

            svg += `<g class="city-bldg" data-id="${b.id}">`;

            // 안테나 (높은 건물만)
            if (b.h > 110) {
                svg += `<line x1="${bx + b.w / 2}" y1="${by}" x2="${bx + b.w / 2}" y2="${by - 12}" stroke="#5a6890" stroke-width="1.4"/>`;
                svg += `<circle cx="${bx + b.w / 2}" cy="${by - 12}" r="2" fill="#ff7d7d">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
                </circle>`;
            }

            // 옥상 (메인 건물)
            if (isMain) {
                svg += `<rect x="${bx + b.w * 0.2}" y="${by - 6}" width="${b.w * 0.6}" height="6" fill="${b.color}"/>`;
                svg += `<rect x="${bx + b.w * 0.4}" y="${by - 10}" width="${b.w * 0.2}" height="4" fill="${b.color}"/>`;
            }

            // 본체
            svg += `<rect x="${bx}" y="${by}" width="${b.w}" height="${b.h}" fill="${b.color}" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;

            // 옆면 그림자
            svg += `<rect x="${bx + b.w - 4}" y="${by}" width="4" height="${b.h}" fill="rgba(0,0,0,0.18)"/>`;

            // 창문 (격자)
            const winW = 5, winH = 6, gx = 4, gy = 5;
            const insetX = 5;
            const insetY = isMain ? 14 : 10;
            for (let wy = by + insetY; wy < by + b.h - winH - 4; wy += winH + gy) {
                for (let wx = bx + insetX; wx < bx + b.w - winW - insetX; wx += winW + gx) {
                    // 결정론적 lit 패턴 (id 길이 + 좌표)
                    const seed = (wx * 7 + wy * 13 + b.id.length * 31) % 11;
                    const isLit = seed > 3;
                    const color = isLit
                        ? (seed > 8 ? '#ffe89b' : '#ffd267')
                        : '#1f2840';
                    svg += `<rect x="${wx}" y="${wy}" width="${winW}" height="${winH}" fill="${color}"/>`;
                }
            }

            // 출입구 (지상 가까이)
            const doorW = Math.min(10, b.w * 0.25);
            const doorH = Math.min(14, b.h * 0.12);
            svg += `<rect x="${bx + (b.w - doorW) / 2}" y="${by + b.h - doorH}" width="${doorW}" height="${doorH}" fill="#ffd267" opacity="0.9"/>`;

            // 라벨
            const labelY = groundY + 48;
            svg += `<text class="bldg-label" x="${bx + b.w / 2}" y="${labelY}">${b.id}</text>`;

            svg += `</g>`;
        });

        // === 메인 빌딩 위 "MAIN" 표시 ===
        const mainBldg = buildings.find((b) => b.id === 'app');
        const mbX = mainBldg.x * W;
        const mbY = groundY - mainBldg.h;
        svg += `<g pointer-events="none">
            <rect x="${mbX - 24}" y="${mbY - 28}" width="48" height="16" rx="3" fill="rgba(255,210,103,0.95)"/>
            <text x="${mbX}" y="${mbY - 17}" text-anchor="middle" fill="#1a2238" font-size="9" font-weight="700" font-family="inherit">MAIN</text>
        </g>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    function renderLanguageBar() {
        const langs = [
            { name: 'JavaScript', count: 62, color: '#f1e05a' },
            { name: 'TypeScript', count: 41, color: '#3178c6' },
            { name: 'CSS',        count: 22, color: '#563d7c' },
            { name: 'HTML',       count: 14, color: '#e34c26' },
            { name: 'JSON',       count: 8,  color: '#8a96b0' },
        ];
        const total = langs.reduce((s, l) => s + l.count, 0);

        const bar = document.getElementById('langBar');
        bar.innerHTML = '';
        langs.forEach((l) => {
            const seg = document.createElement('div');
            seg.className = 'lang-bar-seg';
            seg.style.width = `${(l.count / total) * 100}%`;
            seg.style.background = l.color;
            seg.title = `${l.name}: ${l.count} files`;
            bar.appendChild(seg);
        });

        const legend = document.getElementById('langLegend');
        legend.innerHTML = '';
        langs.forEach((l) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="legend-dot" style="background:${l.color}"></span>
                <span class="legend-name">${l.name}</span>
                <span class="legend-count">${l.count} files · ${((l.count / total) * 100).toFixed(1)}%</span>
            `;
            legend.appendChild(li);
        });
    }

    function renderFileTable() {
        const files = [
            { path: 'src/api/',        name: 'handler.js',      lines: 412, cx: 18, score: 58 },
            { path: 'src/store/',      name: 'reducer.ts',      lines: 348, cx: 14, score: 64 },
            { path: 'src/legacy/',     name: 'parser.js',       lines: 521, cx: 22, score: 51 },
            { path: 'src/ui/',         name: 'Dashboard.tsx',   lines: 286, cx: 9,  score: 78 },
            { path: 'src/utils/',      name: 'date.js',         lines: 192, cx: 7,  score: 82 },
            { path: 'src/components/', name: 'Table.tsx',       lines: 245, cx: 8,  score: 80 },
            { path: 'src/hooks/',      name: 'useQuery.ts',     lines: 158, cx: 6,  score: 86 },
            { path: 'src/auth/',       name: 'oauth.js',        lines: 134, cx: 11, score: 71 },
        ];
        const tbody = document.getElementById('fileTableBody');
        tbody.innerHTML = '';
        files.forEach((f) => {
            const cls = f.score < 60 ? 'bad' : f.score < 75 ? 'warn' : 'ok';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="file-path">${escapeHtml(f.path)}</span><span class="file-name">${escapeHtml(f.name)}</span></td>
                <td>${f.lines}</td>
                <td>${f.cx}</td>
                <td><span class="score-pill ${cls}">${f.score}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderIssues() {
        const issues = [
            { type: 'Cyclomatic Complexity', sev: 'high', desc: '함수 복잡도 22 (권장 ≤ 10). 분기 조건이 과다하게 중첩되어 있습니다.', loc: 'src/legacy/parser.js:142' },
            { type: 'Code Duplication',      sev: 'high', desc: '동일한 try/catch 패턴이 6곳에서 반복되고 있습니다.',                       loc: 'src/api/handler.js' },
            { type: 'Long Method',           sev: 'med',  desc: '함수 길이 412줄. 단일 책임 원칙 위배로 보입니다.',                          loc: 'src/api/handler.js:18' },
            { type: 'Dead Code',             sev: 'med',  desc: '참조되지 않는 export 4건이 감지되었습니다.',                                loc: 'src/utils/legacy-helpers.js' },
            { type: 'Magic Number',          sev: 'low',  desc: '리터럴 숫자(30, 86400)가 상수로 추출되지 않고 사용되고 있습니다.',         loc: 'src/utils/date.js:48' },
            { type: 'Inconsistent Naming',   sev: 'low',  desc: 'camelCase와 snake_case가 혼용되고 있습니다.',                              loc: 'src/api/' },
        ];
        const list = document.getElementById('issuesList');
        list.innerHTML = '';
        issues.forEach((i) => {
            const li = document.createElement('li');
            li.className = `issue-item ${i.sev}`;
            li.innerHTML = `
                <div class="issue-head">
                    <span class="issue-type">${escapeHtml(i.type)}</span>
                    <span class="issue-sev ${i.sev}">${i.sev}</span>
                </div>
                <p class="issue-desc">${escapeHtml(i.desc)}</p>
                <p class="issue-loc">${escapeHtml(i.loc)}</p>
            `;
            list.appendChild(li);
        });
    }

    function renderSuggestions() {
        const suggestions = [
            {
                title: 'parser.js의 거대 함수 분할',
                desc: '복잡도 22인 parseInput()을 입력 검증 / 토큰화 / AST 생성 3개 함수로 분리해 가독성과 테스트 가능성을 높일 수 있습니다.',
                impact: '복잡도 22 → 8 예상',
                icon: 'split',
            },
            {
                title: '반복되는 try/catch를 데코레이터로 추출',
                desc: 'api/handler.js의 6개 핸들러가 동일한 에러 처리 패턴을 가지고 있습니다. withErrorHandler() 헬퍼로 묶을 수 있습니다.',
                impact: '중복 −180 줄',
                icon: 'fix',
            },
            {
                title: '미사용 export 제거',
                desc: '4개의 unused export가 번들에 포함되어 있습니다. 제거하면 번들 크기와 빌드 시간이 개선됩니다.',
                impact: '번들 −12 KB',
                icon: 'trash',
            },
            {
                title: 'Magic Number를 상수로 추출',
                desc: '시간 관련 매직 넘버(30, 86400 등)를 SECONDS_IN_DAY 같은 명명된 상수로 추출하면 의미가 명확해집니다.',
                impact: '가독성 ↑',
                icon: 'tag',
            },
            {
                title: '일관된 네이밍 컨벤션 적용',
                desc: 'API 모듈에서 camelCase/snake_case가 혼용되고 있습니다. ESLint 규칙으로 통일을 강제할 수 있습니다.',
                impact: '품질 점수 +3',
                icon: 'tag',
            },
        ];

        const ICONS = {
            split: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h6m6 0h6M9 6l-6 6 6 6m6-12l6 6-6 6"/></svg>',
            fix:   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 1 1-5.4 5.4l-7 7a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l7-7a4 4 0 1 1 5.4-5.4 4 4 0 0 1-4 4z"/></svg>',
            trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
            tag:   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
        };

        const list = document.getElementById('suggestList');
        list.innerHTML = '';
        suggestions.forEach((s) => {
            const div = document.createElement('div');
            div.className = 'suggest-item';
            div.innerHTML = `
                <div class="suggest-head">
                    <span class="suggest-icon">${ICONS[s.icon] || ICONS.fix}</span>
                    <p class="suggest-title">${escapeHtml(s.title)}</p>
                </div>
                <p class="suggest-desc">${escapeHtml(s.desc)}</p>
                <p class="suggest-impact">✦ ${escapeHtml(s.impact)}</p>
            `;
            list.appendChild(div);
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('toastD');
        const msgEl = document.getElementById('toastDMsg');
        msgEl.textContent = msg;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
