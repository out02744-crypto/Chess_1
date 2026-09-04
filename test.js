// Тесты для шахматного тренажера

import ChessEngine from './chess-engine.js';
import * as TasksModule from './tasks.js';

class ChessTrainerTest {
  constructor() {
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  // Запустить тест
  test(name, fn) {
    this.testsRun++;
    try {
      fn();
      console.log(`✅ ${name}`);
      this.testsPassed++;
    } catch (err) {
      console.log(`❌ ${name}`);
      console.log(`   ${err.message}`);
      this.testsFailed++;
    }
  }

  // Assert функция
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  // Тесты шахматного движка
  testChessEngine() {
    console.log('\n=== ТЕСТЫ CHESS ENGINE ===\n');

    // Тест инициализации доски
    this.test('Инициализация доски', () => {
      const engine = new ChessEngine();
      this.assert(engine.board.length === 8, 'Доска должна быть 8x8');
      this.assert(engine.board[0].length === 8, 'Каждая строка должна быть 8 элементов');
    });

    // Тест преобразования координат
    this.test('Преобразование координат a1 -> [7, 0]', () => {
      const engine = new ChessEngine();
      const [row, col] = engine.coordToIndex('a1');
      this.assertEqual(row, 7, 'Ряд должен быть 7');
      this.assertEqual(col, 0, 'Колонна должна быть 0');
    });

    this.test('Преобразование координат h8 -> [0, 7]', () => {
      const engine = new ChessEngine();
      const [row, col] = engine.coordToIndex('h8');
      this.assertEqual(row, 0, 'Ряд должен быть 0');
      this.assertEqual(col, 7, 'Колонна должна быть 7');
    });

    // Тест обратного преобразования
    this.test('Обратное преобразование индексов', () => {
      const engine = new ChessEngine();
      const coord = engine.indexToCoord(7, 0);
      this.assertEqual(coord, 'a1', 'Должно быть a1');
    });

    // Тест получения доступных ходов для пешки
    this.test('Ходы белой пешки с e2', () => {
      const engine = new ChessEngine();
      const moves = engine.getAvailableMoves([6, 4]); // e2
      this.assert(moves.length >= 2, 'Пешка e2 должна иметь минимум 2 хода');
    });

    // Тест получения ходов коня
    this.test('Ходы коня с b1', () => {
      const engine = new ChessEngine();
      const moves = engine.getAvailableMoves([7, 1]); // b1
      this.assert(moves.length > 0, 'Конь b1 должен иметь ходы');
    });

    // Тест выполнения хода
    this.test('Выполнение хода e2-e4', () => {
      const engine = new ChessEngine();
      const result = engine.makeMove([6, 4], [4, 4]); // e2-e4
      this.assert(result === true, 'Ход должен быть выполнен');
      this.assertEqual(engine.board[4][4], 'P', 'Пешка должна быть на e4');
      this.assertEqual(engine.board[6][4], ' ', 'Поле e2 должно быть пусто');
    });

    // Тест проверки шаха
    this.test('Проверка шаха', () => {
      const engine = new ChessEngine();
      // После начальной позиции король не в шахе
      this.assert(engine.isInCheck(true) === false, 'Белый король не должен быть в шахе');
      this.assert(engine.isInCheck(false) === false, 'Чёрный король не должен быть в шахе');
    });

    // Тест невалидного хода
    this.test('Невалидный ход отклоняется', () => {
      const engine = new ChessEngine();
      const result = engine.makeMove([5, 4], [3, 4]); // Пешка на пусто e3
      this.assert(result === false, 'Невалидный ход должен быть отклонен');
    });

    // Тест смены ходов
    this.test('Смена ходов после хода', () => {
      const engine = new ChessEngine();
      this.assert(engine.whiteToMove === true, 'Начинают белые');
      engine.makeMove([6, 4], [4, 4]); // e2-e4
      this.assert(engine.whiteToMove === false, 'Теперь ходят чёрные');
    });
  }

  // Тесты задач
  testTasks() {
    console.log('\n=== ТЕСТЫ ЗАДАЧ ===\n');

    this.test('Получить все задачи', () => {
      const tasks = TasksModule.getAllTasks();
      this.assert(Array.isArray(tasks), 'Должен вернуть массив');
      this.assert(tasks.length > 0, 'Должны быть задачи');
    });

    this.test('Получить задачу по ID', () => {
      const task = TasksModule.getTask(1);
      this.assert(task !== undefined, 'Задача 1 должна существовать');
      this.assertEqual(task.id, 1, 'ID должен быть 1');
    });

    this.test('Получить случайную задачу', () => {
      const task = TasksModule.getRandomTask();
      this.assert(task !== undefined, 'Должна быть задача');
      this.assert(task.id >= 1, 'ID должен быть валидным');
    });

    this.test('Получить задачи по сложности', () => {
      const tasks = TasksModule.getTasksByDifficulty('Легко');
      this.assert(Array.isArray(tasks), 'Должен вернуть массив');
      tasks.forEach(task => {
        this.assertEqual(task.difficulty, 'Легко', 'Все задачи должны быть "Легко"');
      });
    });

    this.test('Структура задачи', () => {
      const task = TasksModule.getTask(1);
      this.assert(task.id !== undefined, 'Задача должна иметь id');
      this.assert(task.name !== undefined, 'Задача должна иметь name');
      this.assert(task.description !== undefined, 'Задача должна иметь description');
      this.assert(task.difficulty !== undefined, 'Задача должна иметь difficulty');
      this.assert(task.startPosition !== undefined, 'Задача должна иметь startPosition');
      this.assert(task.solution !== undefined, 'Задача должна иметь solution');
      this.assert(task.hint !== undefined, 'Задача должна иметь hint');
    });

    this.test('Начальная позиция валидна', () => {
      const task = TasksModule.getTask(1);
      this.assert(Array.isArray(task.startPosition), 'Позиция должна быть массивом');
      this.assertEqual(task.startPosition.length, 8, 'Позиция должна быть 8x8');
    });
  }

  // Запустить все тесты
  runAll() {
    console.log('\n♟️  ЗАПУСК ТЕСТОВ ШАХМАТНОГО ТРЕНАЖЕРА\n');
    
    this.testChessEngine();
    this.testTasks();

    console.log('\n=== РЕЗУЛЬТАТЫ ===\n');
    console.log(`Всего тестов: ${this.testsRun}`);
    console.log(`✅ Пройдено: ${this.testsPassed}`);
    console.log(`❌ Провалено: ${this.testsFailed}`);
    console.log(`Процент: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%\n`);

    return this.testsFailed === 0;
  }
}

// Запустить тесты
const tester = new ChessTrainerTest();
const success = tester.runAll();
process.exit(success ? 0 : 1);
