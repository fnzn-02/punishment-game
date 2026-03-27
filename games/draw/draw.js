document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 및 상태 변수 정의 ---
    const playerColors = [
        "#87CEEB", "#FFD700", "#90EE90", "#FFB6C1",
        "#BA55D3", "#FFA07A", "#20B2AA", "#DDA0DD"
    ];
    const playerColorNames = [
        "블루", "옐로우", "그린", "핑크",
        "퍼플", "오렌지", "민트", "연보라"
    ];

    const playerCountText = document.getElementById('player-count-text');
    const btnDecrement = document.getElementById('btn-decrement');
    const btnIncrement = document.getElementById('btn-increment');
    const startBtn = document.getElementById('start-btn');
    const batchOptionsBtn = document.getElementById('batch-options-btn');
    const clearInputsBtn = document.getElementById('clear-inputs-btn');
    const drawAnimationArea = document.querySelector('.draw-animation-area'); 
    const drawJar = document.querySelector('.draw-jar');
    const drawJarPapers = document.querySelector('.draw-jar-papers');
    const inputsContainer = document.getElementById('inputs-container');
    const choicesContainer = document.getElementById('choices-container');
    const messageArea = document.getElementById('message-area');
    const outputDiv = document.getElementById('output');

    let currentPlayers = 2;
    let resultOptions = [];
    let isGameStarted = false;
    let isAnimating = false;
    let finishedPapers = 0;
    let currentPaperZone = null; // 현재 떠 있는 3D 카드를 저장

    // --- 2. 기본 UI/UX 제어 함수 ---
    function updatePlayerCount(count) {
        if (isGameStarted) return; 
        if (count < 2 || count > 8) return;

        const existingValues = Array.from(inputsContainer.querySelectorAll('input')).map(input => input.value);
        currentPlayers = count;
        playerCountText.textContent = currentPlayers;
        btnDecrement.disabled = (currentPlayers <= 2);
        btnIncrement.disabled = (currentPlayers >= 8);

        buildInputs(existingValues);
        buildJarPapers();
    }

    function buildInputs(existingValues = []) {
        inputsContainer.innerHTML = '';
        for (let i = 0; i < currentPlayers; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'draw-input-wrapper';
            
            const label = document.createElement('label');
            label.textContent = `${i + 1}번`;
            wrapper.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `결과 입력`;
            input.id = `option-${i}`;
            
            if (existingValues[i]) input.value = existingValues[i];
            wrapper.appendChild(input);

            inputsContainer.appendChild(wrapper);
        }
    }

    function buildJarPapers() {
        drawJarPapers.innerHTML = '';
        const jarPaperColors = ['#fdfd96', '#add8e6', '#ffb3ba', '#bada55', '#d4a5a5', '#e9c46a', '#a2d2ff', '#cdb4db'];
        for (let i = 0; i < currentPlayers; i++) {
            const paper = document.createElement('div');
            paper.style.setProperty('--angle', (Math.random() - 0.5) * 30);
            paper.style.backgroundColor = jarPaperColors[i % jarPaperColors.length];
            drawJarPapers.appendChild(paper);
        }
    }

    function toggleControls(enabled) {
        btnDecrement.disabled = !enabled || currentPlayers <= 2;
        btnIncrement.disabled = !enabled || currentPlayers >= 8;
        batchOptionsBtn.disabled = !enabled;
        clearInputsBtn.disabled = !enabled;
       
        inputsContainer.querySelectorAll('input').forEach(input => {
            input.disabled = !enabled;
        });
    }

    // --- 3. 게임 로직 및 애니메이션 ---
    function shuffleArray(array) {
        let newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    startBtn.addEventListener('click', () => {
        if (isGameStarted) {
            resetGame();
            return;
        }

        const options = Array.from(inputsContainer.querySelectorAll('input')).map(input => input.value.trim());

        if (options.some(option => option === '')) {
            alert('모든 결과를 입력해주세요!');
            return;
        }

        resultOptions = shuffleArray(options);
        isGameStarted = true;
        finishedPapers = 0;
        toggleControls(false);
        startBtn.textContent = '게임 리셋';
        startBtn.classList.remove('btn-green');
        startBtn.classList.add('btn-red');
        startBtn.disabled = false;
        
        messageArea.innerHTML = '<span>아래의 제비를 선택하세요.</span>';
        messageArea.style.display = 'block';
        outputDiv.innerHTML = ''; 

        inputsContainer.style.display = 'none';
        choicesContainer.style.display = 'flex';
        drawJar.classList.add('started');

        buildChoices();
    });

    function resetGame() {
        isGameStarted = false;
        toggleControls(true);
        startBtn.textContent = '시작하기';
        startBtn.classList.remove('btn-red');
        startBtn.classList.add('btn-green');
        startBtn.disabled = false;
        
        messageArea.innerHTML = '';
        messageArea.style.display = 'none';
        outputDiv.innerHTML = '';
        
        inputsContainer.style.display = 'flex';
        choicesContainer.style.display = 'none';
        drawJar.classList.remove('started');

        choicesContainer.innerHTML = '';
        
        if (currentPaperZone) {
            currentPaperZone.remove();
            currentPaperZone = null;
        }
        
        isAnimating = false;
    }

    function buildChoices() {
        choicesContainer.innerHTML = '';
        for (let i = 0; i < currentPlayers; i++) {
            const button = document.createElement('button');
            button.className = 'folded-paper-button';
            button.style.backgroundColor = playerColors[i % playerColorNames.length];
            button.dataset.result = resultOptions[i];
            button.dataset.colorName = playerColorNames[i % playerColorNames.length];
            button.textContent = playerColorNames[i % playerColorNames.length];

            button.addEventListener('click', handlePaperClick);
            choicesContainer.appendChild(button);
        }
    }

    async function handlePaperClick(event) {
        if (isAnimating) return;
        isAnimating = true;

        // 이전 카드 제거 (새 카드 뜨기 전)
        if (currentPaperZone) {
            currentPaperZone.remove();
            currentPaperZone = null;
        }

        const clickedButton = event.currentTarget;
        clickedButton.disabled = true;

        const resultText = clickedButton.dataset.result;
        const colorName = clickedButton.dataset.colorName;
        const paperColor = clickedButton.style.backgroundColor;

        const paperZone = document.createElement('div');
        paperZone.className = 'paper-animation-zone';
        paperZone.innerHTML = `
            <div class="paper-face paper-front" style="background-color:${paperColor};"></div>
            <div class="paper-face paper-back" style="background-color:${paperColor};">
                <span>${colorName} 결과...</span>
                <strong>${resultText}</strong>
            </div>
        `;
        drawAnimationArea.appendChild(paperZone);

        messageArea.innerHTML = `<span>${colorName} 제비를 뽑고 있습니다...</span>`;
        
        await new Promise(resolve => setTimeout(resolve, 50));
        paperZone.classList.add('pull-out');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        paperZone.classList.remove('pull-out');
        paperZone.classList.add('unfold');
        await new Promise(resolve => setTimeout(resolve, 1200));

        // 결과 유지
        currentPaperZone = paperZone;
        
        finishedPapers++;

        // 결과 출력 누적
        outputDiv.innerHTML += `
            <div class="result-line">
                <span>🎉 ${colorName} 결과:</span>
                <strong>${resultText}</strong>
            </div>
        `;
        
        if (finishedPapers < currentPlayers) {
            messageArea.innerHTML = '<span>다음 제비를 선택하세요.</span>';
        } else {
            messageArea.innerHTML = '<span>모든 제비를 뽑았습니다!</span>';
        }
        
        isAnimating = false;
    }

    // --- 4. 초기 설정 및 이벤트 리스너 ---
    btnDecrement.addEventListener('click', () => updatePlayerCount(currentPlayers - 1));
    btnIncrement.addEventListener('click', () => updatePlayerCount(currentPlayers + 1));

    clearInputsBtn.addEventListener('click', () => {
        if (isGameStarted) return;
        inputsContainer.querySelectorAll('input').forEach(input => input.value = '');
    });

    batchOptionsBtn.addEventListener('click', () => {
        if (isGameStarted) return;
        const inputString = prompt('결과를 쉼표(,)로 구분하여 입력하세요.\n(색상 순서대로 적용됩니다)');
        if (!inputString) return;

        const options = inputString.split(',').map(s => s.trim());
        inputsContainer.querySelectorAll('input').forEach((input, index) => {
            input.value = options[index] || '';
        });
    });

    updatePlayerCount(currentPlayers);
});
