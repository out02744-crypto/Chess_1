// Конфигурация шахматного тренажера

export const config = {
  // Количество попыток для решения задачи
  maxAttempts: 3,

  // Количество очков за правильное решение
  pointsPerCorrectAnswer: 10,

  // Бонус очков за первую попытку
  firstAttemptBonus: 5,

  // Сложность задач по умолчанию
  defaultDifficulty: 'Средне',

  // Список доступных уровней сложности
  difficulties: ['Легко', 'Средне', 'Сложно'],

  // Файл для сохранения статистики
  statsFile: 'stats.json',

  // Показывать подсказки
  showHints: true,

  // Язык интерфейса
  language: 'ru',

  // Таймер для решения задачи (в секундах, 0 = без таймера)
  timeLimit: 0,

  // Количество задач для просмотра в списке за раз
  tasksPerPage: 10,

  // Включить музыку/звуки
  soundEnabled: false,

  // Тема оформления (light/dark)
  theme: 'dark'
};

export default config;
