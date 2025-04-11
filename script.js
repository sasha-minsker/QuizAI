// Обновлённый script.js с исправлением синтаксической ошибки и поддержкой PDF с логотипом

document.addEventListener('DOMContentLoaded', () => {
  let questions = [];
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  let startTime, endTime;
  let timerInterval;
  let userAnswers = [];

  const startBtn = document.getElementById('startBtn');
  const testKeyInput = document.getElementById('testKey');
  const testListSelect = document.getElementById('testList');
  const testKeyBlock = document.getElementById('testKeyBlock');
  const testListBlock = document.getElementById('testListBlock');
  const timerDisplay = document.getElementById('timer');
  const progressBar = document.getElementById('progressBar');

  testKeyInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const code = testKeyInput.value.trim();
      if (code === '777') {
        testListBlock.classList.remove('hidden');
        await showTestList();
      } else {
        alert('Неверный код. Попробуйте ещё раз.');
      }
    }
  });

  startBtn.addEventListener('click', async () => {
    if (!testListBlock.classList.contains('hidden')) {
      const selectedFile = testListSelect.value;
      if (selectedFile) {
        loadQuiz(selectedFile.replace('.json', ''));
      }
    } else {
      const key = testKeyInput.value.trim();
      loadQuiz(key);
    }
  });

  async function showTestList() {
    testListSelect.innerHTML = "";
    try {
      const res = await fetch("quizzes/quiz_index.json");
      const data = await res.json();
      const files = data.quizzes;

      for (const file of files) {
        const res = await fetch(`quizzes/${file}`);
        const quiz = await res.json();
        const testName = quiz[0];
        const option = document.createElement("option");
        option.value = file;
        option.textContent = testName;
        testListSelect.appendChild(option);
      }
    } catch (e) {
      console.error("Ошибка загрузки списка тестов:", e);
    }
  }

  async function loadQuiz(testName) {
    try {
      const res = await fetch(`quizzes/${testName}.json`);
      const data = await res.json();
      questions = data.slice(1);
      startTime = new Date();
      currentQuestionIndex = 0;
      correctAnswers = 0;
      userAnswers = [];

      document.getElementById('start-form').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');
      timerDisplay.classList.remove('hidden');
      progressBar.classList.remove('hidden');

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

    updateProgress();

    const q = questions[currentQuestionIndex];
    const div = document.createElement('div');
    div.className = 'mb-4';

    const questionHeader = document.createElement('h3');
    questionHeader.className = 'question-text';
    questionHeader.textContent = q.question;
    div.appendChild(questionHeader);

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.className = 'btn-answer';
      btn.onclick = () => {
        userAnswers.push(i);
        if (i === q.answer) correctAnswers++;
        currentQuestionIndex++;
        showQuestion();
      };
      div.appendChild(btn);
    });

    container.appendChild(div);
  }

  function updateProgress() {
    const percent = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${percent}%`;
    progressBar.innerText = `${Math.round(percent)}%`;
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
    progressBar.classList.add('hidden');

    const resultDiv = document.getElementById('result-container');
    resultDiv.classList.remove('hidden');

    let detailedResult = '<ol class="text-white text-sm sm:text-base mt-4 space-y-2">';
    questions.forEach((q, i) => {
      const userAnswer = userAnswers[i];
      const correct = q.answer;
      const isCorrect = userAnswer === correct;
      const answerClass = isCorrect ? 'text-green-400' : 'text-red-400';
      detailedResult += `<li class="border-b border-white/10 pb-2">
        <strong>Вопрос ${i + 1}:</strong> ${q.question}<br>
        Ваш ответ: <em class="${answerClass}">${q.options[userAnswer] || 'не выбран'}</em><br>
        Правильный ответ: <strong class="text-green-300">${q.options[correct]}</strong>
      </li>`;
    });
    detailedResult += '</ol>';

    resultDiv.innerHTML = `
      <h2 class="text-2xl font-bold mb-2 text-white">Тест завершён!</h2>
      <p class="mb-2 text-white">Правильных ответов: ${correctAnswers} из ${questions.length}</p>
      <p class="mb-4 text-white">Время прохождения: ${duration}</p>
      <button onclick="downloadResult()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-2">Скачать результат</button>
      <button onclick="downloadPDF()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 ml-2">Скачать PDF</button>
      ${detailedResult}
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
    const testName = testListBlock.classList.contains('hidden')
      ? testKeyInput.value
      : testListSelect.options[testListSelect.selectedIndex].text;
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
      createdAt: timestamp,
      answers: questions.map((q, i) => ({
        question: q.question,
        selected: q.options[userAnswers[i]] || null,
        correct: q.options[q.answer]
      }))
    };

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${firstName}_${lastName}_${timestamp}.json`;
    a.click();
  };

  window.downloadPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = 'logo.png';

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const fullName = `${firstName} ${lastName}`;
    const testName = testListBlock.classList.contains('hidden')
      ? testKeyInput.value
      : testListSelect.options[testListSelect.selectedIndex].text;
    const duration = msToHMS(endTime - startTime);

    logo.onload = function () {
      doc.addImage(logo, 'PNG', 140, 10, 50, 15);
      doc.setFontSize(16);
      doc.text("Sasha Minsker Quiz", 10, 15);
      doc.setFontSize(12);
      doc.text(`Имя: ${fullName}`, 10, 25);
      doc.text(`Тест: ${testName}`, 10, 32);
      doc.text(`Время прохождения: ${duration}`, 10, 39);
      doc.text(`Результат: ${correctAnswers} из ${questions.length}`, 10, 46);

      let y = 55;
      questions.forEach((q, i) => {
        const userAnswer = userAnswers[i];
        const correct = q.answer;
        const isCorrect = userAnswer === correct;

        doc.setFont(undefined, 'bold');
        doc.text(`Вопрос ${i + 1}:`, 10, y);
        y += 6;
        doc.setFont(undefined, 'normal');
        doc.text(q.question, 10, y);
        y += 6;

        doc.text(`Ваш ответ: ${q.options[userAnswer] || 'не выбран'}`, 10, y);
        y += 6;
        doc.text(`Правильный ответ: ${q.options[correct]}`, 10, y);
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });

      doc.save(`result_${firstName}_${lastName}.pdf`);
    };
  };
});
