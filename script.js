document.addEventListener('DOMContentLoaded', () => {
  let questions = [];
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  let startTime, endTime;

  const startBtn = document.getElementById('startBtn');
  const testKeyInput = document.getElementById('testKey');
  const testListSelect = document.getElementById('testList');

  startBtn.addEventListener('click', async () => {
    console.log("Кнопка нажата");
    const key = testKeyInput.value.trim();

    if (key === '777') {
      await showTestList();
    } else {
      loadQuiz(key);
    }
  });

  testListSelect.addEventListener('change', function () {
    const selectedFile = this.value;
    if (selectedFile) {
      loadQuiz(selectedFile.replace('.json', ''));
    }
  });

  async function showTestList() {
    const select = testListSelect;
    select.classList.remove('hidden');
    select.innerHTML = "";

    const files = ['quiz1.json', 'quiz2.json']; // <-- список файлов (или можно автогенерацию позже)
    for (const file of files) {
      try {
        const res = await fetch(`quizzes/${file}`);
        const data = await res.json();
        const testName = data[0];
        const option = document.createElement('option');
        option.value = file;
        option.textContent = testName;
        select.appendChild(option);
      } catch (e) {
        console.error(`Ошибка загрузки теста ${file}:`, e);
      }
    }
  }

  async function loadQuiz(testName) {
    try {
      const res = await fetch(`quizzes/${testName}.json`);
      const data = await res.json();
      questions = data.slice(1); // первый элемент — название
      startTime = new Date();

      document.getElementById('start-form').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');

      showQuestion();
    } catch (e) {
      alert('Ошибка загрузки теста. Убедитесь, что такой файл существует в папке "quizzes/".');
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

  function endQuiz() {
    endTime = new Date();
    const durationMs = endTime - startTime;
    const duration = msToHMS(durationMs);

    const container = document.getElementById('quiz-container');
    container.classList.add('hidden');

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
    const testName = testKeyInput.value;
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
