document.addEventListener('DOMContentLoaded', () => {
  let questions = [];
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  let startTime, endTime;
  let timerInterval;

  const startBtn = document.getElementById('startBtn');
  const testKeyInput = document.getElementById('testKey');
  const testListSelect = document.getElementById('testList');
  const testKeyBlock = document.getElementById('testKeyBlock');
  const testListBlock = document.getElementById('testListBlock');
  const timerDisplay = document.getElementById('timer');

  startBtn.addEventListener('click', async () => {
    const key = testKeyInput.value.trim();

    if (!testListBlock.classList.contains('hidden')) {
      const selectedFile = testListSelect.value;
      if (selectedFile) {
        loadQuiz(selectedFile.replace('.json', ''));
      }
    } else if (key === '777') {
      testKeyBlock.classList.add('hidden');
      testListBlock.classList.remove('hidden');
      await showTestList();
    } else {
      loadQuiz(key);
    }
  });

  async function showTestList() {
    testListSelect.innerHTML = "";
    const files = ['quiz1.json', 'quiz2.json']; // можно позже автоматизировать

    for (const file of files) {
      try {
        const res = await fetch(`quizzes/${file}`);
        const data = await res.json();
        const testName = data[0];
        const option = document.createElement('option');
        option.value = file;
        option.textContent = testName;
        testListSelect.appendChild(option);
      } catch (e) {
        console.error(`Ошибка загрузки ${file}:`, e);
      }
    }
  }

  async function loadQuiz(testName) {
    try {
      const res = await fetch(`quizzes/${testName}.json`);
      const data = await res.json();
      questions = data.slice(1); // первый элемент — название теста
      startTime = new Date();
      currentQuestionIndex = 0;
      correctAnswers = 0;

      document.getElementById('start-form').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');
      timerDisplay.classList.remove('hidden');

      startTimer();
      showQuestion();
    } catch (e) {
      alert('Ошибка загрузки теста. Убедитесь, что файл существует.');
      console.error(e);
    }
  }

  function showQuestion() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = "";

    if (currentQuestionIndex >= questions.length) {
      endQuiz();
      return;
    }

    const q = questions[currentQuestionIndex];
    const div = document.createElement('div');
    div.className = 'question-block';
    div.innerHTML = `<h3>${q.question}</h3>`;

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.onclick = () => {
        if (i === q.answer) correctAnswers++;
        currentQuestionIndex++;
        showQuestion();
      };
      div.appendChild(btn);
      div.appendChild(document.createElement('br'));
    });

    container.appendChild(div);
  }

  function startTimer() {
    const start = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      timerDisplay.textContent = `Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function endQuiz() {
    stopTimer();
    endTime = new Date();
    const durationMs = endTime - startTime;
    const duration = msToHMS(durationMs);

    document.getElementById('quiz-container').classList.add('hidden');
    timerDisplay.classList.add('hidden');

    const resultDiv = document.getElementById('result-container');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
      <h2>Тест завершён!</h2>
      <p>Правильных ответов: ${correctAnswers} из ${questions.length}</p>
      <p>Время прохождения: ${duration}</p>
      <button onclick="downloadResult()">Скачать результат</button>
    `;
  }

  function msToHMS(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}ч ${minutes}м ${seconds}с`;
  }

  window.downloadResult = function () {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const testName = testListBlock.classList.contains('hidden') ? testKeyInput.value : testListSelect.options[testListSelect.selectedIndex].text;
    const duration = msToHMS(endTime - startTime);
    const timestamp = new Date().toISOString();

    const result = {
      name: `${firstName} ${lastName}`,
      email,
      testName,
      correctAnswers,
      totalQuestions: questions.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      createdAt: timestamp
    };

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${firstName}_${lastName}_${timestamp}.json`;
    a.click();
  };
});
