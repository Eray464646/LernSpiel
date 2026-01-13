// Quiz Roguelite Game Engine
class QuizRoguelite {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.state = 'menu'; // menu, playing, question, gameover
        this.mode = 'normal';
        this.theme = 'all';
        
        // Player
        this.player = {
            x: 100,
            y: 100,
            size: 20,
            speed: 3,
            hp: 10,
            maxHp: 10,
            shield: 0,
            score: 0
        };
        
        // Rooms
        this.currentRoom = 0;
        this.totalRooms = 20;
        this.rooms = [];
        this.roomSize = 150;
        
        // Questions
        this.allQuestions = [];
        this.currentQuestion = null;
        this.wrongAnswers = [];
        this.correctCount = 0;
        this.wrongCount = 0;
        this.selectedAnswer = null;
        this.answerSubmitted = false;
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Load questions
        this.loadQuestions();
        
        // Game loop
        this.lastTime = 0;
        this.gameLoop(0);
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // WASD + Arrow keys
            const moveKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
            if (moveKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    async loadQuestions() {
        const questionFiles = [
            '01-bigdata_data_science-begriffe_v5.json',
            '03_bigdata_data_science_beispieldaten_v1.json',
            '04-bigdata_data_science-data-exploration.json',
            '05-bigdata_data_science-data-preparation.json',
            '07-bigdata_data_science_Machine-Learning_Verfahren_A_v7.json',
            '08-bigdata_data_science_ML_bayes_v7_Lösung.json',
            '09-bigdata_data_science_NeuralNets_v7.json',
            '10-KI_Verschiedene_Technologien.json',
            '10-KI_Verschiedene_Technologien_v1.json',
            '11-KI_LLM_v1.json',
            '12-bigdata_science_Big-Data-Analytics_v3.json',
            '12_Neurosymbolische_KI-_Das_Beste_aus_allen_Welten.json',
            'Albanien__KI-Ministerin_soll_Korruption_ausmerzen_-_news.ORF.at.json',
            'DE_Transfer_Aufgabe_Big_Data_and_Data_Science.json',
            'DataScience_Lösungen.json',
            'Emergenz_Grammatik_in_LLMs.json',
            'KI_Periodensystem_Kapitel_4_Alle_Elemente.json',
            'Projekt_Donut.json',
            'Transferaufgabe.json',
            'bitkom_2018_-_Digitalisierung_gestalten_mit_dem_Periodensystem.json'
        ];
        
        const promises = questionFiles.map(file => 
            fetch(`data/questions/${file}`)
                .then(res => res.json())
                .catch(err => {
                    console.warn(`Could not load ${file}:`, err);
                    return [];
                })
        );
        
        const results = await Promise.all(promises);
        this.allQuestions = results.flat();
        
        console.log(`Loaded ${this.allQuestions.length} questions`);
        
        // Populate theme selector
        this.populateThemeSelector();
    }
    
    populateThemeSelector() {
        const themeSelect = document.getElementById('themeSelect');
        const sources = [...new Set(this.allQuestions.map(q => q.source_file))];
        
        sources.sort().forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source.replace('.pdf', '').replace(/_/g, ' ');
            themeSelect.appendChild(option);
        });
    }
    
    startGame() {
        this.mode = document.getElementById('modeSelect').value;
        this.theme = document.getElementById('themeSelect').value;
        
        // Reset game state
        this.player.hp = 10;
        this.player.maxHp = 10;
        this.player.shield = 0;
        this.player.score = 0;
        this.currentRoom = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.wrongAnswers = [];
        
        // Filter questions
        let questions = this.allQuestions;
        if (this.theme !== 'all') {
            questions = questions.filter(q => q.source_file === this.theme);
        }
        
        if (this.mode === 'transfer') {
            questions = questions.filter(q => 
                q.source_file.includes('Transfer') || 
                q.tags.some(t => t.toLowerCase().includes('crisp'))
            );
        }
        
        // Shuffle and select questions
        this.shuffleArray(questions);
        this.selectedQuestions = questions.slice(0, this.totalRooms);
        
        // Generate rooms
        this.generateRooms();
        
        // Start game
        this.state = 'playing';
        document.getElementById('startScreen').classList.remove('active');
        document.getElementById('questionScreen').classList.remove('active');
        document.getElementById('gameOverScreen').classList.remove('active');
        
        this.updateUI();
    }
    
    generateRooms() {
        this.rooms = [];
        const cols = 5;
        const rows = Math.ceil(this.totalRooms / cols);
        const spacing = this.roomSize + 50;
        const offsetX = 100;
        const offsetY = 100;
        
        for (let i = 0; i < this.totalRooms; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            this.rooms.push({
                x: offsetX + col * spacing,
                y: offsetY + row * spacing,
                width: this.roomSize,
                height: this.roomSize,
                completed: false,
                isBoss: (i + 1) % 10 === 0,
                questionIndex: i
            });
        }
        
        // Place player at first room
        this.player.x = this.rooms[0].x + this.rooms[0].width / 2;
        this.player.y = this.rooms[0].y + this.rooms[0].height / 2;
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Player movement
        let dx = 0, dy = 0;
        
        if (this.keys['w'] || this.keys['arrowup']) dy -= this.player.speed;
        if (this.keys['s'] || this.keys['arrowdown']) dy += this.player.speed;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= this.player.speed;
        if (this.keys['d'] || this.keys['arrowright']) dx += this.player.speed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.player.x += dx;
        this.player.y += dy;
        
        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height, this.player.y));
        
        // Check room collision
        this.checkRoomCollision();
    }
    
    checkRoomCollision() {
        for (let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            if (room.completed) continue;
            
            // Check if player is in room
            if (this.player.x >= room.x && 
                this.player.x <= room.x + room.width &&
                this.player.y >= room.y && 
                this.player.y <= room.y + room.height) {
                
                this.enterRoom(i);
                break;
            }
        }
    }
    
    enterRoom(roomIndex) {
        this.currentRoom = roomIndex;
        this.state = 'question';
        
        // Get question
        if (roomIndex < this.selectedQuestions.length) {
            this.currentQuestion = this.selectedQuestions[roomIndex];
            this.displayQuestion();
        }
    }
    
    displayQuestion() {
        const screen = document.getElementById('questionScreen');
        const questionText = document.getElementById('questionText');
        const questionType = document.getElementById('questionType');
        const optionsContainer = document.getElementById('optionsContainer');
        
        this.selectedAnswer = null;
        this.answerSubmitted = false;
        
        questionText.textContent = this.currentQuestion.question;
        
        // Question type hint
        const typeLabels = {
            'single': 'Single-Choice (eine richtige Antwort)',
            'multi': 'Multiple-Choice (mehrere richtige Antworten)',
            'tf': 'Wahr/Falsch',
            'short': 'Kurzantwort',
            'match': 'Zuordnung'
        };
        questionType.textContent = typeLabels[this.currentQuestion.type] || '';
        
        // Clear options
        optionsContainer.innerHTML = '';
        
        // Display options
        if (this.currentQuestion.options) {
            this.currentQuestion.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option';
                optionDiv.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
                optionDiv.onclick = () => this.selectOption(index, optionDiv);
                optionsContainer.appendChild(optionDiv);
            });
        }
        
        // Reset UI
        document.getElementById('explanation').classList.remove('active');
        document.getElementById('submitAnswer').style.display = 'inline-block';
        document.getElementById('nextQuestion').style.display = 'none';
        
        screen.classList.add('active');
    }
    
    selectOption(index, element) {
        if (this.answerSubmitted) return;
        
        // Remove previous selection
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        element.classList.add('selected');
        this.selectedAnswer = index;
    }
    
    checkAnswer() {
        if (this.selectedAnswer === null || this.answerSubmitted) return;
        
        this.answerSubmitted = true;
        const correct = this.selectedAnswer === this.currentQuestion.correct_answer;
        
        // Update UI
        const options = document.querySelectorAll('.option');
        options.forEach((opt, idx) => {
            if (idx === this.currentQuestion.correct_answer) {
                opt.classList.add('correct');
            } else if (idx === this.selectedAnswer && !correct) {
                opt.classList.add('incorrect');
            }
        });
        
        // Show explanation
        const explanation = document.getElementById('explanation');
        const explanationText = document.getElementById('explanationText');
        const sourceInfo = document.getElementById('sourceInfo');
        
        explanationText.textContent = this.currentQuestion.explanation;
        sourceInfo.innerHTML = `<strong>Quelle:</strong> ${this.currentQuestion.source_file}, Seite ${this.currentQuestion.source_page}`;
        
        explanation.classList.add('active');
        
        // Update game state
        if (correct) {
            this.correctCount++;
            this.giveReward();
        } else {
            this.wrongCount++;
            this.takeDamage();
            this.wrongAnswers.push(this.currentQuestion);
        }
        
        // Update UI
        document.getElementById('submitAnswer').style.display = 'none';
        document.getElementById('nextQuestion').style.display = 'inline-block';
        
        this.updateUI();
    }
    
    giveReward() {
        const rewards = ['hp', 'score', 'shield', 'score'];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        
        switch(reward) {
            case 'hp':
                if (this.player.hp < this.player.maxHp) {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
                }
                break;
            case 'score':
                this.player.score += 100;
                break;
            case 'shield':
                this.player.shield++;
                break;
        }
    }
    
    takeDamage() {
        if (this.player.shield > 0) {
            this.player.shield--;
        } else {
            this.player.hp--;
            if (this.player.hp <= 0) {
                this.gameOver(false);
            }
        }
    }
    
    nextQuestion() {
        document.getElementById('questionScreen').classList.remove('active');
        
        // Mark room as completed
        this.rooms[this.currentRoom].completed = true;
        
        // Check win condition
        if (this.currentRoom >= this.totalRooms - 1 || 
            this.rooms.filter(r => !r.completed).length === 0) {
            this.gameOver(true);
        } else {
            this.state = 'playing';
        }
    }
    
    gameOver(won) {
        this.state = 'gameover';
        
        const screen = document.getElementById('gameOverScreen');
        const title = document.getElementById('gameOverTitle');
        
        title.textContent = won ? 'Gewonnen! 🎉' : 'Game Over 💀';
        document.getElementById('finalScore').textContent = this.player.score;
        document.getElementById('finalRooms').textContent = this.currentRoom + 1;
        document.getElementById('correctAnswers').textContent = this.correctCount;
        document.getElementById('wrongAnswers').textContent = this.wrongCount;
        
        screen.classList.add('active');
    }
    
    returnToMenu() {
        this.state = 'menu';
        document.getElementById('startScreen').classList.add('active');
        document.getElementById('questionScreen').classList.remove('active');
        document.getElementById('gameOverScreen').classList.remove('active');
    }
    
    updateUI() {
        // HP
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const hpFill = document.getElementById('hpFill');
        hpFill.style.width = hpPercent + '%';
        hpFill.className = 'hp-fill' + (hpPercent <= 30 ? ' low' : '');
        document.getElementById('hpText').textContent = `${this.player.hp}/${this.player.maxHp}`;
        
        // Score
        document.getElementById('score').textContent = this.player.score;
        
        // Shield
        document.getElementById('shield').textContent = this.player.shield;
        
        // Room
        document.getElementById('roomNumber').textContent = `Raum ${this.currentRoom + 1}/${this.totalRooms}`;
    }
    
    render() {
        if (this.state !== 'playing') return;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw rooms
        this.rooms.forEach((room, index) => {
            // Room background
            if (room.completed) {
                ctx.fillStyle = '#1b5e20';
            } else if (room.isBoss) {
                ctx.fillStyle = '#b71c1c';
            } else {
                ctx.fillStyle = '#16213e';
            }
            ctx.fillRect(room.x, room.y, room.width, room.height);
            
            // Room border
            ctx.strokeStyle = room.completed ? '#4caf50' : (room.isBoss ? '#e94560' : '#0f3460');
            ctx.lineWidth = 3;
            ctx.strokeRect(room.x, room.y, room.width, room.height);
            
            // Room number
            ctx.fillStyle = '#eee';
            ctx.font = '20px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(index + 1, room.x + room.width / 2, room.y + room.height / 2);
            
            // Boss indicator
            if (room.isBoss) {
                ctx.font = '30px Arial';
                ctx.fillText('👑', room.x + room.width / 2, room.y + 30);
            }
            
            // Checkmark for completed
            if (room.completed) {
                ctx.font = '40px Arial';
                ctx.fillText('✓', room.x + room.width / 2, room.y + room.height - 20);
            }
        });
        
        // Draw connections between rooms
        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const room1 = this.rooms[i];
            const room2 = this.rooms[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(room1.x + room1.width / 2, room1.y + room1.height / 2);
            ctx.lineTo(room2.x + room2.width / 2, room2.y + room2.height / 2);
            ctx.stroke();
        }
        
        // Draw player
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Player outline
        ctx.strokeStyle = '#ff6b81';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shield indicator
        if (this.player.shield > 0) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.player.x, this.player.y, this.player.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize game when DOM is ready
let game;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new QuizRoguelite();
    });
} else {
    game = new QuizRoguelite();
}
