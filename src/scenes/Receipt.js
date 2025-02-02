
import { Scene } from 'phaser';
import {setDoc, doc, getDoc } from "firebase/firestore";

export default class Receipt extends Scene {
    constructor() {
      super('Receipt');
    }
    preload()
      {
        this.load.image('Paragon1', 'assets/Paragony/Paragon1.png');
        this.load.image('Paragon2', 'assets/Paragony/Paragon2.png');
        this.load.image('Paragon3', 'assets/Paragony/Paragon3.png');
        this.load.image('Paragon4', 'assets/Paragony/Paragon4.png');
        this.load.image('Paragon5', 'assets/Paragony/Paragon5.png');
        this.load.image('textbox', 'assets/gra_opis.png');
        this.load.image('background', 'assets/Quiz_tlo.png');
        this.load.font('myFont', 'assets/fonts/IntroBlackCapsRegular.otf');
        this.load.image('home', 'assets/home.png');
    }
    create() {
      this.startTime = null;
      this.timeStop = true;
      this.game_time_formatted = null;
  
      this.elapsedTime = null;
      this.foundErrors = 0;

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

      //znacznik znalezień
        this.matchedText = this.add
            .text(170, 30, 'Znaleziono: 0/5', {
            fontFamily: 'myFont',
            align: 'left',
            fontSize: '22px',
            stroke: '#000000', strokeThickness: 8,
            wordWrap: {
                width: this.scale.width - 50,
            },
        }).setOrigin(0.5);

      //losowanie i wyświetlenie zdjęcia
      let activeParagon = `Paragon${Phaser.Math.Between(1,5)}`;
      this.receipt = this.add.image(300, 415, activeParagon);
      const scaleFactor = 0.42;
      const tolerance = 20;
      this.receipt.setScale(scaleFactor);
      this.receipt.setOrigin(0.5,0.5);
      this.receipt.setVisible(false);
      const absX = this.receipt.x - this.receipt.displayWidth/2
      const absY = this.receipt.y - this.receipt.displayHeight/2
    
      const errorZones = {  //1192x1684
        Paragon1:[{ x: 15, y: 282, width: 546, height: 70},  
          { x: 320, y: 792, width: 116, height: 64},
          { x: 877, y: 877, width: 307, height: 152},
          { x: 365, y: 1452, width: 472, height: 80},  
          { x: 1012, y: 1552, width: 155, height: 70}],

        Paragon2:[{ x: 90, y: 124, width: 345, height: 78},  
          { x: 251, y: 743, width: 278, height: 71},
          { x: 995, y: 795, width: 184, height: 84},
          { x: 568, y: 1313, width: 496, height: 56},  
          { x: 9, y: 1500, width: 503, height: 74}],

        Paragon3:[{ x: 426, y: 127, width: 360, height: 66},  
          { x: 369, y: 354, width: 241, height: 58},
          { x: 23, y: 906, width: 447, height: 113},
          { x: 177, y: 1362, width: 851, height: 64},  
          { x: 28, y: 1560, width: 554, height: 52}],

        Paragon4:[{ x: 300, y: 195, width: 137, height: 75},  
          { x: 1026, y: 422, width: 159, height: 75},
          { x: 249, y: 735, width: 203, height: 80},
          { x: 365, y: 1456, width: 205, height: 70},  
          { x: 174, y: 1601, width: 294, height: 70}],

        Paragon5:[{ x: 541, y: 194, width: 277, height: 83}, 
          { x: 399, y: 340, width: 411, height: 87},
          { x: 179, y: 794, width: 112, height: 76},
          { x: 867, y: 900, width: 316, height: 131},
          { x: 162, y: 1605, width: 354, height: 74}],
      }

      const graphics = this.add.graphics();
      //Znacznik dodania czasu
      this.addTime = this.add
        .text(this.scale.width - 100, 70, '+ 5 sekund!', {
          fontFamily: 'myFont',
          fill: '#d42424',
          align: 'left',
          fontSize: '22px',
          stroke: '#000000', strokeThickness: 8,
          wordWrap: {
            width: this.scale.width - 50,
          },
      }).setOrigin(0.5);
      this.addTime.setVisible(false);

      //obsługa kliknięcia w obszar paragonu
      this.receipt.on('pointerdown', (pointer) => {
          const clickedX = pointer.x;
          const clickedY = pointer.y;

          for (let i=0;i<errorZones[activeParagon].length; i++) {
            let zone = errorZones[activeParagon][i];
            if (clickedX > absX + zone.x*scaleFactor - tolerance && clickedX < absX + zone.x*scaleFactor + zone.width*scaleFactor + tolerance&&
                clickedY > absY + zone.y*scaleFactor - tolerance && clickedY < absY + zone.y*scaleFactor + zone.height*scaleFactor + tolerance) {
                  
                errorZones[activeParagon].splice(i,1);
                this.foundErrors++;
                this.matchedText.setText(`Znaleziono: ${this.foundErrors}/5`)
                graphics.lineStyle(2, 0xff0000, 1);
                graphics.strokeRect(absX + zone.x*scaleFactor, absY + zone.y*scaleFactor, zone.width*scaleFactor, zone.height*scaleFactor);
                if(this.foundErrors===5){
                  this.endGame();
                }
                return;
            }
          }
          this.startTime -= 5000;
          this.addTime.setVisible(true);
          this.time.delayedCall(300, () => {
            this.addTime.setVisible(false);
        });
      });

      //start gry
      this.showMessageBox("Twoim zadaniem jest jak najszybsze znalezienie pięciu błędów na paragonie. \nBądź ostrożny - każde kliknięcie w poprawny obszar paragonu dodaje 5 sekund do czasu. \n\nPowodzenia!",() => { 
        this.receipt.setInteractive();
        this.receipt.setVisible(true);
        this.timeStop = false;
        this.startTime = this.time.now;
      });
    }
    update(time){
       
      if(!this.timeStop){
        this.elapsedTime = time - this.startTime;

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

    }
    //wysłanie wyniku do bazy
    async sendResultToFirestore() {
      const db = this.game.db;
      const docRef = doc(db, "users", this.game.player);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 3000) // 5 sekund
    );

      try{
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);
        const data = docSnap.data();

        if('wynik_paragon' in data){
          if(this.elapsedTime < data.wynik_paragon){
            await Promise.race([setDoc(doc(db, "users", this.game.player), {
              wynik_paragon: this.elapsedTime
              }, { merge: true }), timeoutPromise]);
          }
          else return;
        }
        else{
          await Promise.race([setDoc(doc(db, "users", this.game.player), {
            wynik_paragon: this.elapsedTime
            }, { merge: true }), timeoutPromise]);
        }
      } catch (e) {
        throw new Error("Problem z internetem lub połączeniem z bazą Firebase");
        }
      
    }
    showMessageBox(message,callback){
      let box = this.add.image(0, 0,'textbox');

      const boxWidth = box.displayWidth; // Używaj displayWidth dla przeskalowanego boxa
      const boxHeight = box.displayHeight;
      let text = this.add.text(0, 0, message, {
        fontFamily: 'myFont',
        fontSize: '20px',
        fill: '#ffffff',
        wordWrap: {
          width: boxWidth - 150,
      }
      });
      text.setAlign('center')
      text.setOrigin(0.5,0.5);
      text.setPosition(box.x+10, box.y-50); // Offset for positioning

      // Create a container to group the image and the text
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
    endGame(){
      this.receipt.removeListener('pointerdown');
      this.home.removeListener('pointerdown');
      this.timeStop=true;
      this.sendResultToFirestore().then(result => {
        this.showMessageBox(`Twój wynik to: ${this.game_time_formatted}`,()=>{
          this.scene.restart();
          this.scene.start('MainMenu')
        })
      }).catch((error) => {
        this.showMessageBox("Wynik nie został wysłany.\nSprawdź swoje połączenie i wyślij wynik jeszcze raz.", () => {
          this.endGame();
        })
    });

    }
  }

