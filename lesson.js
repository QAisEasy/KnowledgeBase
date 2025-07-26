// Управление уроками
class LessonViewer {
    constructor() {
        this.lessonId = new URLSearchParams(window.location.search).get('id');
        this.courseStructure = null;
        this.currentLesson = null;
        this.currentLevel = null;
        this.init();
    }

    async init() {
        try {
            // Загружаем структуру курса
            const response = await fetch('data/course-structure.json');
            this.courseStructure = await response.json();
            
            // Находим текущий урок
            this.findCurrentLesson();
            
            if (this.currentLesson) {
                await this.loadLesson();
                this.setupNavigation();
                this.updateBreadcrumb();
            } else {
                this.showError('Урок не найден');
            }
        } catch (error) {
            console.error('Ошибка загрузки урока:', error);
            this.showError('Ошибка загрузки урока');
        }
    }

    findCurrentLesson() {
        for (const block of this.courseStructure.blocks) {
            for (const skill of block.skills) {
                for (const level of skill.levels) {
                    const lessonIndex = level.lessons.findIndex(l => l.id === this.lessonId);
                    if (lessonIndex !== -1) {
                        this.currentLesson = level.lessons[lessonIndex];
                        this.currentLevel = level;
                        this.currentLessonIndex = lessonIndex;
                        this.block = block;
                        this.skill = skill;
                        return;
                    }
                }
            }
        }
    }

    // Получаем путь к файлу урока в новой структуре
    getLessonPath() {
        const blockFolder = `block-${this.block.id}`;
        const skillFolder = `skill-${this.skill.id}`;
        const levelFolder = `level-${this.currentLevel.id.split('.').pop()}`;
        
        return `data/blocks/${blockFolder}/${skillFolder}/${levelFolder}/lessons/${this.lessonId}.md`;
    }

    async loadLesson() {
        try {
            // Загружаем markdown файл из новой структуры
            const lessonPath = this.getLessonPath();
            const response = await fetch(lessonPath);
            
            if (!response.ok) {
                throw new Error('Файл урока не найден');
            }
            
            const markdown = await response.text();
            
            // Отображаем заголовок и метаданные
            document.getElementById('lessonTitle').textContent = this.currentLesson.title;
            document.getElementById('lessonDuration').innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 4v4l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>${this.currentLesson.duration || '15 мин'}</span>
            `;
            
            // Конвертируем markdown в HTML
            const html = marked.parse(markdown);
            document.getElementById('lessonContent').innerHTML = html;
            
            // Подсветка кода
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // Генерируем оглавление
            this.generateTableOfContents();
            
            // Обновляем прогресс
            this.updateProgress();
            
        } catch (error) {
            console.error('Ошибка загрузки содержимого урока:', error);
            this.showError('Не удалось загрузить содержимое урока');
        }
    }

    generateTableOfContents() {
        const headings = document.querySelectorAll('#lessonContent h2, #lessonContent h3');
        const toc = document.getElementById('tableOfContents');
        
        if (headings.length === 0) {
            toc.innerHTML = '<p class="toc-empty">Нет заголовков</p>';
            return;
        }
        
        let tocHtml = '<ul class="toc-list">';
        
        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            
            const level = heading.tagName.toLowerCase();
            const text = heading.textContent;
            
            tocHtml += `
                <li class="toc-item toc-${level}">
                    <a href="#${id}" class="toc-link">${text}</a>
                </li>
            `;
        });
        
        tocHtml += '</ul>';
        toc.innerHTML = tocHtml;
        
        // Плавная прокрутка к заголовкам
        document.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `
            <a href="knowledge-base.html" class="breadcrumb-link">База знаний</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-text">Блок ${this.block.id}: ${this.block.title}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-text">${this.skill.title}</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${this.currentLevel.title}</span>
        `;
    }

    updateProgress() {
        const progress = document.getElementById('lessonProgress');
        const total = this.currentLevel.lessons.length;
        const current = this.currentLessonIndex + 1;
        progress.textContent = `Урок ${current} из ${total}`;
    }

    setupNavigation() {
        const prevBtn = document.getElementById('prevLesson');
        const nextBtn = document.getElementById('nextLesson');
        const actions = document.getElementById('lessonActions');
        
        // Предыдущий урок
        if (this.currentLessonIndex > 0) {
            prevBtn.disabled = false;
            prevBtn.addEventListener('click', () => {
                const prevLesson = this.currentLevel.lessons[this.currentLessonIndex - 1];
                window.location.href = `lesson.html?id=${prevLesson.id}`;
            });
        }
        
        // Следующий урок
        if (this.currentLessonIndex < this.currentLevel.lessons.length - 1) {
            nextBtn.addEventListener('click', () => {
                const nextLesson = this.currentLevel.lessons[this.currentLessonIndex + 1];
                window.location.href = `lesson.html?id=${nextLesson.id}`;
            });
            
            // Проверяем, есть ли тест у текущего урока
            if (this.currentLesson.test) {
                actions.innerHTML = `
                    <a href="test.html?id=${this.currentLesson.test}" class="btn btn-primary">
                        <span>Пройти тест к уроку</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                `;
            } else {
                actions.innerHTML = `
                    <a href="lesson.html?id=${this.currentLevel.lessons[this.currentLessonIndex + 1].id}" 
                       class="btn btn-primary">
                        <span>Следующий урок</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                `;
            }
        } else {
            // Это последний урок в уровне
            nextBtn.style.display = 'none';
            
            // Проверяем, есть ли тест у текущего урока
            if (this.currentLesson.test) {
                actions.innerHTML = `
                    <a href="test.html?id=${this.currentLesson.test}" class="btn btn-primary">
                        <span>Пройти тест к уроку</span>
                        <svg class="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 10h6m0 0l-3-3m3 3l-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                `;
            } else {
                actions.innerHTML = `
                    <a href="knowledge-base.html" class="btn btn-secondary">
                        <span>Вернуться к базе знаний</span>
                    </a>
                `;
            }
        }
    }

    showError(message) {
        const content = document.getElementById('lessonContent');
        content.innerHTML = `
            <div class="error-message">
                <h2>Ошибка</h2>
                <p>${message}</p>
                <a href="knowledge-base.html" class="btn btn-primary">К базе знаний</a>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new LessonViewer();
});