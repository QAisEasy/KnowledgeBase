// Управление списком тестов
class TestsList {
    constructor() {
        this.courseStructure = null;
        this.tests = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        try {
            // Загружаем структуру курса
            const response = await fetch('data/course-structure.json');
            this.courseStructure = await response.json();
            
            // Извлекаем все тесты
            this.extractTests();
            
            // Отображаем тесты
            this.renderTests();
            
            // Настраиваем фильтры
            this.setupFilters();
            
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            this.showError();
        }
    }

    extractTests() {
        this.courseStructure.blocks.forEach(block => {
            block.skills.forEach(skill => {
                skill.levels.forEach(level => {
                    // Извлекаем тесты из каждого урока
                    level.lessons.forEach(lesson => {
                        if (lesson.test) {
                            this.tests.push({
                                id: lesson.test,
                                title: lesson.title,
                                lessonId: lesson.id,
                                levelTitle: level.title,
                                blockId: block.id,
                                blockTitle: block.title,
                                skillTitle: skill.title,
                                status: level.status || 'coming-soon',
                                difficulty: this.getDifficulty(level.id)
                            });
                        }
                    });
                });
            });
        });
    }

    getDifficulty(levelId) {
        const levelNumber = parseInt(levelId.split('.').pop());
        if (levelNumber === 0) return 'Базовый';
        if (levelNumber === 1) return 'Начальный';
        if (levelNumber === 2) return 'Средний';
        if (levelNumber === 3) return 'Продвинутый';
        return 'Экспертный';
    }

    renderTests() {
        const container = document.getElementById('testsGrid');
        const filteredTests = this.filterTests();
        
        if (filteredTests.length === 0) {
            container.innerHTML = `
                <div class="no-tests">
                    <p>Нет тестов в выбранной категории</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredTests.map((test, index) => 
            this.createTestCard(test, index)
        ).join('');
    }

    filterTests() {
        if (this.currentFilter === 'all') {
            return this.tests;
        }
        return this.tests.filter(test => test.status === this.currentFilter);
    }

    createTestCard(test, index) {
        const isActive = test.status === 'active';
        const statusClass = isActive ? '' : 'test-card-disabled';
        const statusBadge = isActive ? '' : '<span class="test-badge-soon">Скоро</span>';
        
        return `
            <div class="test-card ${statusClass}" style="animation-delay: ${index * 0.1}s">
                <div class="test-card-header">
                    <div class="test-icon">📝</div>
                    <div class="test-badges">
                        <span class="test-badge-difficulty test-badge-${test.difficulty.toLowerCase()}">${test.difficulty}</span>
                        ${statusBadge}
                    </div>
                </div>
                <h3 class="test-title">Тест: ${test.title}</h3>
                <div class="test-info">
                    <p class="test-block">Блок ${test.blockId}: ${test.blockTitle}</p>
                    <p class="test-skill">${test.skillTitle} / ${test.levelTitle}</p>
                </div>
                <div class="test-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📖</span>
                        <span>К уроку ${test.lessonId}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">⏱️</span>
                        <span>~5 минут</span>
                    </div>
                </div>
                ${isActive ? `
                    <a href="test.html?id=${test.id}" class="btn btn-primary">
                        <span>Начать тест</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                ` : `
                    <button class="btn btn-primary" disabled>
                        <span>Недоступно</span>
                    </button>
                `}
            </div>
        `;
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Обновляем активную кнопку
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Обновляем фильтр и перерисовываем
                this.currentFilter = btn.dataset.filter;
                this.renderTests();
            });
        });
    }

    showError() {
        const container = document.getElementById('testsGrid');
        container.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки тестов. Пожалуйста, попробуйте позже.</p>
                <a href="index.html" class="btn btn-primary">На главную</a>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new TestsList();
});