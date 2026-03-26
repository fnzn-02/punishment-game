// roulette.js
document.addEventListener('DOMContentLoaded', () => {
    const colors = [
        "#FFDAB9", "#FFFACD", "#ADD8E6", "#E6E6FA",
        "#E07A5F", "#84947C", "#BDE0FE", "#F25287"
    ];
    let currentPlayers = 2;
    let isSpinning = false;
    let currentAngle = 0;

    const playerCountText = document.getElementById('player-count-text');
    const btnDecrement = document.getElementById('btn-decrement');
    const btnIncrement = document.getElementById('btn-increment');
    const spinBtn = document.getElementById('spin-btn');
    const batchOptionsBtn = document.getElementById('batch-options-btn');
    const clearInputsBtn = document.getElementById('clear-inputs-btn');
    const rouletteCanvas = document.getElementById('roulette-canvas');
    const inputsContainer = document.getElementById('roulette-inputs');
    const outputDiv = document.getElementById('output');
    const ctx = rouletteCanvas.getContext('2d');
    const rouletteSpinner = document.getElementById('roulette-spinner');

    const labelsLayerClass = 'roulette-label';

    function setupRoulette(count) {
        if (count < 2 || count > 8) return;
        const previousValues = Array.from(inputsContainer.querySelectorAll('input')).map(i => i.value);
        currentPlayers = count;
        playerCountText.textContent = currentPlayers;

        rouletteSpinner.style.transition = 'none';
        rouletteSpinner.style.transform = 'rotate(0deg)';
        currentAngle = 0;

        resetRoulette();
        buildInputs(previousValues);
        drawRoulette();
        toggleControls(true);
    }

    function resetRoulette() {
        isSpinning = false;
        outputDiv.innerHTML = '';
        spinBtn.textContent = '돌리기!';
        spinBtn.classList.remove('btn-red');
        spinBtn.classList.add('btn-green');
        removeLabels();
        inputsContainer.style.display = '';
    }

    function removeLabels() {
        const existing = rouletteSpinner.querySelectorAll(`.${labelsLayerClass}`);
        existing.forEach(n => n.remove());
    }

    function buildInputs(previousValues = []) {
        inputsContainer.innerHTML = '';
        const angleStep = 360 / currentPlayers;
        const radius = 120;

        for (let i = 0; i < currentPlayers; i++) {
            const angleDeg = (angleStep * i) + (angleStep / 2) - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            const wrapper = document.createElement('div');
            wrapper.className = 'roulette-input-wrapper';
            wrapper.style.position = 'absolute';
            wrapper.style.top = `calc(50% + ${y}px)`;
            wrapper.style.left = `calc(50% + ${x}px)`;
            wrapper.style.transform = 'translate(-50%, -50%)';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `옵션 ${i + 1}`;
            input.id = `option-${i}`;
            input.value = previousValues[i] || '';
            input.style.transform = 'none';
            wrapper.appendChild(input);
            inputsContainer.appendChild(wrapper);
        }
    }

    function drawRoulette() {
        const arcSize = (2 * Math.PI) / currentPlayers;
        const centerX = rouletteCanvas.width / 2;
        const centerY = rouletteCanvas.height / 2;
        ctx.clearRect(0, 0, rouletteCanvas.width, rouletteCanvas.height);

        const startAngleOffset = -Math.PI / 2;

        for (let i = 0; i < currentPlayers; i++) {
            const angle = startAngleOffset + (i * arcSize);
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, centerX, angle, angle + arcSize);
            ctx.closePath();
            ctx.fill();
        }
    }

    function toggleControls(enabled) {
        btnDecrement.disabled = !enabled || currentPlayers <= 2;
        btnIncrement.disabled = !enabled || currentPlayers >= 8;
        spinBtn.disabled = !enabled;
        batchOptionsBtn.disabled = !enabled;
        clearInputsBtn.disabled = !enabled;
        document.querySelectorAll('.roulette-input-wrapper input').forEach(input => {
            input.disabled = !enabled;
        });
    }

    function renderLabelsFromInputs() {
        removeLabels();
        const angleStep = 360 / currentPlayers;
        const radius = 110;
        const inputs = Array.from(inputsContainer.querySelectorAll('input'));
        for (let i = 0; i < currentPlayers; i++) {
            const val = (inputs[i] && inputs[i].value.trim()) || `옵션 ${i + 1}`;

            const angleDeg = (angleStep * i) + (angleStep / 2) - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            const label = document.createElement('div');
            label.className = labelsLayerClass;
            label.style.position = 'absolute';
            label.style.top = `calc(50% + ${y}px)`;
            label.style.left = `calc(50% + ${x}px)`;

            // 글씨가 각 칸의 방향에 맞춰 회전하도록 설정
            label.style.transform = `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`;

            // ✅ [수정] 글씨가 세로로 표시되도록 writing-mode 속성을 추가합니다.
            label.style.writingMode = 'vertical-rl';

            label.style.pointerEvents = 'none';
            label.style.fontWeight = '700';
            label.style.textAlign = 'center';
            label.style.maxWidth = '150px';
            label.style.whiteSpace = 'nowrap';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.textContent = val;
            rouletteSpinner.appendChild(label);
        }
    }

    async function handleSpin() {
        if (isSpinning) return;

        const options = Array.from(inputsContainer.querySelectorAll('input')).map(i => i.value.trim());
        if (options.some(o => o === '')) {
            alert('모든 옵션을 입력해주세요!');
            return;
        }

        isSpinning = true;
        toggleControls(false);
        spinBtn.textContent = '돌아가는 중...';
        outputDiv.innerHTML = '';

        inputsContainer.style.display = 'none';
        renderLabelsFromInputs();

        const extraRounds = 5 + Math.floor(Math.random() * 3);
        const randomAngle = Math.random() * 360;
        const targetAngle = currentAngle + (360 * extraRounds) + randomAngle;

        rouletteSpinner.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)';
        rouletteSpinner.style.transform = `rotate(${targetAngle}deg)`;
        currentAngle = targetAngle;

        setTimeout(() => {
            const finalAngle = currentAngle % 360;
            const arcSizeDegrees = 360 / currentPlayers;
            const winningAngle = (360 - finalAngle) % 360;
            const winnerIndex = Math.floor(winningAngle / arcSizeDegrees);

            const winnerInput = document.getElementById(`option-${winnerIndex}`);
            const winnerText = winnerInput ? winnerInput.value.trim() : `옵션 ${winnerIndex + 1}`;
            outputDiv.innerHTML = `<span>🎉 결과:</span> <strong>${winnerText}</strong>`;

            isSpinning = false;
            toggleControls(true);
            spinBtn.textContent = '다시 돌리기';
            spinBtn.classList.remove('btn-green');
            spinBtn.classList.add('btn-red');
            setTimeout(() => {
                rouletteSpinner.style.transition = '';
            }, 100);
        }, 5100);
    }

    btnDecrement.addEventListener('click', () => setupRoulette(currentPlayers - 1));
    btnIncrement.addEventListener('click', () => setupRoulette(currentPlayers + 1));
    spinBtn.addEventListener('click', handleSpin);

    batchOptionsBtn.addEventListener('click', () => {
        const inputString = prompt('옵션을 쉼표(,)로 구분하여 입력하세요.\n예: 옵션1,옵션2,옵션3');
        if (!inputString) return;
        const options = inputString.split(',').map(s => s.trim());
        const optionInputs = document.querySelectorAll('.roulette-input-wrapper input');
        optionInputs.forEach((input, idx) => { if (options[idx]) input.value = options[idx]; });
    });

    clearInputsBtn.addEventListener('click', () => {
        if (isSpinning) return;
        document.querySelectorAll('.roulette-input-wrapper input').forEach(input => input.value = '');

        rouletteSpinner.style.transition = 'none';
        rouletteSpinner.style.transform = 'rotate(0deg)';
        currentAngle = 0;

        removeLabels();
        inputsContainer.style.display = '';
        resetRoulette();
    });

    function ensureCanvasSize() {
        const rect = rouletteSpinner.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        rouletteCanvas.width = size;
        rouletteCanvas.height = size;
    }

    ensureCanvasSize();
    window.addEventListener('resize', () => {
        ensureCanvasSize();
        drawRoulette();
    });

    setupRoulette(currentPlayers);
});