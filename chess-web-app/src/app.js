const board = document.getElementById('chess-board');

const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };

let initialBoard = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
];

let selected = null;
let turn = 'w'; // 'w' cho trắng, 'b' cho đen
let aiLevel = 1; // 1: dễ, 2: trung bình, 3: khó

// Thêm nút chọn cấp độ AI (chỉ còn Dễ, Trung bình, Khó)
const levelDiv = document.createElement('div');
levelDiv.id = 'level-select';
['Dễ', 'Trung bình', 'Khó'].forEach((txt, i) => {
    const btn = document.createElement('button');
    btn.textContent = txt;
    btn.className = 'level-btn' + (i === aiLevel - 1 ? ' active' : '');
    btn.onclick = () => {
        aiLevel = i + 1; // Luôn là 1, 2, 3
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        restartGame();
    };
    levelDiv.appendChild(btn);
});
document.body.insertBefore(levelDiv, board);

// Thêm đồng hồ cho mỗi bên
let whiteTime = 300; // giây
let blackTime = 300; // giây
let timerInterval = null;

// Thêm vùng hiển thị đồng hồ
const clockDiv = document.createElement('div');
clockDiv.id = 'clock-bar';
clockDiv.style.display = 'flex';
clockDiv.style.justifyContent = 'center';
clockDiv.style.gap = '32px';
clockDiv.style.margin = '16px 0';
clockDiv.innerHTML = `
    <div id="white-clock" style="color:#ffe066;font-size:1.2rem;">Trắng: 01:00</div>
    <div id="black-clock" style="color:#ff6f61;font-size:1.2rem;">Đen: 01:00</div>
`;
document.body.insertBefore(clockDiv, board);

// Hàm kiểm tra quân trắng
function isWhite(piece) { return piece && piece === piece.toUpperCase(); }
// Hàm kiểm tra quân đen
function isBlack(piece) { return piece && piece === piece.toLowerCase(); }

function renderBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'chess-cell' + ((row + col) % 2 ? ' dark' : '');
            cell.dataset.row = row;
            cell.dataset.col = col;
            const piece = initialBoard[row][col];
            if (piece) {
                cell.textContent = pieces[piece];
                cell.classList.add(isWhite(piece) ? 'white-piece' : 'black-piece');
            }
            if (selected && selected.row == row && selected.col == col) {
                cell.classList.add('selected');
            }
            cell.addEventListener('click', onCellClick);
            board.appendChild(cell);
        }
    }
}

function onCellClick(e) {
    // Nếu chơi với AI thì chỉ cho phép người (trắng) đi
    if (aiLevel > 0 && turn === 'b') return;

    const row = Number(this.dataset.row);
    const col = Number(this.dataset.col);
    const piece = initialBoard[row][col];

    if (selected) {
        if (selected.row === row && selected.col === col) {
            selected = null;
            renderBoard();
            return;
        }
        const fromPiece = initialBoard[selected.row][selected.col];
        if ((turn === 'w' && isWhite(fromPiece)) || (turn === 'b' && isBlack(fromPiece))) {
            // Chỉ di chuyển nếu hợp lệ
            if (isValidMove(selected, {row, col}, turn)) {
                const captured = initialBoard[row][col];
                const fromPiece = initialBoard[selected.row][selected.col];
                initialBoard[row][col] = fromPiece;
                initialBoard[selected.row][selected.col] = '';
                // Kiểm tra phong tốt cho người chơi
                if ((fromPiece === 'P' && row === 0) || (fromPiece === 'p' && row === 7)) {
                    promotePawn(row, col, fromPiece === 'P' ? 'w' : 'b', (newPiece) => {
                        initialBoard[row][col] = newPiece;
                        selected = null;
                        turn = turn === 'w' ? 'b' : 'w';
                        afterMoveActions();
                        if (captured === 'k') {
                            setTimeout(() => {
                                alert('Bạn đã thắng!');
                                let add = aiLevel === 1 ? 10 : aiLevel === 2 ? 50 : 100;
                                chessScore += add;
                                saveChessScore();
                                updateChessScoreDisplay();
                                alert(`Bạn đã thắng! +${add} điểm`);
                                restartGame();
                            }, 100);
                            return;
                        }
                        if (aiLevel > 0 && turn === 'b') setTimeout(aiMove, 400);
                    });
                    return;
                }
                selected = null;
                turn = turn === 'w' ? 'b' : 'w';
                afterMoveActions();
                if (captured === 'k') {
                    setTimeout(() => {
                        alert('Bạn đã thắng!');
                        let add = aiLevel === 1 ? 10 : aiLevel === 2 ? 50 : 100;
                        chessScore += add;
                        saveChessScore();
                        updateChessScoreDisplay();
                        alert(`Bạn đã thắng! +${add} điểm`);
                        restartGame();
                    }, 100);
                    return;
                }
                if (aiLevel > 0 && turn === 'b') setTimeout(aiMove, 400);
            }
        }
    } else if (piece && ((turn === 'w' && isWhite(piece)) || (turn === 'b' && isBlack(piece)))) {
        selected = { row, col };
        renderBoard();
    }
}

// Kiểm tra nước đi hợp lệ cho từng quân cờ
function isValidMove(from, to, color) {
    const piece = initialBoard[from.row][from.col];
    const target = initialBoard[to.row][to.col];
    if (!piece) return false;
    if (color === 'w' && isWhite(target)) return false;
    if (color === 'b' && isBlack(target)) return false;
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    let valid = false;
    switch (piece.toLowerCase()) {
        case 'p': { // Tốt
            let dir = isWhite(piece) ? -1 : 1;
            // Đi thẳng
            if (dc === 0 && !target) {
                if (dr === dir) valid = true;
                // Đi 2 bước từ vị trí xuất phát
                if (dr === 2 * dir && ((isWhite(piece) && from.row === 6) || (isBlack(piece) && from.row === 1))) {
                    const between = initialBoard[from.row + dir][from.col];
                    if (!between) valid = true;
                }
            }
            // Ăn chéo
            if (Math.abs(dc) === 1 && dr === dir && target && ((color === 'w' && isBlack(target)) || (color === 'b' && isWhite(target)))) {
                valid = true;
            }
            break;
        }
        case 'n': // Mã
            valid = (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
            break;
        case 'b': // Tượng
            if (Math.abs(dr) !== Math.abs(dc)) break;
            valid = true;
            for (let i = 1; i < Math.abs(dr); i++) {
                let r = from.row + i * Math.sign(dr);
                let c = from.col + i * Math.sign(dc);
                if (initialBoard[r][c]) valid = false;
            }
            break;
        case 'r': // Xe
            if (dr !== 0 && dc !== 0) break;
            valid = true;
            let steps = Math.max(Math.abs(dr), Math.abs(dc));
            for (let i = 1; i < steps; i++) {
                let r = from.row + (dr === 0 ? 0 : i * Math.sign(dr));
                let c = from.col + (dc === 0 ? 0 : i * Math.sign(dc));
                if (initialBoard[r][c]) valid = false;
            }
            break;
        case 'q': // Hậu
            if (Math.abs(dr) === Math.abs(dc)) {
                valid = true;
                for (let i = 1; i < Math.abs(dr); i++) {
                    let r = from.row + i * Math.sign(dr);
                    let c = from.col + i * Math.sign(dc);
                    if (initialBoard[r][c]) valid = false;
                }
            } else if (dr === 0 || dc === 0) {
                valid = true;
                let steps = Math.max(Math.abs(dr), Math.abs(dc));
                for (let i = 1; i < steps; i++) {
                    let r = from.row + (dr === 0 ? 0 : i * Math.sign(dr));
                    let c = from.col + (dc === 0 ? 0 : i * Math.sign(dc));
                    if (initialBoard[r][c]) valid = false;
                }
            }
            break;
        case 'k': // Vua
            valid = Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
            break;
        default:
            valid = false;
    }
    // Kiểm tra nước đi có làm vua mình bị chiếu không
    if (valid) {
        let tempBoard = initialBoard.map(row => row.slice());
        tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
        tempBoard[from.row][from.col] = '';
        if (isKingInCheck(tempBoard, color)) return false;
        return true;
    }
    return false;
}

// Lấy tất cả nước đi hợp lệ cho AI hoặc người chơi
function getAllMoves(color) {
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = initialBoard[r][c];
            if ((color === 'w' && isWhite(piece)) || (color === 'b' && isBlack(piece))) {
                for (let r2 = 0; r2 < 8; r2++) {
                    for (let c2 = 0; c2 < 8; c2++) {
                        if (r !== r2 || c !== c2) {
                            if (isValidMove({row: r, col: c}, {row: r2, col: c2}, color)) {
                                const target = initialBoard[r2][c2];
                                moves.push({from: {row: r, col: c}, to: {row: r2, col: c2}, capture: target});
                            }
                        }
                    }
                }
            }
        }
    }
    return moves;
}

// Kiểm tra vua có bị chiếu không
function isKingInCheck(board, color) {
    let king = color === 'w' ? 'K' : 'k';
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) {
                kingPos = { row: r, col: c };
                break;
            }
        }
    }
    if (!kingPos) return false;
    let enemyColor = color === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if ((enemyColor === 'w' && piece && piece === piece.toUpperCase()) ||
                (enemyColor === 'b' && piece && piece === piece.toLowerCase())) {
                if (isValidMoveOnBoard({ row: r, col: c }, kingPos, enemyColor, board)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Kiểm tra nước đi hợp lệ trên một bàn cờ bất kỳ (dùng cho kiểm tra chiếu)
function isValidMoveOnBoard(from, to, color, boardState) {
    const piece = boardState[from.row][from.col];
    const target = boardState[to.row][to.col];
    if (!piece) return false;
    if (color === 'w' && target && target === target.toUpperCase()) return false;
    if (color === 'b' && target && target === target.toLowerCase()) return false;
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    let valid = false;
    switch (piece.toLowerCase()) {
        case 'p': {
            let dir = piece === piece.toUpperCase() ? -1 : 1;
            if (dc === 0 && !target) {
                if (dr === dir) valid = true;
                if (dr === 2 * dir && ((piece === piece.toUpperCase() && from.row === 6) || (piece === piece.toLowerCase() && from.row === 1))) {
                    const between = boardState[from.row + dir][from.col];
                    if (!between) valid = true;
                }
            }
            if (Math.abs(dc) === 1 && dr === dir && target && ((color === 'w' && target === target.toLowerCase()) || (color === 'b' && target === target.toUpperCase()))) {
                valid = true;
            }
            break;
        }
        case 'n':
            valid = (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
            break;
        case 'b':
            if (Math.abs(dr) !== Math.abs(dc)) break;
            valid = true;
            for (let i = 1; i < Math.abs(dr); i++) {
                let r = from.row + i * Math.sign(dr);
                let c = from.col + i * Math.sign(dc);
                if (boardState[r][c]) valid = false;
            }
            break;
        case 'r':
            if (dr !== 0 && dc !== 0) break;
            valid = true;
            let steps = Math.max(Math.abs(dr), Math.abs(dc));
            for (let i = 1; i < steps; i++) {
                let r = from.row + (dr === 0 ? 0 : i * Math.sign(dr));
                let c = from.col + (dc === 0 ? 0 : i * Math.sign(dc));
                if (boardState[r][c]) valid = false;
            }
            break;
        case 'q':
            if (Math.abs(dr) === Math.abs(dc)) {
                valid = true;
                for (let i = 1; i < Math.abs(dr); i++) {
                    let r = from.row + i * Math.sign(dr);
                    let c = from.col + i * Math.sign(dc);
                    if (boardState[r][c]) valid = false;
                }
            } else if (dr === 0 || dc === 0) {
                valid = true;
                let steps = Math.max(Math.abs(dr), Math.abs(dc));
                for (let i = 1; i < steps; i++) {
                    let r = from.row + (dr === 0 ? 0 : i * Math.sign(dr));
                    let c = from.col + (dc === 0 ? 0 : i * Math.sign(dc));
                    if (boardState[r][c]) valid = false;
                }
            }
            break;
        case 'k':
            valid = Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
            break;
        default:
            valid = false;
    }
    if (valid) {
        let tempBoard = boardState.map(row => row.slice());
        tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
        tempBoard[from.row][from.col] = '';
        if (isKingInCheck(tempBoard, color)) return false;
        return true;
    }
    return false;
}

// Kiểm tra chiếu hết
function isCheckmate(color) {
    if (!isKingInCheck(initialBoard, color)) return false;
    let moves = getAllMoves(color);
    return moves.length === 0;
}

// Hành động sau mỗi nước đi
function afterMoveActions() {
    renderBoard();
    updateClock();
    startTimer();
    // Cảnh báo chiếu tướng
    if (isKingInCheck(initialBoard, turn)) {
        setTimeout(() => {
            alert(turn === 'w' ? 'Vua trắng đang bị chiếu!' : 'Vua vàng (đen) đang bị chiếu!');
        }, 50);
        // Kiểm tra chiếu hết
        setTimeout(() => {
            if (isCheckmate(turn)) {
                if (turn === 'w') {
                    alert('Bạn đã thua do bị chiếu hết!');
                    chessScore -= 10;
saveChessScore();
updateChessScoreDisplay();
alert('Bạn đã thua! -10 điểm');
restartGame();
                } else {
                    alert('AI đã thua do bị chiếu hết! Bạn thắng!');
                }
                restartGame();
            }
        }, 100);
    }
}

// AI Move
function aiMove() {
    if ((turn === 'b' && aiLevel > 0)) {
        let moves = getAllMoves(turn);
        if (moves.length === 0) return;

        // Nếu AI đang bị chiếu, chỉ cho phép di chuyển quân vua
        if (isKingInCheck(initialBoard, 'b')) {
            // Lọc các nước đi của quân vua đen
            let kingMoves = moves.filter(m => initialBoard[m.from.row][m.from.col] === 'k');
            if (kingMoves.length === 0) {
                setTimeout(() => {
                    alert('AI đã thua do bị chiếu hết! Bạn thắng!');
                    restartGame();
                }, 100);
                return;
            }
            // Ưu tiên nước không bị ăn ngay (nếu có)
            let safeMoves = kingMoves.filter(m => {
                // Giả lập nước đi
                let tempBoard = initialBoard.map(row => row.slice());
                tempBoard[m.to.row][m.to.col] = tempBoard[m.from.row][m.from.col];
                tempBoard[m.from.row][m.from.col] = '';
                return !isKingInCheck(tempBoard, 'b');
            });
            let move = safeMoves.length > 0
                ? safeMoves[Math.floor(Math.random() * safeMoves.length)]
                : kingMoves[Math.floor(Math.random() * kingMoves.length)];
            // Thực hiện nước đi
            const captured = initialBoard[move.to.row][move.to.col];
            initialBoard[move.to.row][move.to.col] = initialBoard[move.from.row][move.from.col];
            initialBoard[move.from.row][move.from.col] = '';
            turn = 'w';
            afterMoveActions();
            selected = null;
            if (captured === 'K') {
                setTimeout(() => {
                    alert('AI (quân vàng) đã ăn vua trắng và giành chiến thắng!');
                    restartGame();
                }, 100);
            }
            return;
        }

        // Nếu không bị chiếu, AI đi như bình thường
        let move;
        let kingMove = moves.find(m => m.capture === 'K');
        if (kingMove) {
            move = kingMove;
        } else if (aiLevel === 1) {
            move = moves[Math.floor(Math.random() * moves.length)];
        } else if (aiLevel === 2) {
            let eatMoves = moves.filter(m => m.capture);
            if (eatMoves.length > 0) move = eatMoves[Math.floor(Math.random() * eatMoves.length)];
            else move = moves[Math.floor(Math.random() * moves.length)];
        } else if (aiLevel === 3) {
            let best = -1, bestMoves = [];
            for (let m of moves) {
                let val = m.capture ? pieceValue[m.capture.toLowerCase()] || 0 : 0;
                if (val > best) {
                    best = val;
                    bestMoves = [m];
                } else if (val === best) {
                    bestMoves.push(m);
                }
            }
            move = bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : moves[Math.floor(Math.random() * moves.length)];
        }
        // Thực hiện nước đi
        const captured = initialBoard[move.to.row][move.to.col];
        initialBoard[move.to.row][move.to.col] = initialBoard[move.from.row][move.from.col];
        initialBoard[move.from.row][move.from.col] = '';
        turn = 'w';
        afterMoveActions();
        selected = null;

        // Nếu ăn được vua trắng thì AI thắng
        if (captured === 'K') {
            setTimeout(() => {
                alert('AI (quân vàng) đã ăn vua trắng và giành chiến thắng!');
                restartGame();
            }, 100);
        }
    }
}

// Hàm cập nhật đồng hồ
function updateClock() {
    document.getElementById('white-clock').textContent = `Trắng: ${formatTime(whiteTime)}`;
    document.getElementById('black-clock').textContent = `Đen: ${formatTime(blackTime)}`;
}

// Định dạng mm:ss
function formatTime(t) {
    let m = Math.floor(t / 60);
    let s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Bắt đầu đếm giờ cho bên hiện tại
function startTimer() {
    clearInterval(timerInterval);

    // Thiết lập thời gian theo cấp độ
    let timeLimit = 300;
    if (aiLevel === 2) timeLimit = 240;
    if (aiLevel === 3) timeLimit = 60;

    // Reset thời gian cho bên vừa đi
    if (turn === 'w') {
        blackTime = timeLimit;
    } else {
        whiteTime = timeLimit;
    }

    timerInterval = setInterval(() => {
        if (turn === 'w') {
            whiteTime--;
            if (whiteTime <= 0) {
                clearInterval(timerInterval);
                alert('Trắng hết giờ! Đen thắng!');
                restartGame();
                return;
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                clearInterval(timerInterval);
                alert('Đen hết giờ! Trắng thắng!');
                restartGame();
                return;
            }
        }
        updateClock();
    }, 1000);
}

// Khởi động lại game
function restartGame() {
    initialBoard = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    selected = null;
    turn = 'w';

    // Thiết lập thời gian theo cấp độ
    let timeLimit = 300;
    if (aiLevel === 2) timeLimit = 240;
    if (aiLevel === 3) timeLimit = 60;
    whiteTime = timeLimit;
    blackTime = timeLimit;

    updateClock();
    renderBoard();
    startTimer();
}

// Hàm phong cấp cho tốt
function promotePawn(row, col, color, callback) {
    // Tạo popup chọn quân
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#222';
    popup.style.padding = '24px 18px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 0 16px #00ffe7';
    popup.style.zIndex = 1000;
    popup.innerHTML = `<div style="color:#ffe066;text-align:center;margin-bottom:10px">Chọn quân để phong:</div>`;

    const choices = color === 'w'
        ? [{k:'Q',v:'Hậu'},{k:'R',v:'Xe'},{k:'B',v:'Tượng'},{k:'N',v:'Mã'}]
        : [{k:'q',v:'Hậu'},{k:'r',v:'Xe'},{k:'b',v:'Tượng'},{k:'n',v:'Mã'}];

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = pieces[choice.k] + ' ' + choice.v;
        btn.style.margin = '0 8px';
        btn.style.fontSize = '1.5rem';
        btn.onclick = () => {
            document.body.removeChild(popup);
            callback(choice.k);
        };
        popup.appendChild(btn);
    });

    document.body.appendChild(popup);
}

window.addEventListener('message', function(e) {
    if (e.data === 'stop-chess-timer') {
        clearInterval(timerInterval);
    }
});

let chessScore = Number(localStorage.getItem('chessScore') || 0);
function updateChessScoreDisplay() {
    let el = document.getElementById('chess-score');
    if (!el) {
        el = document.createElement('div');
        el.id = 'chess-score';
        el.style.cssText = 'color:#ffe066;font-size:1.2rem;margin-bottom:10px;text-align:center;text-shadow:0 0 8px #00ffe7;';
        document.body.insertBefore(el, document.getElementById('chess-board'));
    }
    el.textContent = `Điểm cờ vua: ${chessScore}`;
}
function saveChessScore() {
    localStorage.setItem('chessScore', chessScore);
}