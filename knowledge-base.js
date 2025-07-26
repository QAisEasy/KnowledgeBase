// Загрузка и отображение структуры курса
class KnowledgeBase {
    constructor() {
        this.courseStructure = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('data/course-structure.json');
            this.courseStructure = await response.json();
            this.renderBlocks();
        } catch (error) {
            console.error('Ошибка загрузки структуры курса:', error);
            this.showError();
        }
    }

    renderBlocks() {
        const container = document.getElementById('blocksContainer');
        
        this.courseStructure.blocks.forEach((block, blockIndex) => {
            const blockHtml = this.createBlockHtml(block, blockIndex);
            container.innerHTML += blockHtml;
        });

        // Добавляем обработчики событий для сворачивания/разворачивания
        this.attachEventHandlers();
    }

    createBlockHtml(block, blockIndex) {
        const skillsHtml = block.skills.map(skill => this.createSkillHtml(skill, block.id)).join('');
        
        return `
            <div class="block" style="animation-delay: ${blockIndex * 0.1}s">
                <div class="block-header">
                    <div class="block-icon">${block.icon || '📚'}</div>
                    <div class="block-info">
                        <h2 class="block-title">БЛОК ${block.id}: ${block.title}</h2>
                        <p class="block-description">${block.description}</p>
                    </div>
                </div>
                <div class="skills-grid">
                    ${skillsHtml}
                    ${this.createBlockProgress(block)}
                </div>
            </div>
        `;
    }

    createSkillHtml(skill, blockId) {
        const levelsHtml = skill.levels.map(level => this.createLevelHtml(level)).join('');
        
        return `
            <div class="skill">
                <div class="skill-header" data-skill-id="${skill.id}">
                    <div class="skill-title">
                        <span class="skill-number">${skill.id}</span>
                        <span>${skill.title}</span>
                    </div>
                    <svg class="skill-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="levels" id="levels-${skill.id}">
                    ${levelsHtml}
                </div>
            </div>
        `;
    }

    createLevelHtml(level) {
        const status = level.status || 'coming-soon';
        const isActive = status === 'active';
        const lessonsCount = level.lessons ? level.lessons.length : 0;
        
        return `
            <div class="level ${status}">
                <div class="level-number">${level.id.split('.').pop()}</div>
                <div class="level-title">${level.title}</div>
                <div class="level-lessons">${lessonsCount} ${this.getLessonsWord(lessonsCount)}</div>
                <div class="level-actions">
                    ${isActive && lessonsCount > 0 ? `
                        <a href="lesson.html?id=${level.lessons[0].id}" class="level-btn">
                            <span class="level-btn-icon">📖</span>
                            Начать обучение
                        </a>
                    ` : `
                        <span class="level-btn disabled">
                            <span class="level-btn-icon">📖</span>
                            Скоро
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    createBlockProgress(block) {
        // Подсчитываем прогресс блока (в реальном приложении это бы бралось из localStorage)
        const totalLevels = block.skills.reduce((acc, skill) => acc + skill.levels.length, 0);
        const activeLevels = block.skills.reduce((acc, skill) => 
            acc + skill.levels.filter(l => l.status === 'active').length, 0
        );
        const progress = totalLevels > 0 ? Math.round((activeLevels / totalLevels) * 100) : 0;
        
        return `
            <div class="block-progress">
                <span class="progress-text">Доступно уровней:</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${activeLevels} из ${totalLevels}</span>
            </div>
        `;
    }

    getLessonsWord(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            return 'уроков';
        }
        
        if (lastDigit === 1) {
            return 'урок';
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            return 'урока';
        } else {
            return 'уроков';
        }
    }

    attachEventHandlers() {
        // Сворачивание/разворачивание навыков
        document.querySelectorAll('.skill-header').forEach(header => {
            header.addEventListener('click', () => {
                const skillId = header.dataset.skillId;
                const levelsContainer = document.getElementById(`levels-${skillId}`);
                const arrow = header.querySelector('.skill-arrow');
                
                levelsContainer.classList.toggle('collapsed');
                arrow.classList.toggle('rotated');
            });
        });
    }

    showError() {
        const container = document.getElementById('blocksContainer');
        container.innerHTML = `
            <div class="error-message">
                <p>Ошибка загрузки структуры курса. Пожалуйста, попробуйте позже.</p>
                <a href="index.html" class="btn btn-primary">На главную</a>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeBase();
});