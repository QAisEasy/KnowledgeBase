// Простое приложение для тестов
class QuizApp {
    constructor() {
        this.testId = new URLSearchParams(window.location.search).get('id');
        this.currentQuestion = 0;
        this.score = 0;
        this.answers = [];
        this.testData = null;
        this.selectedAnswer = null;
        this.isAnswered = false;
        
        this.init();
    }

    async init() {
        try {
            const response = await fetch(`data/tests/${this.testId}.json`);
            this.testData = await response.json();
            this.showQuestion();
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            alert('Ошибка загрузки теста');
            window.location.href = 'index.html';
        }
    }

    showQuestion() {
        const question = this.testData.questions[this.currentQuestion];
        const container = document.getElementById('questionContainer');
        
        // Обновляем прогресс
        const progress = ((this.currentQuestion + 1) / this.testData.questions.length) * 100;
        document.getElementById('progressBar').style.width = progress + '%';
        
        // Показываем вопрос
        container.innerHTML = `
            <div class="question-number">Вопрос ${this.currentQuestion + 1} из ${this.testData.questions.length}</div>
            <div class="question">${question.question}</div>
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option" data-index="${index}" onclick="quiz.selectAnswer(${index})">
                        ${String.fromCharCode(65 + index)}. ${option.text}
                    </div>
                `).join('')}
            </div>
            <button class="btn" id="checkBtn" onclick="quiz.checkAnswer()" disabled>
                Проверить ответ
            </button>
            <div id="explanationArea"></div>
        `;
        
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
        }
        
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
                <strong>${isCorrect ? '✅ Правильно!' : '❌ Неправильно!'}</strong><br>
                ${explanation}
            </div>
            <button class="btn btn-next" onclick="quiz.nextQuestion()">
                ${this.currentQuestion < this.testData.questions.length - 1 ? 'Следующий вопрос' : 'Завершить тест'}
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
        document.getElementById('questionContainer').style.display = 'none';
        document.getElementById('result').style.display = 'block';
        document.getElementById('score').textContent = 
            `${this.score} из ${this.testData.questions.length}`;
    }
}

// Создаем экземпляр приложения
const quiz = new QuizApp();