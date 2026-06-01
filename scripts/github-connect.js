// GitHub 연동 페이지 — fake 토큰 검증 + 레포 목록
document.addEventListener('DOMContentLoaded', () => {

    // 가짜 레포 데이터
    const FAKE_REPOS = [
        { full_name: 'sh/refactory-web',     desc: 'RE:Factory 마케팅 웹사이트',         lang: 'TypeScript', lang_color: '#3178c6', stars: 124, updated: '2일 전',  visibility: 'public'  },
        { full_name: 'sh/parser-core',       desc: 'tree-sitter 기반 멀티 언어 파서 코어', lang: 'Rust',       lang_color: '#dea584', stars: 89,  updated: '5일 전',  visibility: 'private' },
        { full_name: 'sh/refactory-cli',     desc: '터미널에서 사용하는 코드 분석 도구',   lang: 'JavaScript', lang_color: '#f1e05a', stars: 56,  updated: '1주 전',  visibility: 'public'  },
        { full_name: 'sh/refactory-api',     desc: '백엔드 API 서버 (FastAPI)',           lang: 'Python',     lang_color: '#3572A5', stars: 78,  updated: '1주 전',  visibility: 'private' },
        { full_name: 'sh/visualizer',        desc: 'D3 기반 코드 구조 시각화 컴포넌트',    lang: 'TypeScript', lang_color: '#3178c6', stars: 41,  updated: '2주 전',  visibility: 'public'  },
        { full_name: 'sh/demo-projects',     desc: '데모 및 테스트용 샘플 프로젝트',       lang: 'JavaScript', lang_color: '#f1e05a', stars: 12,  updated: '3주 전',  visibility: 'public'  },
        { full_name: 'sh/legacy-monolith',   desc: '레거시 모놀리스 (분석 대상)',          lang: 'Java',       lang_color: '#b07219', stars: 3,   updated: '1개월 전', visibility: 'private' },
        { full_name: 'sh/notes-template',    desc: '회고/실험 노트 템플릿',                lang: 'Markdown',   lang_color: '#083fa1', stars: 8,   updated: '2개월 전', visibility: 'public'  },
    ];

    // ===== Stage refs =====
    const stageToken = document.getElementById('stageToken');
    const stageConnecting = document.getElementById('stageConnecting');
    const stageRepos = document.getElementById('stageRepos');

    const tokenInput = document.getElementById('tokenInput');
    const tokenToggle = document.getElementById('tokenToggle');
    const connectBtn = document.getElementById('connectBtn');
    const tokenError = document.getElementById('tokenError');
    const heroTitle = document.getElementById('heroTitle');
    const heroSub = document.getElementById('heroSub');

    const repoList = document.getElementById('repoList');
    const repoSearch = document.getElementById('repoSearch');
    const analyzeRepoBtn = document.getElementById('analyzeRepoBtn');
    const backToTokenBtn = document.getElementById('backToTokenBtn');
    const connectingText = document.getElementById('connectingText');

    let selectedRepo = null;

    // ===== Token 표시 토글 =====
    tokenToggle.addEventListener('click', () => {
        const showing = tokenInput.type === 'text';
        tokenInput.type = showing ? 'password' : 'text';
        tokenToggle.textContent = showing ? '표시' : '숨김';
    });

    tokenInput.addEventListener('input', () => {
        tokenError.hidden = true;
    });

    // ===== 연결하기 =====
    connectBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if (!token) {
            tokenError.textContent = '토큰을 입력해 주세요.';
            tokenError.hidden = false;
            tokenInput.focus();
            return;
        }
        // 형식 체크 (그럴싸하게)
        if (token.length < 20) {
            tokenError.textContent = '토큰 형식이 올바르지 않습니다. (최소 20자 이상)';
            tokenError.hidden = false;
            tokenInput.focus();
            return;
        }

        // 연결 중 stage로 전환
        stageToken.hidden = true;
        stageConnecting.hidden = false;
        connectingText.textContent = 'GitHub에 연결 중...';

        // 가짜 처리
        setTimeout(() => {
            connectingText.textContent = '저장소 목록을 불러오는 중...';
        }, 700);

        setTimeout(() => {
            stageConnecting.hidden = true;
            stageRepos.hidden = false;
            heroTitle.textContent = '저장소 선택';
            heroSub.textContent = `${FAKE_REPOS.length}개의 저장소를 찾았습니다. 분석할 저장소를 하나 선택해 주세요.`;
            renderRepos(FAKE_REPOS);
        }, 1500);
    });

    // ===== 다시 입력 =====
    backToTokenBtn.addEventListener('click', () => {
        stageRepos.hidden = true;
        stageToken.hidden = false;
        heroTitle.textContent = 'GitHub 저장소 연결';
        heroSub.textContent = 'Personal Access Token을 입력하면 본인의 저장소 목록을 불러옵니다. 토큰은 서버에 저장되지 않으며, 분석 후 즉시 폐기됩니다.';
        selectedRepo = null;
        analyzeRepoBtn.disabled = true;
    });

    // ===== 검색 =====
    repoSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = FAKE_REPOS.filter(
            (r) => r.full_name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q),
        );
        renderRepos(filtered);
    });

    // ===== 분석 시작 =====
    analyzeRepoBtn.addEventListener('click', () => {
        if (!selectedRepo) return;
        const params = new URLSearchParams({
            source: 'github',
            repo: selectedRepo.full_name,
            lang: selectedRepo.lang.toLowerCase(),
        });
        window.location.href = `analyzing.html?${params.toString()}`;
    });

    // ===========================================

    function renderRepos(list) {
        repoList.innerHTML = '';
        if (list.length === 0) {
            repoList.innerHTML = '<div class="connecting" style="color:#8a96b0">검색 결과가 없습니다.</div>';
            return;
        }
        list.forEach((repo) => {
            const item = document.createElement('div');
            item.className = 'repo-item';
            item.innerHTML = `
                <div class="repo-radio"></div>
                <div class="repo-body">
                    <p class="repo-name">
                        ${escapeHtml(repo.full_name)}
                        <span class="repo-vis ${repo.visibility}">${repo.visibility}</span>
                    </p>
                    <p class="repo-desc">${escapeHtml(repo.desc)}</p>
                    <p class="repo-meta">
                        <span><span class="lang-dot" style="background:${repo.lang_color}"></span>${escapeHtml(repo.lang)}</span>
                        <span>★ ${repo.stars}</span>
                        <span>업데이트: ${escapeHtml(repo.updated)}</span>
                    </p>
                </div>
            `;
            item.addEventListener('click', () => {
                repoList.querySelectorAll('.repo-item').forEach((el) => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedRepo = repo;
                analyzeRepoBtn.disabled = false;
            });
            repoList.appendChild(item);
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
});
