// croc.js
document.addEventListener('DOMContentLoaded', () => {
    const teethRow = document.getElementById('teeth-row');
    const upperJaw = document.getElementById('upper-jaw');
    const crocToy = document.querySelector('.croc-toy');
    const msgBox = document.getElementById('msg-box');
    const restartBtn = document.getElementById('restart-btn');
    
    // 장난감처럼 이빨 개수 13개 고정
    const TOTAL_TEETH = 13; 
    let trapIndex = -1;
    let isGameOver = false;

    function initGame() {
        isGameOver = false;
        teethRow.innerHTML = '';
        msgBox.textContent = "두근두근... 이빨을 눌러보세요!";
        msgBox.style.color = "#555";
        restartBtn.style.display = 'none';
        
        // CSS 클래스 초기화 (입 벌리기)
        crocToy.classList.remove('bite');
        crocToy.classList.remove('shake');
        
        // 랜덤 함정 설정
        trapIndex = Math.floor(Math.random() * TOTAL_TEETH);

        // 이빨 생성
        for (let i = 0; i < TOTAL_TEETH; i++) {
            const tooth = document.createElement('button');
            tooth.className = 'tooth-btn';
            
            // 이빨 배치 디자인을 위해 살짝 각도 틀기 (장난감처럼 U자형 느낌)
            if (i < 4) tooth.style.marginTop = '20px'; // 양 옆쪽
            else if (i > 8) tooth.style.marginTop = '20px';
            else tooth.style.marginTop = '0px'; // 앞니

            tooth.onclick = () => handleToothClick(tooth, i);
            teethRow.appendChild(tooth);
        }
    }

    function handleToothClick(tooth, index) {
        if (isGameOver) return;
        
        // 1. 이빨 누르는 효과 (물리적 들어감)
        tooth.classList.add('pressed');
        
        // 2. 소리/진동 효과
        if (navigator.vibrate) navigator.vibrate(30); // 틱!

        // 3. 결과 확인
        if (index === trapIndex) {
            gameOver();
        } else {
            msgBox.textContent = "휴... 살았습니다!";
        }
    }

    function gameOver() {
        isGameOver = true;
        msgBox.textContent = "으악!! 물렸다!!";
        msgBox.style.color = "#d32f2f";

        // 입 닫기 & 쉐이크 애니메이션
        crocToy.classList.add('bite');
        crocToy.classList.add('shake');

        // 강력한 진동 (우우웅!)
        if (navigator.vibrate) navigator.vibrate([100, 50, 400]);

        // 재시작 버튼
        setTimeout(() => {
            restartBtn.style.display = 'inline-block';
        }, 800);
    }

    restartBtn.addEventListener('click', initGame);

    // 눈동자 따라오기 (보너스 디테일)
    document.addEventListener('mousemove', (e) => {
        if (isGameOver) return;
        const pupils = document.querySelectorAll('.pupil');
        const rect = upperJaw.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const x = (e.clientX - centerX) / 30;
        const y = (e.clientY - centerY) / 30;
        
        pupils.forEach(pupil => {
            pupil.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
    });

    initGame();
});