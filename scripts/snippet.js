// Snippet Analysis — 언어별 예시 + fake 리팩토링 (타이핑 애니메이션)

const EXAMPLES = {
    javascript: {
        label: 'JavaScript',
        hljs: 'javascript',
        before: `function calculateTotal(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
        if (items[i].price > 0) {
            if (items[i].quantity > 0) {
                total = total + items[i].price * items[i].quantity;
            }
        }
    }
    return total;
}

function getCheapItems(items) {
    var cheap = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].price < 10000) {
            cheap.push(items[i]);
        }
    }
    return cheap;
}`,
        after: `const calculateTotal = (items) =>
    items
        .filter(({ price, quantity }) => price > 0 && quantity > 0)
        .reduce((sum, { price, quantity }) => sum + price * quantity, 0);

const getCheapItems = (items) =>
    items.filter(({ price }) => price < 10_000);`,
        metrics: {
            linesBefore: 19, linesAfter: 6,
            cxBefore: 8, cxAfter: 2,
            smellBefore: 4, smellAfter: 0,
            scoreBefore: 62, scoreAfter: 96,
        },
        notes: [
            '중첩 if문을 filter 체이닝으로 단일 표현식화',
            'for 루프 → reduce / filter로 선언형 변환',
            'var → const, 함수 표현식 → 화살표 함수',
            '구조 분해 할당으로 가독성 향상',
            '리터럴 가독성 개선 (10_000)',
            '중복 패턴 제거 및 함수 일관성 확보',
        ],
    },

    typescript: {
        label: 'TypeScript',
        hljs: 'typescript',
        before: `function processOrder(order: any) {
    var discount = 0;
    if (order.type == 'premium') {
        discount = order.amount * 0.2;
    } else if (order.type == 'regular') {
        discount = order.amount * 0.1;
    } else if (order.type == 'trial') {
        discount = order.amount * 0.05;
    } else {
        discount = 0;
    }
    return order.amount - discount;
}`,
        after: `type OrderType = 'premium' | 'regular' | 'trial';

interface Order {
    type: OrderType;
    amount: number;
}

const DISCOUNT_RATES: Record<OrderType, number> = {
    premium: 0.2,
    regular: 0.1,
    trial: 0.05,
};

function processOrder({ type, amount }: Order): number {
    const rate = DISCOUNT_RATES[type] ?? 0;
    return amount * (1 - rate);
}`,
        metrics: {
            linesBefore: 13, linesAfter: 15,
            cxBefore: 5, cxAfter: 1,
            smellBefore: 3, smellAfter: 0,
            scoreBefore: 58, scoreAfter: 95,
        },
        notes: [
            'any 타입 제거 → 명시적 Order 인터페이스 도입',
            '연속된 if/else if → Record로 룩업 테이블화',
            '== → 엄격 비교 불필요 (룩업 방식이 비교 자체를 제거)',
            '매직 넘버를 상수 객체로 추출 (DISCOUNT_RATES)',
            '구조 분해 할당으로 함수 시그니처 명확화',
            'Nullish 병합으로 fallback 단순화',
        ],
    },

    python: {
        label: 'Python',
        hljs: 'python',
        before: `def get_active_users(users):
    result = []
    for user in users:
        if user.is_active == True:
            if user.age >= 18:
                result.append(user)
    return result


def calculate_stats(numbers):
    total = 0
    count = 0
    for n in numbers:
        if n != None:
            total = total + n
            count = count + 1
    if count == 0:
        return 0
    return total / count`,
        after: `def get_active_users(users):
    return [user for user in users if user.is_active and user.age >= 18]


def calculate_stats(numbers):
    valid = [n for n in numbers if n is not None]
    return sum(valid) / len(valid) if valid else 0`,
        metrics: {
            linesBefore: 18, linesAfter: 6,
            cxBefore: 7, cxAfter: 2,
            smellBefore: 5, smellAfter: 0,
            scoreBefore: 60, scoreAfter: 97,
        },
        notes: [
            'for + append → 리스트 컴프리헨션으로 변환',
            '== True / != None → PEP 8 권장 표현(and / is not)',
            '누적 변수 + 카운터 → sum() / len() 내장 함수 활용',
            '중첩 if문 평탄화로 들여쓰기 깊이 감소',
            '엣지 케이스(빈 리스트) 처리를 한 줄로 통합',
        ],
    },

    java: {
        label: 'Java',
        hljs: 'java',
        before: `public List<String> getActiveUserNames(List<User> users) {
    List<String> names = new ArrayList<>();
    for (int i = 0; i < users.size(); i++) {
        User user = users.get(i);
        if (user.isActive()) {
            if (user.getAge() >= 18) {
                if (user.getName() != null) {
                    names.add(user.getName().toUpperCase());
                }
            }
        }
    }
    return names;
}`,
        after: `public List<String> getActiveUserNames(List<User> users) {
    return users.stream()
        .filter(User::isActive)
        .filter(u -> u.getAge() >= 18)
        .map(User::getName)
        .filter(Objects::nonNull)
        .map(String::toUpperCase)
        .collect(Collectors.toList());
}`,
        metrics: {
            linesBefore: 14, linesAfter: 9,
            cxBefore: 6, cxAfter: 1,
            smellBefore: 4, smellAfter: 0,
            scoreBefore: 64, scoreAfter: 96,
        },
        notes: [
            'index 기반 for → Stream API로 선언형 변환',
            '중첩 if문 3단계 → filter 체이닝으로 평탄화',
            'null 체크를 Objects::nonNull 메서드 레퍼런스로 통일',
            'map/filter 메서드 레퍼런스로 표현 간결화',
            '가변 리스트 누적 → Collectors.toList()로 불변성 향상',
        ],
    },

    jsx: {
        label: 'React (JSX)',
        hljs: 'jsx',
        before: `function UserList(props) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('/api/users').then(res => res.json()).then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            {loading ? <p>Loading...</p> : null}
            {users.map(user => {
                return <div key={user.id}>{user.name}</div>;
            })}
        </div>
    );
}`,
        after: `const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/users')
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setUsers(data);
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { users, loading };
};

export function UserList() {
    const { users, loading } = useUsers();

    if (loading) return <p>Loading...</p>;

    return (
        <ul>
            {users.map(({ id, name }) => (
                <li key={id}>{name}</li>
            ))}
        </ul>
    );
}`,
        metrics: {
            linesBefore: 19, linesAfter: 25,
            cxBefore: 5, cxAfter: 2,
            smellBefore: 4, smellAfter: 0,
            scoreBefore: 68, scoreAfter: 94,
        },
        notes: [
            '데이터 fetch 로직을 커스텀 훅(useUsers)으로 분리',
            'unmount 시 상태 업데이트 방지(cancelled 플래그)',
            '삼항 + null 패턴 → early return으로 조건문 명확화',
            '시맨틱 마크업 적용 (div 나열 → ul/li)',
            'map 콜백 내 구조 분해 할당으로 props 명시화',
            '불필요한 props 인자 제거',
        ],
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.lang-tab');
    const input = document.getElementById('codeInput');
    const outputCode = document.getElementById('outputCode');
    const outputPre = document.querySelector('.output-pre');
    const outputPlaceholder = document.getElementById('outputPlaceholder');
    const outputStatus = document.getElementById('outputStatus');
    const inputLang = document.getElementById('inputLang');
    const refactorBtn = document.getElementById('refactorBtn');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const metricsBox = document.getElementById('metrics');
    const actionHint = document.getElementById('actionHint');
    const notesBox = document.getElementById('notes');
    const notesList = document.getElementById('notesList');

    let currentLang = 'javascript';
    let typingAbort = null;

    // ===== 언어 탭 =====
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            currentLang = tab.dataset.lang;
            inputLang.textContent = EXAMPLES[currentLang].label;
            resetOutput();
        });
    });

    // ===== 예시 불러오기 =====
    loadExampleBtn.addEventListener('click', () => {
        input.value = EXAMPLES[currentLang].before;
        input.focus();
        resetOutput();
    });

    // ===== 비우기 =====
    clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        resetOutput();
    });

    // ===== TAB 키로 들여쓰기 =====
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.value = input.value.slice(0, start) + '    ' + input.value.slice(end);
            input.selectionStart = input.selectionEnd = start + 4;
        }
    });

    // ===== 리팩토링 실행 =====
    refactorBtn.addEventListener('click', () => {
        if (!input.value.trim()) {
            input.value = EXAMPLES[currentLang].before;
        }
        startRefactor();
    });

    // ===== 복사 =====
    copyBtn.addEventListener('click', () => {
        const text = outputCode.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '복사됨!';
            setTimeout(() => (copyBtn.textContent = '복사하기'), 1500);
        });
    });

    // ===== 히스토리 (localStorage) =====
    const HISTORY_KEY = 'refactory.snippet.history';
    const MAX_HISTORY = 30;

    const historyBtn = document.getElementById('historyBtn');
    const historyBadge = document.getElementById('historyBadge');
    const drawer = document.getElementById('historyDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const drawerClose = document.getElementById('drawerCloseBtn');
    const drawerCount = document.getElementById('drawerCount');
    const drawerClear = document.getElementById('clearHistoryBtn');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function saveHistory(list) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        } catch {}
    }

    function addHistory(item) {
        const list = loadHistory();
        list.unshift({ id: Date.now(), ts: Date.now(), ...item });
        if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
        saveHistory(list);
        updateHistoryBadge();
    }

    function clearHistory() {
        saveHistory([]);
        renderHistory();
        updateHistoryBadge();
    }

    function updateHistoryBadge() {
        const count = loadHistory().length;
        if (count > 0) {
            historyBadge.hidden = false;
            historyBadge.textContent = count;
        } else {
            historyBadge.hidden = true;
        }
    }

    function timeAgo(ts) {
        const sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 30) return '방금 전';
        if (sec < 60) return `${sec}초 전`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}분 전`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}시간 전`;
        const day = Math.floor(hr / 24);
        if (day < 7) return `${day}일 전`;
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    function renderHistory() {
        const list = loadHistory();
        drawerCount.textContent = `${list.length}개의 기록`;
        drawerClear.disabled = list.length === 0;

        // 기존 아이템 제거
        historyList.querySelectorAll('.history-item').forEach((el) => el.remove());

        if (list.length === 0) {
            historyEmpty.hidden = false;
            return;
        }
        historyEmpty.hidden = true;

        list.forEach((item) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'history-item';
            btn.dataset.id = item.id;

            const preview = (item.before || '').split('\n').slice(0, 3).join('\n');
            const langLabel = EXAMPLES[item.lang]?.label || item.lang;

            btn.innerHTML = `
                <div class="history-item-top">
                    <span class="history-lang">${escapeHtml(langLabel)}</span>
                    <span class="history-time">${timeAgo(item.ts)}</span>
                </div>
                <pre class="history-preview">${escapeHtml(preview)}</pre>
                <div class="history-meta">
                    <span>복잡도 <span class="delta-good">${item.metrics?.cxBefore ?? '-'} → ${item.metrics?.cxAfter ?? '-'}</span></span>
                    <span>점수 <span class="delta-good">${item.metrics?.scoreBefore ?? '-'} → ${item.metrics?.scoreAfter ?? '-'}</span></span>
                </div>
            `;

            btn.addEventListener('click', () => restoreHistory(item));
            historyList.appendChild(btn);
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function restoreHistory(item) {
        // 언어 탭 활성화
        currentLang = item.lang;
        tabs.forEach((t) => t.classList.toggle('active', t.dataset.lang === item.lang));
        inputLang.textContent = EXAMPLES[item.lang]?.label || item.lang;

        // 입력/출력 복원
        input.value = item.before || '';
        resetOutput();

        if (item.after) {
            outputPlaceholder.hidden = true;
            outputPre.hidden = false;
            outputCode.textContent = item.after;
            outputCode.className = `hljs language-${EXAMPLES[item.lang]?.hljs || item.lang}`;
            if (window.hljs) window.hljs.highlightElement(outputCode);
            outputStatus.textContent = '복원됨';
            outputStatus.classList.remove('processing');
            outputStatus.classList.add('done');
            copyBtn.disabled = false;
            if (item.metrics) showMetrics(item.metrics);
            if (item.notes) showNotes(item.notes);
        }

        closeDrawer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openDrawer() {
        renderHistory();
        backdrop.hidden = false;
        // 다음 프레임에 클래스 부여 (transition 작동)
        requestAnimationFrame(() => {
            drawer.classList.add('open');
            backdrop.classList.add('show');
        });
        drawer.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('show');
        drawer.setAttribute('aria-hidden', 'true');
        setTimeout(() => { backdrop.hidden = true; }, 250);
    }

    historyBtn.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    drawerClear.addEventListener('click', () => {
        if (confirm('모든 리팩토링 기록을 삭제할까요?')) clearHistory();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    // 초기 뱃지
    updateHistoryBadge();

    // ===========================================

    function resetOutput() {
        if (typingAbort) {
            typingAbort();
            typingAbort = null;
        }
        outputPlaceholder.hidden = false;
        outputPre.hidden = true;
        outputPre.classList.remove('typing');
        outputCode.textContent = '';
        outputCode.className = 'hljs';
        outputStatus.textContent = '대기 중';
        outputStatus.classList.remove('processing', 'done');
        copyBtn.disabled = true;
        metricsBox.hidden = true;
        actionHint.hidden = false;
        notesBox.hidden = true;
    }

    function startRefactor() {
        const data = EXAMPLES[currentLang];

        refactorBtn.classList.add('loading');
        refactorBtn.disabled = true;
        refactorBtn.querySelector('.btn-text').textContent = '분석 중...';
        outputStatus.textContent = '분석 중...';
        outputStatus.classList.add('processing');
        outputStatus.classList.remove('done');
        outputPlaceholder.hidden = true;
        outputPre.hidden = false;
        outputPre.classList.add('typing');
        outputCode.textContent = '';
        metricsBox.hidden = true;
        notesBox.hidden = true;
        copyBtn.disabled = true;

        // 의사 처리 시간
        setTimeout(() => {
            outputStatus.textContent = '리팩토링 중...';
            typeText(outputCode, data.after, 8, () => {
                outputPre.classList.remove('typing');
                outputStatus.textContent = '완료';
                outputStatus.classList.remove('processing');
                outputStatus.classList.add('done');
                refactorBtn.classList.remove('loading');
                refactorBtn.disabled = false;
                refactorBtn.querySelector('.btn-text').textContent = '다시 실행';
                copyBtn.disabled = false;

                // hljs 적용
                outputCode.className = `hljs language-${data.hljs}`;
                if (window.hljs) {
                    window.hljs.highlightElement(outputCode);
                }

                showMetrics(data.metrics);
                showNotes(data.notes);

                // 히스토리 저장
                addHistory({
                    lang: currentLang,
                    before: input.value,
                    after: data.after,
                    metrics: data.metrics,
                    notes: data.notes,
                });
            });
        }, 1100);
    }

    function typeText(el, text, speed, done) {
        let i = 0;
        let cancelled = false;
        typingAbort = () => { cancelled = true; };

        // 처음에는 빠르게, 끝에 가까울수록 약간 가속
        function tick() {
            if (cancelled) return;
            // 한 번에 여러 글자 출력 (자연스러운 속도)
            const chunk = Math.max(1, Math.floor(text.length / 220));
            i = Math.min(text.length, i + chunk);
            el.textContent = text.slice(0, i);

            // 자동 스크롤
            const pre = el.parentElement;
            pre.scrollTop = pre.scrollHeight;

            if (i < text.length) {
                setTimeout(tick, speed);
            } else {
                typingAbort = null;
                done && done();
            }
        }
        tick();
    }

    function showMetrics(m) {
        document.getElementById('mLinesBefore').textContent = m.linesBefore;
        document.getElementById('mLinesAfter').textContent = m.linesAfter;
        document.getElementById('mCxBefore').textContent = m.cxBefore;
        document.getElementById('mCxAfter').textContent = m.cxAfter;
        document.getElementById('mSmellBefore').textContent = m.smellBefore;
        document.getElementById('mSmellAfter').textContent = m.smellAfter;
        document.getElementById('mScoreBefore').textContent = m.scoreBefore;
        document.getElementById('mScoreAfter').textContent = m.scoreAfter;
        metricsBox.hidden = false;
        actionHint.hidden = true;
    }

    function showNotes(notes) {
        notesList.innerHTML = '';
        notes.forEach((text) => {
            const li = document.createElement('li');
            li.textContent = text;
            notesList.appendChild(li);
        });
        notesBox.hidden = false;
    }
});
