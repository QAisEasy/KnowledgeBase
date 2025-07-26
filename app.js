// Управление тестами
class QuizApp {
    constructor() {
        this.testId = new URLSearchParams(window.location.search).get('id');
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.answers = [];
        this.testData = null;
        this.courseStructure = null;
        this.selectedAnswer = null;
        this.isAnswered = false;
        this.startTime = Date.now();
        this.timerInterval = null;
        
        // Информация о местоположении теста
        this.block = null;
        this.skill = null;
        this.level = null;
        
        this.init();
    }

    async init() {
        try {
            // Загружаем структуру курса
            const courseResponse = await fetch('data/course-structure.json');
            this.courseStructure = await courseResponse.json();
            
            // Находим информацию о тесте
            this.findTestInfo();
            
            if (this.block && this.skill && this.level) {
                // Загружаем данные теста из новой структуры
                const testPath = this.getTestPath();
                const testResponse = await fetch(testPath);
                this.testData = await testResponse.json();
                
                this.showQuestion();
                this.startTimer();
            } else {
                throw new Error('Тест не найден в структуре курса');
            }
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            alert('Ошибка загрузки теста');
            window.location.href = 'tests.html';
        }
    }

    findTestInfo() {
        for (const block of this.courseStructure.blocks) {
            for (const skill of block.skills) {
                for (const level of skill.levels) {
                    for (const lesson of level.lessons) {
                        if (lesson.test === this.testId) {
                            this.block = block;
                            this.skill = skill;
                            this.level = level;
                            return;
                        }
                    }
                }
            }
        }
    }

    getTestPath() {
        const blockFolder = `block-${this.block.id}`;
        const skillFolder = `skill-${this.skill.id}`;
        const levelFolder = `level-${this.level.id.split('.').pop()}`;
        
        return `data/blocks/${blockFolder}/${skillFolder}/${levelFolder}/tests/${this.testId}.json`;
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
        
        // Сохраняем ответ
        this.answers.push({
            questionId: question.id,
            selected: this.selectedAnswer,
            correct: correct,
            isCorrect: isCorrect
        });
        
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
        
        // Генерируем кнопки навигации
        this.generateResultActions();
    }

    generateResultActions() {
        const actions = document.getElementById('resultActions');
        let actionsHtml = '';
        
        // Находим информацию о текущем уровне
        const levelInfo = this.findLevelInfo();
        
        if (levelInfo) {
            const { level, skill, block, nextLessonId, isLastLevel, isLastLessonInLevel } = levelInfo;
            
            if (nextLessonId) {
                // Есть следующий урок в текущем уровне
                actionsHtml += `
                    <a href="lesson.html?id=${nextLessonId}" class="btn btn-primary">
                        <span>Следующий урок</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                `;
            } else if (isLastLessonInLevel && !isLastLevel) {
                // Это последний урок в уровне, но есть следующий уровень
                const nextLevel = this.getNextLevel(skill, level);
                if (nextLevel && nextLevel.lessons.length > 0 && nextLevel.status === 'active') {
                    actionsHtml += `
                        <a href="lesson.html?id=${nextLevel.lessons[0].id}" class="btn btn-primary">
                            <span>Перейти к следующему уровню</span>
                            <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </a>
                    `;
                } else {
                    actionsHtml += `
                        <a href="knowledge-base.html" class="btn btn-primary">
                            <span>К базе знаний</span>
                        </a>
                    `;
                }
            } else {
                // Это последний урок в последнем уровне
                actionsHtml += `
                    <a href="knowledge-base.html" class="btn btn-primary">
                        <span>К базе знаний</span>
                    </a>
                `;
            }
        }
        
        // Всегда добавляем кнопки "Пройти заново" и "К списку тестов"
        actionsHtml += `
            <button class="btn btn-secondary" onclick="location.reload()">
                <span>Пройти заново</span>
            </button>
            <a href="tests.html" class="btn btn-secondary">
                <span>К списку тестов</span>
            </a>
        `;
        
        actions.innerHTML = actionsHtml;
    }

    findLevelInfo() {
        // Используем уже найденную информацию
        const level = this.level;
        const skill = this.skill;
        const block = this.block;
        
        // Находим урок с этим тестом
        const lessonIndex = level.lessons.findIndex(lesson => lesson.test === this.testId);
        if (lessonIndex !== -1) {
            const currentLesson = level.lessons[lessonIndex];
            let nextLessonId = null;
            
            // Проверяем, есть ли следующий урок в этом уровне
            if (lessonIndex < level.lessons.length - 1) {
                nextLessonId = level.lessons[lessonIndex + 1].id;
            }
            
            const levelIndex = skill.levels.findIndex(l => l.id === level.id);
            const isLastLevel = levelIndex === skill.levels.length - 1;
            const isLastLessonInLevel = lessonIndex === level.lessons.length - 1;
            
            return { 
                level, 
                skill, 
                block, 
                currentLesson,
                nextLessonId, 
                isLastLevel,
                isLastLessonInLevel 
            };
        }
        return null;
    }

    getNextLevel(skill, currentLevel) {
        const currentIndex = skill.levels.findIndex(l => l.id === currentLevel.id);
        if (currentIndex !== -1 && currentIndex < skill.levels.length - 1) {
            return skill.levels[currentIndex + 1];
        }
        return null;
    }
}

// Создаем экземпляр приложения
const quiz = new QuizApp();