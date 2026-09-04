// Шахматный движок для валидации ходов и управления доской

class ChessEngine {
  constructor() {
    this.board = this.initializeBoard();
    this.moveHistory = [];
    this.whiteToMove = true;
  }

  // Инициализация доски (FEN-подобный формат)
  initializeBoard() {
    return [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
  }

  // Загрузка позиции из строки (простой формат: fen-like)
  loadPosition(positions) {
    this.board = positions.map(row => [...row]);
    this.moveHistory = [];
    this.whiteToMove = true;
  }

  // Вывод доски в консоль
  displayBoard() {
    console.log('\n  a b c d e f g h');
    for (let i = 0; i < 8; i++) {
      let row = (8 - i) + ' ';
      for (let j = 0; j < 8; j++) {
        row += (this.board[i][j] === ' ' ? '.' : this.board[i][j]) + ' ';
      }
      console.log(row + (8 - i));
    }
    console.log('  a b c d e f g h\n');
  }

  // Конвертация координат (a1 -> [7, 0])
  coordToIndex(coord) {
    if (!coord || coord.length !== 2) return null;
    const file = coord.charCodeAt(0) - 97; // a-h -> 0-7
    const rank = 8 - parseInt(coord[1]); // 1-8 -> 7-0
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return [rank, file];
  }

  // Конвертация индексов обратно в координаты
  indexToCoord(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
  }

  // Получение всех доступных ходов для фигуры
  getAvailableMoves(from) {
    const [row, col] = from;
    const piece = this.board[row][col];
    if (!piece || piece === ' ') return [];

    const isWhite = piece === piece.toUpperCase();
    const moves = [];

    const pieceLower = piece.toLowerCase();

    switch (pieceLower) {
      case 'p': // пешка
        moves.push(...this.getPawnMoves(row, col, isWhite));
        break;
      case 'n': // конь
        moves.push(...this.getKnightMoves(row, col, isWhite));
        break;
      case 'b': // слон
        moves.push(...this.getBishopMoves(row, col, isWhite));
        break;
      case 'r': // ладья
        moves.push(...this.getRookMoves(row, col, isWhite));
        break;
      case 'q': // ферзь
        moves.push(...this.getQueenMoves(row, col, isWhite));
        break;
      case 'k': // король
        moves.push(...this.getKingMoves(row, col, isWhite));
        break;
    }

    return moves;
  }

  getPawnMoves(row, col, isWhite) {
    const moves = [];
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // Один ход вперед
    const nextRow = row + direction;
    if (nextRow >= 0 && nextRow < 8 && this.board[nextRow][col] === ' ') {
      moves.push([nextRow, col]);

      // Два хода с начальной позиции
      if (row === startRow) {
        const twoRow = row + 2 * direction;
        if (this.board[twoRow][col] === ' ') {
          moves.push([twoRow, col]);
        }
      }
    }

    // Захваты по диагонали
    for (let newCol of [col - 1, col + 1]) {
      if (newCol >= 0 && newCol < 8 && nextRow >= 0 && nextRow < 8) {
        const target = this.board[nextRow][newCol];
        if (target !== ' ') {
          const targetIsWhite = target === target.toUpperCase();
          if (targetIsWhite !== isWhite) {
            moves.push([nextRow, newCol]);
          }
        }
      }
    }

    return moves;
  }

  getKnightMoves(row, col, isWhite) {
    const moves = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (let [dr, dc] of knightMoves) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.board[newRow][newCol];
        if (target === ' ' || (target !== ' ' && (target === target.toUpperCase()) !== isWhite)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  }

  getBishopMoves(row, col, isWhite) {
    const moves = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    this.getSlidingMoves(row, col, isWhite, directions, moves);
    return moves;
  }

  getRookMoves(row, col, isWhite) {
    const moves = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    this.getSlidingMoves(row, col, isWhite, directions, moves);
    return moves;
  }

  getQueenMoves(row, col, isWhite) {
    const moves = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];
    this.getSlidingMoves(row, col, isWhite, directions, moves);
    return moves;
  }

  getKingMoves(row, col, isWhite) {
    const moves = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const target = this.board[newRow][newCol];
          if (target === ' ' || (target !== ' ' && (target === target.toUpperCase()) !== isWhite)) {
            moves.push([newRow, newCol]);
          }
        }
      }
    }
    return moves;
  }

  getSlidingMoves(row, col, isWhite, directions, moves) {
    for (let [dr, dc] of directions) {
      let newRow = row + dr;
      let newCol = col + dc;
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.board[newRow][newCol];
        if (target === ' ') {
          moves.push([newRow, newCol]);
        } else {
          const targetIsWhite = target === target.toUpperCase();
          if (targetIsWhite !== isWhite) {
            moves.push([newRow, newCol]);
          }
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }
  }

  // Выполнить ход
  makeMove(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    if (this.board[fromRow][fromCol] === ' ') {
      return false; // нет фигуры на этом поле
    }

    const piece = this.board[fromRow][fromCol];
    const isWhite = piece === piece.toUpperCase();

    if (isWhite !== this.whiteToMove) {
      return false; // не ваш ход
    }

    const availableMoves = this.getAvailableMoves([fromRow, fromCol]);
    if (!availableMoves.some(m => m[0] === toRow && m[1] === toCol)) {
      return false; // недопустимый ход
    }

    // Выполняем ход
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = ' ';
    
    this.moveHistory.push({
      from: this.indexToCoord(fromRow, fromCol),
      to: this.indexToCoord(toRow, toCol),
      piece: piece
    });

    this.whiteToMove = !this.whiteToMove;
    return true;
  }

  // Проверка шаха
  isInCheck(isWhite) {
    let kingPos = null;
    const king = isWhite ? 'K' : 'k';
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.board[i][j] === king) {
          kingPos = [i, j];
          break;
        }
      }
    }

    if (!kingPos) return false;

    // Проверяем, может ли противник напасть на короля
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = this.board[i][j];
        if (piece !== ' ' && (piece === piece.toUpperCase()) !== isWhite) {
          const moves = this.getAvailableMoves([i, j]);
          if (moves.some(m => m[0] === kingPos[0] && m[1] === kingPos[1])) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // П��оверка мата
  isCheckmate(isWhite) {
    if (!this.isInCheck(isWhite)) return false;

    // Проверяем, есть ли хотя бы один легальный ход
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = this.board[i][j];
        if (piece !== ' ' && (piece === piece.toUpperCase()) === isWhite) {
          const moves = this.getAvailableMoves([i, j]);
          for (let move of moves) {
            // Пытаемся сделать ход
            const backup = this.board[move[0]][move[1]];
            this.board[move[0]][move[1]] = piece;
            this.board[i][j] = ' ';

            const stillInCheck = this.isInCheck(isWhite);

            // Откатываем ход
            this.board[i][j] = piece;
            this.board[move[0]][move[1]] = backup;

            if (!stillInCheck) return false;
          }
        }
      }
    }

    return true;
  }

  // Получить копию доски
  getBoardCopy() {
    return this.board.map(row => [...row]);
  }
}

export default ChessEngine;
