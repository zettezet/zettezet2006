// This file contains JavaScript code that adds interactivity to the website.

document.addEventListener('DOMContentLoaded', () => {
    const messageContainer = document.createElement('div');
    messageContainer.id = 'message-container';
    document.body.appendChild(messageContainer);

    const message = document.createElement('h1');
    message.textContent = 'Wishing You Happiness and Joy on June 3, 2025!';
    messageContainer.appendChild(message);

    const button = document.createElement('button');
    button.textContent = 'Click for a Surprise!';
    messageContainer.appendChild(button);

    button.addEventListener('click', () => {
        const surpriseMessage = document.createElement('p');
        surpriseMessage.textContent = 'May your day be filled with love, laughter, and endless joy!';
        messageContainer.appendChild(surpriseMessage);
    });

    const prizes = [
        "🎉 100 Points",
        "🍀 Lucky Day",
        "💰 Jackpot",
        "😅 Try Again",
        "🎁 Gift Box",
        "⭐ Bonus Spin",
        "🙁 Missed",
        "🎊 Surprise"
    ];

    const colors = [
        "#ffecd2", "#fcb69f", "#a1c4fd", "#43e97b",
        "#ff6f61", "#38f9d7", "#ffe066", "#6dd5ed"
    ];

    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spinBtn');
    const result = document.getElementById('result');

    const size = prizes.length;
    const arc = 2 * Math.PI / size;
    let angle = 0;
    let spinning = false;

    // Draw wheel
    function drawWheel() {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < size; i++) {
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.arc(150, 150, 150, i * arc, (i + 1) * arc);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(i * arc + arc / 2);
            ctx.textAlign = "right";
            ctx.font = "bold 18px Arial";
            ctx.fillStyle = "#333";
            ctx.fillText(prizes[i], 130, 10);
            ctx.restore();
        }
        wheel.innerHTML = '';
        wheel.appendChild(canvas);
    }
    drawWheel();

    spinBtn.onclick = function () {
        if (spinning) return;
        spinning = true;
        result.textContent = '';
        let spins = Math.floor(Math.random() * 3) + 5; // 5-7 rounds
        let finalAngle = Math.random() * 2 * Math.PI;
        let totalAngle = spins * 2 * Math.PI + finalAngle;
        let duration = 3500;
        let start = null;

        function animate(ts) {
            if (!start) start = ts;
            let elapsed = ts - start;
            let progress = Math.min(elapsed / duration, 1);
            let ease = 1 - Math.pow(1 - progress, 3);
            angle = ease * totalAngle;
            wheel.style.transform = `rotate(${angle}rad)`;
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                let selected = Math.floor(size - ((angle % (2 * Math.PI)) / arc)) % size;
                result.textContent = `Result: ${prizes[selected]}`;
                spinning = false;
            }
        }
        requestAnimationFrame(animate);
    };
});