document.addEventListener('DOMContentLoaded', () => {
    // --- 상수 및 상태 변수 ---
    const ACCENT_COLOR = '#03c75a';
    let currentPlayers = 2;
    let cols = 0, rows = 0, colX = [], rungGrid = [];
    let animating = false;
    let highlightedPath = [];
    let resultMarkers = [];
    let finishedIndexes = new Set(); // 이미 완료된 참가자 인덱스 저장

    // --- DOM Elements ---
    const playerCountText = document.getElementById('player-count-text');
    const btnDecrement = document.getElementById('btn-decrement');
    const btnIncrement = document.getElementById('btn-increment');
    const regenBtn = document.getElementById('regen-btn');
    const showAllBtn = document.getElementById('show-all-btn');
    const batchNamesBtn = document.getElementById('batch-names-btn');
    const batchResultsBtn = document.getElementById('batch-results-btn');
    const clearInputsBtn = document.getElementById('clear-inputs-btn');
    const gameBoardContent = document.getElementById('game-board-content');
    const ladderCanvas = document.getElementById('ladder-canvas');
    const topRow = document.getElementById('top-row');
    const startRow = document.getElementById('start-row');
    const bottomRow = document.getElementById('bottom-row');
    const outputDiv = document.getElementById('output');
    const ctx = ladderCanvas.getContext('2d');
    // ★★★ 추가된 DOM 요소: 반투명 가리개 ★★★
    const ladderOverlay = document.getElementById('ladder-overlay');

    /** 사다리 전체를 새로 생성하고 그리는 메인 함수 */
    function setupLadder(count) {
        if (count < 2 || count > 10) return;
        currentPlayers = count;
        playerCountText.textContent = currentPlayers;
        cols = count;
        rows = Math.max(8, count * 2 + 3);

        const dpr = window.devicePixelRatio || 1;
        const colWidth = 110;
        const canvasW = cols * colWidth;
        const canvasH = rows * 35 + 60;

        ladderCanvas.width = canvasW * dpr;
        ladderCanvas.height = canvasH * dpr;
        ladderCanvas.style.width = `${canvasW}px`;
        ladderCanvas.style.height = `${canvasH}px`;
        ctx.scale(dpr, dpr);
        
        gameBoardContent.style.width = `${canvasW}px`;
        colX = Array.from({length: cols}, (_, i) => 60 + i * ((canvasW - 120) / (cols - 1 || 1)));

        resetResults();
        randomizeRungs();
        buildInputs();
        drawLadder();
        toggleControls(true);
        // ★★★ 가리개 보이기 ★★★
        showOverlay();
    }
    
    /** 결과 관련 데이터 및 UI 초기화 */
    function resetResults() {
        highlightedPath = [];
        resultMarkers = [];
        finishedIndexes.clear();
        outputDiv.innerHTML = '';
        if (bottomRow) document.querySelectorAll('.bottom-row input.finished').forEach(el => el.classList.remove('finished'));
        if (startRow) document.querySelectorAll('.start-trigger').forEach(btn => btn.disabled = false);
    }
    
    // ★★★ 가리개 제어 함수 추가 ★★★
    function showOverlay() {
        ladderOverlay.classList.add('visible');
    }
    function hideOverlay() {
        ladderOverlay.classList.remove('visible');
    }

    /** 캔버스에 모든 요소를 그림 */
    function drawLadder() {
        const dpr = window.devicePixelRatio || 1;
        const canvasW = ladderCanvas.width / dpr;
        const canvasH = ladderCanvas.height / dpr;
        ctx.clearRect(0, 0, canvasW, canvasH);
        
        ctx.strokeStyle = "#d6dde6"; ctx.lineWidth = 3;
        colX.forEach(x => { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, canvasH - 30); ctx.stroke(); });
        const rowHeight = (canvasH - 60) / rows;
        ctx.strokeStyle = "#334155"; ctx.lineWidth = 4;
        for (let r = 0; r < rows; r++) { const y = 30 + (r + 0.5) * rowHeight; for (let c = 0; c < cols - 1; c++) if (rungGrid[r][c]) { ctx.beginPath(); ctx.moveTo(colX[c], y); ctx.lineTo(colX[c + 1], y); ctx.stroke(); } }
        
        if (highlightedPath.length > 0) {
            ctx.strokeStyle = ACCENT_COLOR; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(highlightedPath[0].x, highlightedPath[0].y);
            for(let i = 1; i < highlightedPath.length; i++) ctx.lineTo(highlightedPath[i].x, highlightedPath[i].y);
            ctx.stroke();
        }

        resultMarkers.forEach(marker => {
            ctx.beginPath(); ctx.fillStyle = ACCENT_COLOR;
            ctx.arc(marker.x, marker.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(marker.label, marker.x, marker.y);
        });
    }

    /** 입력창 및 버튼 생성 */
    /** 입력창 및 버튼 생성 */
    function buildInputs() {
        // ★★★ (추가) 기존 값을 임시 배열에 저장 ★★★
        const oldTopValues = Array.from(topRow.querySelectorAll('input')).map(input => input.value);
        const oldBottomValues = Array.from(bottomRow.querySelectorAll('input')).map(input => input.value);

        topRow.innerHTML = ''; startRow.innerHTML = ''; bottomRow.innerHTML = '';
        
        for (let i = 0; i < cols; i++) {
            const xPos = colX[i];
            
            // --- 상단 참가자 입력 (Top Input) ---
            const inTop = document.createElement('input'); 
            inTop.placeholder = `${i + 1}`; 
            inTop.style.left = `${xPos}px`;
            // ★★★ (추가) 저장된 값 다시 채우기 ★★★
            if (oldTopValues[i]) {
                inTop.value = oldTopValues[i];
            }
            topRow.appendChild(inTop);
            
            // --- 시작 버튼 (Start Trigger) ---
            const trigger = document.createElement('button'); 
            trigger.className = 'start-trigger'; 
            trigger.dataset.index = i; 
            trigger.innerHTML = '▼'; 
            trigger.style.left = `${xPos}px`; 
            startRow.appendChild(trigger);
            
            // --- 하단 결과 입력 (Bottom Input) ---
            const inBottom = document.createElement('input'); 
            inBottom.placeholder = `결과 ${i + 1}`; 
            inBottom.style.left = `${xPos}px`;
            // ★★★ (추가) 저장된 값 다시 채우기 ★★★
            if (oldBottomValues[i]) {
                inBottom.value = oldBottomValues[i];
            }
            bottomRow.appendChild(inBottom);
        }
    }
    
    function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
    
    async function animatePath(path, onUpdate) { 
        for (let i = 0; i < path.length - 1; i++) { 
            await new Promise(resolve => { 
                const p0 = path[i], p1 = path[i+1]; 
                const dx = p1.x - p0.x, dy = p1.y - p0.y; 
                if(dx === 0 && dy === 0) return resolve(); 
                const dist = Math.sqrt(dx*dx + dy*dy); 
                const duration = Math.max(50, (dist / 100) * 100); 
                const start = performance.now(); 
                function frame(now) { 
                    const t = easeInOutCubic(Math.min(1, (now - start) / duration)); 
                    const currentX = p0.x + dx * t;
                    const currentY = p0.y + dy * t;
                    highlightedPath = path.slice(0, i + 1); 
                    highlightedPath.push({x: currentX, y: currentY});
                    if (typeof onUpdate === 'function') onUpdate(currentX, currentY);
                    drawLadder(); 
                    if (t < 1) requestAnimationFrame(frame); 
                    else resolve(); 
                } 
                requestAnimationFrame(frame); 
            }); 
        } 
    }
    
    async function replayAnimation(index) {
        if (animating) return;
        animating = true;
        toggleControls(false);
        try {
            highlightedPath = []; 
            resultMarkers = resultMarkers.filter(m => m.startIndex !== index);
            const path = buildPathForStart(index);
            const names = Array.from(topRow.querySelectorAll('input')).map((input, i) => input.value.trim() || `${i + 1}`);
            const nameLabel = (names[index] || `${index+1}`).substring(0, 2);
            const dpr = window.devicePixelRatio || 1;
            const canvasH = ladderCanvas.height / dpr;
            
            const startX = path[0].x;
            const startY = path[0].y;
            const marker = { x: startX, y: startY, label: nameLabel, startIndex: index };
            resultMarkers.push(marker);
            drawLadder();
            
            await animatePath(path, (x,y) => {
                marker.x = x;
                marker.y = y;
            });
            
            const mapping = computeFinalMapping();
            const finalIndex = mapping[index];
            marker.x = colX[finalIndex];
            marker.y = canvasH - 22;
            drawLadder();

        } finally {
            animating = false;
            toggleControls(true);
        }
    }

    async function runLadderFor(index) {
        // ★★★ 가리개 숨기기 ★★★
        hideOverlay();
        if (finishedIndexes.has(index)) {
            await replayAnimation(index);
            return;
        }
        if (animating) return;
        
        animating = true;
        toggleControls(false);

        try {
            highlightedPath = [];
            const names = Array.from(topRow.querySelectorAll('input')).map((input, i) => input.value.trim() || `${i + 1}`);
            const results = Array.from(bottomRow.querySelectorAll('input')).map((input, i) => input.value.trim() || `꽝`);
            
            const path = buildPathForStart(index);
            const mapping = computeFinalMapping();
            const finalIndex = mapping[index];
            const nameLabel = (names[index] || `${index+1}`).substring(0, 2);
            const dpr = window.devicePixelRatio || 1;
            const canvasH = ladderCanvas.height / dpr;
            
            const startMarker = { x: path[0].x, y: path[0].y, label: nameLabel, startIndex: index };
            resultMarkers.push(startMarker);
            drawLadder(); 
            
            await animatePath(path, (x,y) => {
                startMarker.x = x;
                startMarker.y = y;
            });
            
            startMarker.x = colX[finalIndex];
            startMarker.y = canvasH - 22;
            drawLadder();

            finishedIndexes.add(index);

            const pair = document.createElement('div');
            pair.className = 'pair';
            pair.innerHTML = `<div>${names[index]}</div> <div>⇢</div> <div>${results[finalIndex]}</div>`;
            outputDiv.appendChild(pair);
            document.querySelectorAll('.bottom-row input')[finalIndex].classList.add('finished');

        } finally {
            animating = false;
            toggleControls(true);
        }
    }
    
    function toggleControls(enabled) {
        btnDecrement.disabled = !enabled || currentPlayers <= 2;
        btnIncrement.disabled = !enabled || currentPlayers >= 10;
        regenBtn.disabled = !enabled;
        showAllBtn.disabled = !enabled;
        batchNamesBtn.disabled = !enabled;
        batchResultsBtn.disabled = !enabled;
        clearInputsBtn.disabled = !enabled;
        document.querySelectorAll('.start-trigger').forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    function buildPathForStart(startIndex) { const path = []; const dpr = window.devicePixelRatio || 1; const canvasH = ladderCanvas.height / dpr; let col = startIndex; const rowHeight = (canvasH - 60) / rows; let x = colX[col]; path.push({ x, y: 30 }); for (let r = 0; r < rows; r++) { const yRow = 30 + (r + 0.5) * rowHeight; path.push({ x, y: yRow }); if (col < cols - 1 && rungGrid[r][col]) x = colX[++col]; else if (col > 0 && rungGrid[r][col - 1]) x = colX[--col]; path.push({ x, y: yRow }); } path.push({ x, y: canvasH - 30 }); return path; }
    
    function randomizeRungs() {
        // ★★★ 가로선 밀도 1.5배 증가 ★★★
        const baseDensity = 0.23 + (cols / 10) * 0.12; 
        const density = Math.min(0.8, baseDensity * 1.5); // 1.5배 늘리되, 너무 빽빽하지 않게 최대 80% 확률로 제한
        
        rungGrid = Array.from({ length: rows }, () => new Array(cols - 1).fill(false));
        for (let r = 0; r < rows; r++) { for (let c = 0; c < cols - 1; c++) { if (Math.random() < density) { const prevRung = c > 0 ? rungGrid[r][c-1] : false; if (!prevRung) rungGrid[r][c] = true; } } }
        for (let c = 0; c < cols - 1; c++) { let hasRung = false; for (let r = 0; r < rows; r++) { if (rungGrid[r][c]) { hasRung = true; break; } } if (!hasRung) { let placed = false; for (let attempt = 0; attempt < 10; attempt++) { const randomRow = Math.floor(Math.random() * rows); const prevRung = c > 0 ? rungGrid[randomRow][c-1] : false; const nextRung = c < cols - 2 ? rungGrid[randomRow][c+1] : false; if (!prevRung && !nextRung) { rungGrid[randomRow][c] = true; placed = true; break; } } if (!placed) { rungGrid[0][c] = true; } } }
    }

    function computeFinalMapping() { return Array.from({ length: cols }, (_, s) => { let c = s; for (let r=0;r<rows;r++){if(c<cols-1&&rungGrid[r][c])c++;else if(c>0&&rungGrid[r][c-1])c--;} return c; }); }

    // --- Event Listeners ---
    btnDecrement.addEventListener('click', () => setupLadder(currentPlayers - 1));
    btnIncrement.addEventListener('click', () => setupLadder(currentPlayers + 1));
    
    regenBtn.addEventListener('click', () => { 
        if (animating) return;
        resetResults();
        randomizeRungs();
        drawLadder();
        toggleControls(true);
        // ★★★ 가리개 보이기 ★★★
        showOverlay();
    });

    showAllBtn.addEventListener('click', async () => {
        if (animating) return;
        // ★★★ 가리개 숨기기 ★★★
        hideOverlay();
        animating = true;
        toggleControls(false);

        try {
            resetResults();
            const mapping = computeFinalMapping();
            const names = Array.from(topRow.querySelectorAll('input')).map((input, i) => input.value.trim() || `${i + 1}`);
            const results = Array.from(bottomRow.querySelectorAll('input')).map((input, i) => input.value.trim() || `꽝`);
            const dpr = window.devicePixelRatio || 1;
            const canvasH = ladderCanvas.height / dpr;

            for (let i = 0; i < cols; i++) {
                try {
                    const path = buildPathForStart(i);
                    const finalIndex = mapping[i];
                    const nameLabel = (names[i] || `${i + 1}`).substring(0, 2);
                    const marker = { x: path[0].x, y: path[0].y, label: nameLabel, startIndex: i };
                    finishedIndexes.add(i);
                    resultMarkers.push(marker);
                    drawLadder();
                    
                    await animatePath(path, (x,y) => {
                        marker.x = x;
                        marker.y = y;
                    });
                    
                    marker.x = colX[finalIndex];
                    marker.y = canvasH - 22;
                    drawLadder();

                    const pair = document.createElement('div');
                    pair.className = 'pair';
                    pair.innerHTML = `<div>${names[i]}</div> <div>⇢</div> <div>${results[finalIndex]}</div>`;
                    outputDiv.appendChild(pair);
                    document.querySelectorAll('.bottom-row input')[finalIndex].classList.add('finished');
                    
                    if (i < cols - 1) {
                        await new Promise(res => setTimeout(res, 150));
                        highlightedPath = [];
                        drawLadder();
                    }
                    
                } catch (error) {
                    console.error(`An error occurred for player ${i+1}:`, error);
                    continue; 
                }
            }
        } finally {
            animating = false;
            toggleControls(true);
        }
    });
    
    startRow.addEventListener('click', (e) => {
        if(e.target.classList.contains('start-trigger')) {
            const index = parseInt(e.target.dataset.index, 10);
            runLadderFor(index);
        }
    });
    
    batchNamesBtn.addEventListener('click', () => {
        const inputString = prompt('참가자 이름을 쉼표(,)로 구분하여 입력하세요.\n예: 유저1,유저2,유저3');
        if (inputString === null || inputString.trim() === '') return;
        const names = inputString.split(',').map(name => name.trim());
        const nameInputs = topRow.querySelectorAll('input');
        nameInputs.forEach((input, index) => { if (names[index]) input.value = names[index]; });
    });

    batchResultsBtn.addEventListener('click', () => {
        const inputString = prompt('결과를 쉼표(,)로 구분하여 입력하세요.\n예: 당첨,꽝,벌칙1,벌칙2,통과');
        if (inputString === null || inputString.trim() === '') return;
        const results = inputString.split(',').map(result => result.trim());
        const resultInputs = bottomRow.querySelectorAll('input');
        resultInputs.forEach((input, index) => { if (results[index]) input.value = results[index]; });
    });
    
    clearInputsBtn.addEventListener('click', () => {
        if(animating) return;
        topRow.querySelectorAll('input').forEach(input => input.value = '');
        bottomRow.querySelectorAll('input').forEach(input => input.value = '');
        
        resetResults();
        drawLadder();
        toggleControls(true);
        // ★★★ 가리개 보이기 ★★★
        showOverlay();
    });

    setupLadder(currentPlayers);
});