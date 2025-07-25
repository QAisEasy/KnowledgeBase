// Простое приложение для тестов с улучшенным UI
class QuizApp {
    constructor() {
        this.testId = new URLSearchParams(window.location.search).get('id');
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.answers = [];
        this.testData = null;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.startTime = Date.now();
        this.timerInterval = null;
        
        this.init();
    }

    async init() {
        try {
            const response = await fetch(`data/tests/${this.testId}.json`);
            this.testData = await response.json();
            this.showQuestion();
            this.startTimer();
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            alert('Ошибка загрузки теста');
            window.location.href = 'index.html';
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('timerText').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    showQuestion() {
        const question = this.testData.questions[this.currentQuestion];
        const container = document.getElementById('questionContainer');
        
        // Обновляем прогресс
        const progress = ((this.currentQuestion + 1) / this.testData.questions.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Вопрос ${this.currentQuestion + 1} из ${this.testData.questions.length}`;
        document.getElementById('scoreText').textContent = 
            `${this.correctAnswers} правильных`;
        
        // Показываем вопрос с анимацией
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = `
                <div class="question-number">Вопрос ${this.currentQuestion + 1}</div>
                <div class="question">${question.question}</div>
                <div class="options">
                    ${question.options.map((option, index) => `
                        <div class="option" data-index="${index}" onclick="quiz.selectAnswer(${index})">
                            <strong>${String.fromCharCode(65 + index)}.</strong> ${option.text}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary" id="checkBtn" onclick="quiz.checkAnswer()" disabled>
                    Проверить ответ
                </button>
                <div id="explanationArea"></div>
            `;
            container.style.opacity = '1';
        }, 200);
        
        this.selectedAnswer = null;
        this.isAnswered = false;
    }

    selectAnswer(index) {
        if (this.isAnswered) return;
        
        // Снимаем выделение
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Выделяем выбранный
        document.querySelector(`[data-index="${index}"]`).classList.add('selected');
        this.selectedAnswer = index;
        
        // Активируем кнопку
        document.getElementById('checkBtn').disabled = false;
    }

    checkAnswer() {
        if (this.selectedAnswer === null || this.isAnswered) return;
        
        this.isAnswered = true;
        const question = this.testData.questions[this.currentQuestion];
        const correct = question.correctAnswer;
        const isCorrect = this.selectedAnswer === correct;
        
        if (isCorrect) {
            this.score++;
            this.correctAnswers++;
        }
        
        // Обновляем счетчик правильных ответов
        document.getElementById('scoreText').textContent = 
            `${this.correctAnswers} правильных`;
        
        // Показываем правильный/неправильный ответ
        document.querySelectorAll('.option').forEach((opt, index) => {
            opt.classList.add('disabled');
            if (index === correct) {
                opt.classList.add('correct');
            } else if (index === this.selectedAnswer && !isCorrect) {
                opt.classList.add('incorrect');
            }
        });
        
        // Показываем объяснение
        const explanationArea = document.getElementById('explanationArea');
        const explanation = isCorrect ? 
            question.explanations[this.selectedAnswer].correct : 
            question.explanations[this.selectedAnswer].incorrect;
            
        explanationArea.innerHTML = `
            <div class="explanation ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✅ Правильно!' : '❌ Неправильно!'}</strong>
                ${explanation}
            </div>
            <button class="btn btn-next" onclick="quiz.nextQuestion()">
                ${this.currentQuestion < this.testData.questions.length - 1 ? 
                    'Следующий вопрос →' : 
                    '🎯 Завершить тест'}
            </button>
        `;
        
        // Прячем кнопку проверки
        document.getElementById('checkBtn').style.display = 'none';
    }

    nextQuestion() {
        this.currentQuestion++;
        
        if (this.currentQuestion < this.testData.questions.length) {
            this.showQuestion();
        } else {
            this.showResult();
        }
    }

    showResult() {
        clearInterval(this.timerInterval);
        
        const percentage = Math.round((this.score / this.testData.questions.length) * 100);
        let message = '';
        let icon = '';
        
        if (percentage === 100) {
            message = 'Превосходно! Вы ответили правильно на все вопросы!';
            icon = '🏆';
        } else if (percentage >= 80) {
            message = 'Отличный результат! Вы хорошо знаете материал.';
            icon = '🎉';
        } else if (percentage >= 60) {
            message = 'Хороший результат! Есть над чем поработать.';
            icon = '👍';
        } else {
            message = 'Не расстраивайтесь! Попробуйте пройти тест еще раз.';
            icon = '💪';
        }
        
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('result').style.display = 'block';
        document.querySelector('.result-icon').textContent = icon;
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('scoreTotal').textContent = `из ${this.testData.questions.length}`;
        document.getElementById('resultMessage').textContent = message;
    }
}

// Создаем экземпляр приложения
const quiz = new QuizApp();