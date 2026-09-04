// Интерфейс пользователя для тренажера

import readline from 'readline';

class UI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Вывести сообщение
  print(message) {
    console.log(message);
  }

  // Вывести заголовок
  printHeader(title) {
    console.log('\n' + '='.repeat(50));
    console.log('  ' + title);
    console.log('='.repeat(50) + '\n');
  }

  // Вывести меню
  printMenu(options) {
    console.log('\nВыберите опцию:');
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option}`);
    });
  }

  // Вывести информацию о задаче
  printTaskInfo(task) {
    console.log('\n' + '─'.repeat(50));
    console.log(`📝 Задача #${task.id}: ${task.name}`);
    console.log(`📊 Сложность: ${task.difficulty}`);
    console.log(`📖 Описание: ${task.description}`);
    console.log('─'.repeat(50) + '\n');
  }

  // Вывести подсказку
  printHint(task) {
    console.log(`\n💡 Подсказка: ${task.hint}`);
  }

  // Вывести решение
  printSolution(task) {
    console.log(`\n✅ Решение: ${task.solution}`);
    console.log(`📚 Объяснение: ${task.explanation}`);
  }

  // Вывести результаты
  printResults(correct, total, score) {
    console.log('\n' + '='.repeat(50));
    console.log(`  РЕЗУЛЬТАТЫ`);
    console.log('='.repeat(50));
    console.log(`Правильных ответов: ${correct}/${total}`);
    console.log(`Процент: ${((correct / total) * 100).toFixed(1)}%`);
    console.log(`Баллы: ${score}`);
    console.log('='.repeat(50) + '\n');
  }

  // Вывести ошибку
  printError(message) {
    console.log(`\n❌ Ошибка: ${message}\n`);
  }

  // Вывести успех
  printSuccess(message) {
    console.log(`\n✨ ${message}\n`);
  }

  // Запросить ввод пользователя
  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim().toUpperCase());
      });
    });
  }

  // Запросить пользовательский ход
  async promptMove(message = 'Введите ход (например: e2-e4): ') {
    return new Promise((resolve) => {
      this.rl.question(message, (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  // Запросить подтверждение
  async promptConfirm(question) {
    return new Promise((resolve) => {
      this.rl.question(question + ' (y/n): ', (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
  }

  // Закрыть интерфейс
  close() {
    this.rl.close();
  }

  // Очистить консоль
  clear() {
    console.clear();
  }

  // Вывести главное меню
  printMainMenu() {
    this.clear();
    this.printHeader('♟️  ШАХМАТНЫЙ ТРЕНАЖЕР');
    console.log('Добро пожаловать в шахматный тренажер!\n');
    this.printMenu([
      'Решать задачи',
      'Случайная задача',
      'Все задачи',
      'Задачи по уровню',
      'Статистика',
      'Выход'
    ]);
  }

  // Вывести список задач
  printTasksList(tasks) {
    console.log('\n' + '─'.repeat(70));
    console.log('№  | Название                    | Сложность    | Описание');
    console.log('─'.repeat(70));
    
    tasks.forEach(task => {
      const num = String(task.id).padEnd(3);
      const name = task.name.padEnd(28);
      const difficulty = task.difficulty.padEnd(12);
      const description = task.description.substring(0, 25);
      console.log(`${num}| ${name} | ${difficulty} | ${description}`);
    });
    
    console.log('─'.repeat(70) + '\n');
  }

  // Вывести уровни сложности
  printDifficultyMenu() {
    this.printMenu([
      'Легко',
      'Средне',
      'Сложно',
      'Вернуться в главное меню'
    ]);
  }

  // Вывести статистику
  printStatistics(stats) {
    this.printHeader('📊 СТАТИСТИКА');
    console.log(`Всего решено задач: ${stats.totalSolved}`);
    console.log(`Правильных ответов: ${stats.correctAnswers}`);
    console.log(`Неправильных ответов: ${stats.totalSolved - stats.correctAnswers}`);
    
    if (stats.totalSolved > 0) {
      const percentage = ((stats.correctAnswers / stats.totalSolved) * 100).toFixed(1);
      console.log(`Процент успеха: ${percentage}%`);
      console.log(`Общий балл: ${stats.totalScore}`);
    } else {
      console.log('Вы еще не решили ни одной задачи.');
    }
    
    console.log('\n');
  }

  // Вывести информацию о ходе
  printMoveInfo(move) {
    console.log(`Ход: ${move.from} → ${move.to} (${move.piece})`);
  }

  // Вывести историю ходов
  printMoveHistory(moves) {
    if (moves.length === 0) {
      console.log('История ходов пуста.');
      return;
    }
    
    console.log('\nИстория ходов:');
    moves.forEach((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhiteMove = index % 2 === 0;
      const color = isWhiteMove ? 'Белые' : 'Чёрные';
      console.log(`${moveNumber}. ${move.from}-${move.to} (${color})`);
    });
    console.log();
  }

  // Вывести справку
  printHelp() {
    this.printHeader('ℹ️  СПРАВКА');
    console.log('Команды:');
    console.log('  доска    - Показать текущую доску');
    console.log('  ходы     - Показать доступные ходы');
    console.log('  отмена   - Отменить последний ход');
    console.log('  подсказка - Получить подсказку');
    console.log('  решение  - Показать решение');
    console.log('  выход    - Вернуться в меню');
    console.log('  помощь   - Показать эту справку\n');
  }

  // Показать информацию об ошибке хода
  printInvalidMove(move) {
    console.log(`❌ Недопустимый ход: ${move}`);
    console.log('Используйте формат: a2-a4 (от - до)\n');
  }

  // Показать сообщение о прогрессе
  printProgress(current, total) {
    const percentage = ((current / total) * 100).toFixed(0);
    const filled = Math.floor(percentage / 5);
    const empty = 20 - filled;
    const bar = '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    console.log(`\nПрогресс: ${bar} ${percentage}% (${current}/${total})`);
  }

  // Показать сообщение о загрузке
  printLoading(message = 'Загрузка...') {
    console.log(`⏳ ${message}`);
  }

  // Показать сообщение о завершении
  printComplete(message = 'Готово!') {
    console.log(`✅ ${message}`);
  }
}

export default UI;
