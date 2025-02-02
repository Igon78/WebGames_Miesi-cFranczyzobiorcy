import { Scene } from 'phaser';
import { collection, addDoc, doc, getDocs, setDoc, getDoc } from "firebase/firestore";

export default class Quiz extends Scene {
    constructor() {
      super('Quiz');
    }
    preload()
      {
        this.load.image('textbox', 'assets/gra_opis.png');
        this.load.image('background', 'assets/Quiz_tlo.png');
        this.load.image('question', 'assets/Quiz_pytanie.png');
        this.load.image('answer', 'assets/Quiz_odpowiedz.png');
        this.load.font('myFont', 'assets/fonts/IntroBlackCapsRegular.otf');
        this.load.image('home', 'assets/home.png');
        this.load.spritesheet('answer2', 'assets/Quiz_odpowiedz_animated.png', { frameWidth: 633, frameHeight: 243 });
    }
    create() {
      // zmienne
      this.startTime = null;
      this.timeStop = true;
      this.timerText = null;
      this.game_time_formatted = null;
      this.elapsedTime = null;
      this.elapsedTimePause = 0;
      this.timePaused = false;
      this.round = 0;
      this.roundText = null;
      this.activeQuestion = null;

      this.questionBox = null;
      this.answerButtons = null;
      this.questions = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
      //tło      
      let image = this.add.image(300, 400, 'background');
      image.setDisplaySize(600, 800);

      //powrót menu
      this.home = this.add.image(25, 35, 'home');
      this.home.setScale(0.3);
      this.home.setInteractive();
      this.home.on('pointerdown', () => {
          this.scene.restart();
          this.scene.start('MainMenu')
        }).setOrigin(0.5);

      //Znacznik czasu
      this.timerText = this.add
        .text(this.scale.width - 150, 30, 'CZAS', {
          fontFamily: 'myFont',
          align: 'left',
          fontSize: '22px',
          stroke: '#000000', strokeThickness: 8,
          wordWrap: {
            width: this.scale.width - 50,
          },
      }).setOrigin(0.5);

      //numer rundy
      this.roundText = this.add
        .text(170, 30, `Runda 0/5`, {
          fontFamily: 'myFont',
          align: 'center',
          fontSize: '22px',
          stroke: '#000000', strokeThickness: 8,
          wordWrap: {
            width: this.scale.width - 50,
          },
      }).setOrigin(0.5);

      //pytanie
      this.questionBox = this.add.image(300, 300,'question');
      this.questionBox.setScale(0.75);

      this.questionBox.questionText = this.add.text(300, 300, "", {
        align: 'center',
        fontFamily: 'myFont',
        fontSize: '20px',
        fill: '#46f740',
        wordWrap: {
          width: 370,
      }
      });
      this.questionBox.setOrigin(0.5, 0.5);
      this.questionBox.questionText.setOrigin(0.5, 0.5);

      //odpowiedzi
      this.answerButtons= this.physics.add.group();

      this.answerButtons.create(170, 500, 'answer2',0);
      this.answerButtons.create(170, 600, 'answer2',0);
      this.answerButtons.create(430, 500, 'answer2',0);
      this.answerButtons.create(430, 600, 'answer2',0);

      this.answerButtons.children.iterate((child) => {
        child.setScale(0.4);
        child.answerText = this.add.text(child.x, child.y, "", {
          align: 'center',
          fontFamily: 'myFont',
          fontSize: '20px',
          fill: '#46f740',
          wordWrap: {
            width: 200,
            }
          });
        child.setOrigin(0.5, 0.5);
        child.answerText.setOrigin(0.5, 0.5);

        child.setInteractive();
        child.answerText.setInteractive();

        child.on('pointerdown', () => {
          this.checkAnswer(child)
        });
    
        child.answerText.on('pointerdown', () => {
          this.checkAnswer(child)
        });
      });

      //rozpoczęcie
      this.showMessageBox("Twoim zadaniem jest odpowiedzieć poprawnie na wszystkie pytania w jak najszybszym czasie. \nPomyłka oznacza koniec gry. \n\nPowodzenia!",() => {
        this.nextRound();
        this.timePaused = true;
        this.timeStop = false;
        this.startTime = this.time.now;
      });
    }
    //liczenie czasu
    update(time){
       
      if(!this.timeStop && !this.timePaused){
        this.elapsedTime = time - this.startTime - this.elapsedTimePause;

        const minutes = Math.floor(this.elapsedTime / 60000); // 60,000 ms in a minute
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000); // 1,000 ms in a second
        const milliseconds = Math.floor((this.elapsedTime % 1000)); // Remaining milliseconds
  
        // Format time to ensure two digits for seconds and minutes
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        const formattedMilliseconds = String(milliseconds).padStart(1, '0'); // Show 3 digits for milliseconds
  
        // Update the text display with the formatted time
        this.timerText.setText(`Upłynęło: ${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`);
        this.game_time_formatted = `${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
      }
      if(this.timePaused){
        this.elapsedTimePause = time - this.startTime - this.elapsedTime;
      }
    }
    //wysłanie wyniku do bazy danych
    async sendResultToFirestore() {
      const db = this.game.db;
      const docRef = doc(db, "users", this.game.player);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 3000) // 5 sekund
    );

      try{
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);
        const data = docSnap.data();
        if('wynik_quiz' in data && 'guessed_quiz' in data){
          if(this.round > data.guessed_quiz || (this.round === data.guessed_quiz &&  this.elapsedTime < data.wynik_quiz)  ){
            await Promise.race([setDoc(doc(db, "users", this.game.player), {
              wynik_quiz: this.elapsedTime,
              guessed_quiz: this.round
              }, { merge: true }), timeoutPromise]);
          }
          else return;
        }
        else{
          await Promise.race([setDoc(doc(db, "users", this.game.player), {
            wynik_quiz: this.elapsedTime,
            guessed_quiz: this.round
            }, { merge: true }), timeoutPromise]);
        }
      } catch (e) {
        throw new Error("Problem z internetem lub połączeniem z bazą Firebase");
        }
      
    }
    //wyświetlenie pop-upu
    showMessageBox(message,callback){
      let box = this.add.image(0, 0,'textbox')

      const boxWidth = box.displayWidth;
      const boxHeight = box.displayHeight;
      let text = this.add.text(0, 0, message, {
        fontFamily: 'myFont',
        fontSize: '22px',
        fill: '#ffffff',
        wordWrap: {
          width: boxWidth - 170,
      }
      });
      text.setAlign('center')
      text.setOrigin(0.5,0.5);
      text.setPosition(box.x, box.y-30);

      let textbox = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2, [box, text]);
      textbox.setSize(boxWidth, boxHeight);
      textbox.setInteractive();
      textbox.on('pointerdown', () => {
          if (callback) {
              callback();
          }
          textbox.destroy();
      });
    }
    //sprawdzenie czy odpowiedz jest dobra
    async checkAnswer(child){
      let playerChoice = child;
      this.timePaused = true;
      this.answerButtons.children.iterate((child) => {
        child.answerText.setInteractive(false);
        child.setInteractive(false);
      });
      this.home.setInteractive(false);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 5000) // 5 sekund
      );
      const db = this.game.db;
      try{
        let docSnap = await Promise.race([getDoc(doc(db,'questions', this.activeQuestion)), timeoutPromise]);
        let correct = docSnap.data().correct;
        if(playerChoice.answerText.text === correct){
          playerChoice.setFrame(1);
          await this.delay(500);

          if(this.round===5){
            this.endGame("Gratulacje!\nUdało Ci się odpowiedzieć na wszystkie pięć pytań.");
          }
          else this.nextRound();
        }
        else {
          playerChoice.setFrame(2);
          await this.delay(500);
          this.round--;
          this.endGame(`Koniec gry!\nNiestety nie udało Ci się odpowiedzieć poprawnie na to pytanie.\n Udało Ci się przejść ${this.round} na 5 rund.`);
        }
        
      }
      catch(e){
        this.showMessageBox(`Stacono połączenie z serwerem.\n Sprawdź wynik jeszcze raz`,()=>{
        this.checkAnswer(playerChoice);
        });
      }

    }
    //przejscie do następnej rundy
    nextRound(){
      this.answerButtons.children.iterate((child) => {child.setFrame(0)});
      this.getQuestion().then(result => {
        this.round++;
        this.roundText.setText(`Runda ${this.round}/5`);
        this.showMessageBox(`Runda ${this.round}/5`,()=>{
          this.questionBox.questionText.setText(result.question);
          for(let i=0; i<4; i++){
            this.answerButtons.getChildren()[i].answerText.setText(result.answers[i]);
            this.answerButtons.getChildren()[i].answerText.setInteractive();
            this.answerButtons.getChildren()[i].setInteractive();
          }
          this.home.setInteractive();
          this.timePaused = false;

        });

      }).catch((error) => {
        this.showMessageBox("Wynik nie został wysłany.\nSprawdź swoje połączenie i wyślij wynik jeszcze raz.", () => {
          this.nextRound();
        })
    });
      
    }
    //koniec gry
    endGame(endText){
      this.timeStop=true;
      this.sendResultToFirestore().then(result => {
        this.showMessageBox(`${endText}\nTwój wynik czasowy to: ${this.game_time_formatted}`,()=>{
          this.scene.restart();
          this.scene.start('MainMenu');
        });
      }).catch((error) => {
        this.showMessageBox("Wynik nie został wysłany.\nSprawdź swoje połączenie i wyślij wynik jeszcze raz.", () => {
          this.endGame();
        })
    });
    }
    //pobranie pytania
    async getQuestion(){
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 5000) // 5 sekund
      );

      const db = this.game.db;
      //losowanie pytania
      let index = Phaser.Math.Between(0,this.questions.length-1);
      this.activeQuestion = `Question${this.questions[index]}`;
      this.questions.splice(index,1);
      //pobranie pytania
      try{
        let docSnap = await Promise.race([getDoc(doc(db,'questions', this.activeQuestion)), timeoutPromise]);
        let data = docSnap.data();
        let question = data.question;
        let answers = data.answers;
        function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]]; // zamiana miejscami
          }
          return array;
      }
        answers = shuffleArray(answers);
        if(question===null || answers == null) this.getQuestion();
        else return {question, answers}
        
      }
      catch(e){
        throw new Error("Problem z internetem lub połączeniem z bazą. Pobierz pytanie jeszcze raz.");
      }

    }
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

