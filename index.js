// Главный файл шахматного тренажера

import ChessEngine from './chess-engine.js';
import * as TasksModule from './tasks.js';
import UI from './ui.js';
import * as fs from 'fs';
import * as path from 'path';

class ChessTrainer {
  constructor() {
    this.ui = new UI();
    this.engine = new ChessEngine();
    this.currentTask = null;
    this.stats = this.loadStats();
    this.attemptsCount = 0;
    this.maxAttempts = 3;
  }

  // Загрузить статистику из файла
  loadStats() {
    const statsFile = 'stats.json';
    if (fs.existsSync(statsFile)) {
      const data = fs.readFileSync(statsFile, 'utf-8');
      return JSON.parse(data);
    }
    return {
      totalSolved: 0,
      correctAnswers: 0,
      totalScore: 0,
      tasksCompleted: []
    };
  }

  // Сохранить статистику
  saveStats() {
    fs.writeFileSync('stats.json', JSON.stringify(this.stats, null, 2));
  }

  // Главный цикл приложения
  async run() {
    while (true) {
      this.ui.printMainMenu();
      const choice = await this.ui.prompt('Введите выбор (1-6): ');

      switch (choice) {
        case '1':
          await this.solveTasks();
          break;
        case '2':
          await this.solveRandomTask();
          break;
        case '3':
          await this.viewAllTasks();
          break;
        case '4':
          await this.solveByDifficulty();
          break;
        case '5':
          this.ui.printStatistics(this.stats);
          await this.ui.prompt('Нажмите Enter для продолжения...');
          break;
        case '6':
          this.ui.print('👋 До свидания!');
          this.ui.close();
          return;
        default:
          this.ui.printError('Неверный выбор. Попробуйте снова.');
          await this.ui.prompt('Нажмите Enter для продолжения...');
      }
    }
  }

  // Решать задачи по порядку
  async solveTasks() {
    const tasks = TasksModule.getAllTasks();
    
    for (let task of tasks) {
      const completed = await this.solveTask(task);
      if (!completed) {
        break;
      }
    }
  }

  // Решать случайную задачу
  async solveRandomTask() {
    const task = TasksModule.getRandomTask();
    await this.solveTask(task);
  }

  // Решать задачи по уровню сложности
  async solveByDifficulty() {
    this.ui.printDifficultyMenu();
    const choice = await this.ui.prompt('Выберите уровень (1-4): ');

    const difficultyMap = {
      '1': 'Легко',
      '2': 'Средне',
      '3': 'Сложно',
      '4': null
    };

    const difficulty = difficultyMap[choice];
    if (difficulty === null) {
      return;
    }

    const tasks = TasksModule.getTasksByDifficulty(difficulty);
    if (tasks.length === 0) {
      this.ui.printError('Задач этого уровня не найдено.');
      return;
    }

    for (let task of tasks) {
      const completed = await this.solveTask(task);
      if (!completed) {
        break;
      }
    }
  }

  // Просмотреть все задачи
  async viewAllTasks() {
    const tasks = TasksModule.getAllTasks();
    this.ui.printTasksList(tasks);
    
    const choice = await this.ui.prompt('Введите номер задачи для решения (или Enter для выхода): ');
    
    if (choice === '') {
      return;
    }

    const taskId = parseInt(choice);
    const task = TasksModule.getTask(taskId);

    if (!task) {
      this.ui.printError('Задача не найдена.');
      return;
    }

    await this.solveTask(task);
  }

  // Решить одну задачу
  async solveTask(task) {
    this.ui.clear();
    this.ui.printTaskInfo(task);
    this.currentTask = task;
    this.attemptsCount = 0;

    // Загрузить позицию
    this.engine.loadPosition(task.startPosition);
    this.engine.displayBoard();

    // Показать доступные ходы для белых
    const availableMoves = this.getAvailableMovesForColor(true);
    console.log('Доступные ходы для белых:');
    console.log(availableMoves.join(', '));
    console.log();

    let solved = false;
    let userWantsExit = false;

    while (!solved && this.attemptsCount < this.maxAttempts && !userWantsExit) {
      const move = await this.ui.promptMove(
        `Введите ход (попытка ${this.attemptsCount + 1}/${this.maxAttempts}): `
      );

      if (move === 'выход' || move === 'exit') {
        userWantsExit = true;
        break;
      }

      if (move === 'подсказка' || move === 'hint') {
        this.ui.printHint(task);
        continue;
      }

      if (move === 'решение' || move === 'solution') {
        this.ui.printSolution(task);
        continue;
      }

      if (move === 'доска' || move === 'board') {
        this.engine.displayBoard();
        continue;
      }

      // Парсим ход
      const parsedMove = this.parseMove(move);
      if (!parsedMove) {
        this.ui.printInvalidMove(move);
        continue;
      }

      // Проверяем, является ли это правильным ходом
      if (this.isCorrectMove(parsedMove, task.solution)) {
        this.ui.printSuccess('✅ Правильно! Вы решили задачу!');
        this.recordSuccess(task);
        solved = true;
        break;
      } else {
        this.attemptsCount++;
        if (this.attemptsCount < this.maxAttempts) {
          this.ui.printError(`Неправильно. Попыток осталось: ${this.maxAttempts - this.attemptsCount}`);
        }
      }
    }

    if (!solved && this.attemptsCount >= this.maxAttempts && !userWantsExit) {
      this.ui.printSolution(task);
      this.recordFailure(task);
    }

    if (!userWantsExit) {
      const continueChoice = await this.ui.promptConfirm('Продолжить со следующей задачей?');
      return continueChoice;
    }

    return false;
  }

  // Получить доступные ходы для цвета
  getAvailableMovesForColor(isWhite) {
    const moves = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = this.engine.board[i][j];
        if (piece !== ' ' && (piece === piece.toUpperCase()) === isWhite) {
          const pieceMoves = this.engine.getAvailableMoves([i, j]);
          for (let move of pieceMoves) {
            const from = this.engine.indexToCoord(i, j);
            const to = this.engine.indexToCoord(move[0], move[1]);
            moves.push(`${from}-${to}`);
          }
        }
      }
    }
    return moves;
  }

  // Парсить ход в формате a2-a4
  parseMove(moveStr) {
    const parts = moveStr.split('-');
    if (parts.length !== 2) return null;

    const from = this.engine.coordToIndex(parts[0]);
    const to = this.engine.coordToIndex(parts[1]);

    if (!from || !to) return null;

    return { from, to };
  }

  // Проверить, является ли ход правильным решением
  isCorrectMove(move, solution) {
    // Простая проверка - преобразуем решение в ход и сравниваем
    const solutionMove = this.convertSolutionToMove(solution);
    
    if (!solutionMove) {
      // Если не можем парсить, проверим буквально
      const moveStr = this.engine.indexToCoord(move.from[0], move.from[1]) + 
                      this.engine.indexToCoord(move.to[0], move.to[1]);
      return moveStr.includes(solution.toLowerCase());
    }

    return move.to[0] === solutionMove.to[0] && 
           move.to[1] === solutionMove.to[1];
  }

  // Преобразовать решение (например "Qh5") в координаты
  convertSolutionToMove(solution) {
    // Удаляем символы шахматной нотации
    const cleanSolution = solution.replace(/[+#=]+$/, '');
    
    // Ищем координаты (например h5)
    const coordMatch = cleanSolution.match(/[a-h][1-8]/);
    if (!coordMatch) return null;

    const toCoord = this.engine.coordToIndex(coordMatch[0]);
    if (!toCoord) return null;

    return { to: toCoord };
  }

  // Записать успешное решение
  recordSuccess(task) {
    this.stats.totalSolved++;
    this.stats.correctAnswers++;
    this.stats.totalScore += (this.maxAttempts - this.attemptsCount + 1) * 10;
    this.stats.tasksCompleted.push({
      taskId: task.id,
      completed: true,
      date: new Date().toISOString()
    });
    this.saveStats();
  }

  // Записать неудачное решение
  recordFailure(task) {
    this.stats.totalSolved++;
    this.stats.tasksCompleted.push({
      taskId: task.id,
      completed: false,
      date: new Date().toISOString()
    });
    this.saveStats();
  }
}

// Запуск приложения
const trainer = new ChessTrainer();
trainer.run().catch(err => {
  console.error('Ошибка:', err);
  trainer.ui.close();
  process.exit(1);
});
