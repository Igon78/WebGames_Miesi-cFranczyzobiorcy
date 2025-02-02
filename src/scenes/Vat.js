import { Scene } from 'phaser';
import { collection, addDoc, setDoc, doc, getDoc } from "firebase/firestore";

export default class Vat extends Scene {
    constructor() {
      super('Vat');
    }
    preload()
      {
        this.load.image('textbox', 'assets/gra_opis.png');
        this.load.image('layout', 'assets/main_menu.jpg');

        this.load.spritesheet('vat5', 'assets/VAT_5_Artboard.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('vat8', 'assets/VAT_8_Artboard.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('vat23', 'assets/VAT_23_Artboard.png', { frameWidth: 200, frameHeight: 200 });

        this.load.font('myFont', 'assets/fonts/IntroBlackCapsRegular.otf');
        this.load.image('home', 'assets/home.png');
        this.load.image('polka_products', 'assets/Quiz_odpowiedz.png')
        this.load.spritesheet('polka', 'assets/polka_vat3.png', { frameWidth: 600, frameHeight: 189 });
    }
    create() {
      //zmienne
      this.startTime = null;
      this.timeStop = true;
      this.timerText = null;
      this.game_time_formatted = null;
      this.elapsedTime = null;
      this.matchedProducts = 0;
      this.matchedText = null;

      //tło
      let image = this.add.image(300, 400, 'layout');
      image.setDisplaySize(600, 800);

      //polka produkty
      let image_products = this.add.image(300, 700, 'polka_products');
      image_products.setDisplaySize(500, 150);

      //powrót menu
      let home = this.add.image(25, 35, 'home');
      home.setScale(0.3);
      home.setInteractive();
      home.on('pointerdown', () => {
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

      //Znacznik dopasowań
      this.matchedText = this.add
        .text(170, 30, 'DOPASOWANO: 0/5', {
          fontFamily: 'myFont',
          align: 'left',
          fontSize: '22px',
          stroke: '#000000', strokeThickness: 8,
          wordWrap: {
            width: this.scale.width - 50,
          },
      }).setOrigin(0.5);

      //lista produktów
      let products_vat = [{name: "vat5", frames:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
                          {name: "vat8", frames:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]},
                          {name: "vat23", frames:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}];

      //etykiety VAT
      this.vats = this.physics.add.group({
        key:'polka',
        frame: 0,
        repeat: 2,
        setXY: { x:300 , y: 180, stepY:150}
      });
      for(let i=0; i<3; i++){
        let child = this.vats.children.entries[i];
        child.name = products_vat[i].name;
        child.setOrigin(0.5,0.5);
        child.slots = [200, 270, 370, 470];
        //child.setScale(1.25)
        child.customHitArea = new Phaser.Geom.Rectangle(
          child.x-265, // x offset (e.g., 50 pixels smaller in width)
          child.y-45, // y offset (e.g., 50 pixels smaller in height)
          530,          // width of the interactive area
          80           // height of the interactive area
        );
        //const graphics = this.add.graphics();
        //graphics.lineStyle(2, 0xff0000); // Red outline
        //graphics.strokeRect(child.customHitArea.x, child.customHitArea.y, child.customHitArea.width, child.customHitArea.height);
    
        child.text = this.add.text(95, child.y-10, `${products_vat[i].name.slice(3)}%`,{
          align: 'center',
          fontFamily: 'myFont',
          fontSize: '20px',
          fill: '#46f740'
        })
        child.text.setOrigin(0.5,0.5);
      }
  
      //produkty
      var products = this.physics.add.group({ //grupa produktów
        key:'vat8',
        repeat: 4,
        setXY: { x:120 , y: 700, stepX:90}
      });

      products.children.iterate((child) => {
        let sheet_index;
        do {
          sheet_index = Phaser.Math.Between(0, 2)

        } while (products_vat[sheet_index].frames.length<8);
        let sprite_index = Phaser.Math.Between(0, products_vat[sheet_index].frames.length-1)

        child.setTexture(products_vat[sheet_index].name, products_vat[sheet_index].frames[sprite_index]);
        //child.setDisplaySize(100, 100);
        child.vat = products_vat[sheet_index].name;
        products_vat[sheet_index].frames.splice(sprite_index,1);

        const originalWidth = child.width;
        const originalHeight = child.height;
        const maxDimension = 100;
        const scale = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);

        child.setScale(scale);

        child.setDisplayOrigin(originalWidth / 2, originalHeight / 2);

        this.makeDraggable(child);
        child.xHome = child.x;
        child.yHome = child.y;
      });
      products.setVisible(false);
      
      //rozpoczęcie gry
      this.showMessageBox("Twoim zadaniem jest jak najszybsze dopasowanie 5 produktów do ich stawki VAT \n Jedna pomyłka powoduje dodanie 5 sekund do czasu gry.\n\nPowodzenia!",() => {
        
        this.timeStop = false;
        this.startTime = this.time.now;
        products.setVisible(true);
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
    async sendResultToFirestore() {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 5000) // 5 sekund
      );
      const db = this.game.db;
      const docRef = doc(db, "users", this.game.player);

      try{
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);
        const data = docSnap.data();
        if('wynik_vat' in data){
          if(this.elapsedTime < data.wynik_vat){
            await Promise.race([setDoc(doc(db, "users", this.game.player), {
              wynik_vat: this.elapsedTime
              }, { merge: true }), timeoutPromise]);
          }
          else return;
        }
        else{
          await Promise.race([setDoc(doc(db, "users", this.game.player), {
            wynik_vat: this.elapsedTime
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
    makeDraggable(gameObject){
      gameObject.setInteractive();
      this.input.setDraggable(gameObject, true);

      gameObject.on('dragstart', (pointer) =>{
        gameObject.setData('dragging', true);
      });

      gameObject.on('drag', (pointer, dragX, dragY) =>{
        gameObject.x = dragX;
        gameObject.y = dragY;
      });

      gameObject.on('dragend', () => {
        gameObject.setData('dragging', false);
        stopDrag();
    });
      
      const stopDrag = async () =>{
          
        let foundMatched = false;
        this.vats.children.iterate(async (child) => {

          const bounds = child.getBounds();
          const isInArea = Phaser.Geom.Intersects.RectangleToRectangle(gameObject.getBounds(), child.customHitArea);
          if(isInArea){
            if(child.name == gameObject.vat){

              let index = Phaser.Math.Between(0, child.slots.length-1);
              gameObject.x = child.slots[index];
              child.slots.splice(index,1);
              gameObject.y = child.y-5;
              gameObject.setDisplaySize(50,50)
              destroy();
              foundMatched = true;
              child.text.setColor('#1818c7');
              this.time.delayedCall(500, () => {
                child.text.setColor('#46f740');
              });
              this.matchedCallback();

              return;
            }
            else{
              this.startTime -= 5000;
              child.setFrame(1);
              child.text.setColor('#d42424');
              this.addTime.setVisible(true);
              this.time.delayedCall(500, () => {
                child.text.setColor('#46f740');
                child.setFrame(0);
                this.addTime.setVisible(false);
              });
              resetPosition();
              foundMatched = true;
            }
          }

        });

        if(!foundMatched) resetPosition();
      }
      function destroy(){
        gameObject.off('dragstart');
        gameObject.off('drag');
        gameObject.off('dragend');
      }
      function resetPosition(){
          gameObject.x = gameObject.xHome;
          gameObject.y = gameObject.yHome;
      }
      gameObject.on(Phaser.GameObjects.Events.DESTROY, destroy);
    }
    matchedCallback(){
      this.matchedProducts++;
      this.matchedText.setText(`Dopasowano ${this.matchedProducts}/5`)

      if(this.matchedProducts===5){
        this.endGame();
      }
    }
    //koniec gry
    async endGame(){
      this.timeStop=true;
      await this.delay(500);
      this.sendResultToFirestore().then(result => {
        this.showMessageBox(`Gratulacje! Udało Ci się poprawnie przyporządkować wszystkie produkty!\nTwój wynik czasowy to: ${this.game_time_formatted}`,()=>{
          this.scene.restart();
          this.scene.start('MainMenu');
          });
        }).catch((error) => {
          this.showMessageBox("Wynik nie został wysłany.\nSprawdź swoje połączenie i wyślij wynik jeszcze raz.", () => {
            this.endGame();
          })
      });
    }
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

