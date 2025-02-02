import { Scene } from 'phaser';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, or, and  } from "firebase/firestore";

export default class Leaderboard extends Scene
{
    constructor ()
    {
        super('Leaderboard');
    }
    preload(){
        this.load.image('background', 'assets/main_menu.jpg');
        this.load.font('myFont', 'assets/fonts/IntroBlackCapsRegular.otf');
        this.load.image('answer', 'assets/Quiz_odpowiedz.png');
        this.load.image('question', 'assets/Quiz_pytanie.png');
        this.load.image('home', 'assets/home.png');
    }
    create ()
    {
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
          });

        //tytuł
        const text = this.add.text(300 , 30, 'Tablica Wyników', {fontFamily: 'myFont', fontSize: 36, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
            text.setOrigin(0.5,0.5);

        //wyniki
        this.resultsBoxes = this.physics.add.staticGroup({
            key:'answer',
            repeat: 4,
            setXY: { x:300 , y: 250, stepY:100}
          });

        this.resultsBoxes.children.iterate((child) => {
            child.setScale(0.5);
            child.resultText = this.add.text(child.x, child.y, "", {
                fontFamily: 'myFont',
                fontSize: '20px',
                fill: '#46f740',
                align: 'center',
                wordWrap: {
                width: 280,
                }
            });
            child.setOrigin(0.5, 0.5);
            child.resultText.setOrigin(0.5, 0.5);
        })

      //wynik gracza
      this.playerBox = this.add.image(300, 750,'answer');
      this.playerBox.setScale(0.5);

      this.playerBox.resultPlayer = this.add.text(300, 750, "", {
        align: 'center',
        fontFamily: 'myFont',
        fontSize: '20px',
        fill: '#e3b920',
        wordWrap: {
          width: 280,
      }
      });
      this.playerBox.resultPlayer.setOrigin(0.5, 0.5)
      
      //etykiety przycisków gier
      this.menu = this.physics.add.staticGroup({
        key:'question',
        repeat: 3,
        setXY: { x:75 , y: 150, stepX:150}
      });

      this.names = ['ranking ogólny', 'vat', 'paragon', 'quiz']
      for(var i=0; i<this.names.length;i++){
        let child = this.menu.children.entries[i];
        child.setScale(0.25);
        child.text = this.add.text(child.x, child.y, this.names[i], {
            fontFamily: 'myFont',
            fontSize: '20px',
            fill: '#008000',
            align: 'center',
            wordWrap: {
            width: 100,
            }
        });
        child.setOrigin(0.5, 0.5);
        child.text.setOrigin(0.5, 0.5);
        child.setInteractive();
        child.on('pointerdown', () => {
            this.menu.getChildren().forEach(function(child) {
                child.text.setColor('#008000');
            });

            this.resultsBoxes.children.iterate((child) => {
                child.resultText.setText("")
            });
            child.text.setColor('#46f740');
            this.getData(`wynik_${child.text.text}`);
          });
      }

      //pobranie danych
        this.getData('wynik_ranking ogólny');
    }
    //pobranie wyników z bazy
    async getData(typ){
        //funkcja do formatowania czasu
        function format_time(miliseconds){
            const minutes = Math.floor(miliseconds / 60000); // 60,000 ms in a minute
            const seconds = Math.floor((miliseconds % 60000) / 1000); // 1,000 ms in a second
            const milliseconds = Math.floor((miliseconds % 1000)); // Remaining milliseconds
  
            // Format time to ensure two digits for seconds and minutes
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');
            const formattedMilliseconds = String(milliseconds).padStart(1, '0'); // Show 3 digits for milliseconds
  
            // Update the text display with the formatted time
            return `${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
        }
        const db = this.game.db;
        //funkcja do formatowania nazwy
        function format_name(email){
            let regex = '(?<=\.)[a-zA-Z0-9]+(?=@zabka\.pl)';
            let match = email.match(regex);
             return match[0].toUpperCase();
        }
 
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 5000) // 5 sekund
        );
        try{
        //pobranie danych gracza
        const playerRef = doc(db, "users", this.game.player);

        const docSnap = await Promise.race([getDoc(playerRef), timeoutPromise]);
        const data = docSnap.data();

        //pobranie numeru gracza
        const docRef = collection(db, "users");
        
        //pobranie danych o quizie
        if(typ==='wynik_quiz'){
            if(typ in data){
                const q_position = query(docRef, or(where('guessed_quiz', '>', data.guessed_quiz), and(where('guessed_quiz', '==', data.guessed_quiz), where(typ, '<', data[typ]))));
                const postion_snapshot = await Promise.race([getDocs(q_position), timeoutPromise]);
                const player_postion = postion_snapshot.docs.length+1;

                this.playerBox.resultPlayer.setText(`${player_postion}. Twój Wynik\nRundy: ${data.guessed_quiz} Czas: ${format_time(data[typ])}`);
        
            }
            else this.playerBox.resultPlayer.setText("");
            
            //pobranie top 5 wyników
            const q = query(docRef, orderBy('guessed_quiz', 'desc'), orderBy(typ), limit(5));
            const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);

            for(let i=0;i<querySnapshot.docs.length; i++){

                let snapData = querySnapshot.docs[i].data();
                let result_data = `${i+1}. ${format_name(querySnapshot.docs[i].id)}\nRundy: ${snapData.guessed_quiz}  Czas: ${format_time(snapData[typ])}`;
                this.resultsBoxes.children.entries[i]
                    .resultText.setText(result_data);
            }
        }
        //pobranie rankingu ogólnego
        else if(typ==='wynik_ranking ogólny'){

            //pobranie wyników
            const q = query(docRef);
            const q_quiz = query(docRef, orderBy('guessed_quiz', 'desc'), orderBy('wynik_quiz', 'asc'));
            const q_vat = query(docRef, orderBy('wynik_vat', 'asc'));
            const q_receipt = query(docRef, orderBy('wynik_paragon','asc'));
            const playersSnapshot = await Promise.race([getDocs(q), timeoutPromise]);
            const quizSnapshot = await Promise.race([getDocs(q_quiz), timeoutPromise]);
            const vatSnapshot = await Promise.race([getDocs(q_vat), timeoutPromise]);
            const receiptSnapshot = await Promise.race([getDocs(q_receipt), timeoutPromise]);
            
            let scores_dict = {};
            for(let i=0; i < playersSnapshot.docs.length; i++){
                scores_dict[playersSnapshot.docs[i].id] = {
                    position_quiz: playersSnapshot.docs.length,
                    position_vat: playersSnapshot.docs.length,
                    position_receipt: playersSnapshot.docs.length};
            }
            for(let i=0; i < quizSnapshot.docs.length; i++){
                scores_dict[quizSnapshot.docs[i].id].position_quiz = i+1;
            }
            for(let i=0; i < vatSnapshot.docs.length; i++){
                scores_dict[vatSnapshot.docs[i].id].position_vat = i+1;
            }
            for(let i=0; i < receiptSnapshot.docs.length; i++){
                scores_dict[receiptSnapshot.docs[i].id].position_receipt = i+1;
            }
            for(let i=0; i < Object.keys(scores_dict).length; i++){
                let result_id = Object.keys(scores_dict)[i];
                
                scores_dict[result_id].average_position =
                    (scores_dict[result_id].position_receipt +
                    scores_dict[result_id].position_vat +
                    scores_dict[result_id].position_quiz
                     )/3
            }
            
            //sortowanie
            let playersArray = Object.entries(scores_dict);
            playersArray = playersArray.sort((a, b) => {
                a=a[1];
                b=b[1];
                // sortowanie wg średniej pozycji
                if (a.average_position !== b.average_position) {
                  return a.average_position - b.average_position;
                }
              
                // Jeśli średnia jest taka sama to porównujemy wyniki poszczególne
                const positionsA = [a.position_quiz, a.position_receipt, a.position_vat];
                const positionsB = [b.position_quiz, b.position_receipt, b.position_vat];
              
                let aPoints = 0;
                let bPoints = 0;
                for (let i = 0; i < positionsA.length; i++) {
                  if (positionsA[i] > positionsB[i]) {
                    aPoints++;
                  }
                  if ((positionsA[i] < positionsB[i])){
                    bPoints++;
                  }
                }
                return aPoints - bPoints;
            });

            let len = 5;
            if(playersArray.length<5){
                len = playersArray.length
            }
            for(let i=0; i<len;i++){
                let result_data = `${i+1}. ${format_name(playersArray[i][0])}`;
                this.resultsBoxes.children.entries[i]
                    .resultText.setText(result_data);
            }
            //Pozycja gracza
            const playerIndex = 1+playersArray.findIndex(innerArray => innerArray[0] === this.game.player);
            this.playerBox.resultPlayer.setText(`${playerIndex}. Twoja Pozycja`);
        }
        //pobranie rankingu paragon lub vat
        else{
            if(typ in data){
                const q_position = query(docRef, orderBy(typ), where(typ,'<',data[typ]));
                const postion_snapshot = await Promise.race([getDocs(q_position), timeoutPromise]);
                const player_postion = postion_snapshot.docs.length+1;

                this.playerBox.resultPlayer.setText(`${player_postion}. Twój Wynik\nCzas: ${format_time(data[typ])}`);
            }
            else this.playerBox.resultPlayer.setText("");
            
            //pobranie top 5 wyników
            const q = query(docRef, orderBy(typ), limit(5));
            const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);

            for(let i=0; i<querySnapshot.docs.length; i++){

                let snapData = querySnapshot.docs[i].data();
                let result_data = `${i+1}. ${format_name(querySnapshot.docs[i].id)}\nCzas: ${format_time(snapData[typ])}`;
                this.resultsBoxes.children.entries[i]
                    .resultText.setText(result_data);
            }
        }
        }
        catch(e){
            console.log(e);
            this.showMessageBox("Utracono połączenie z serwerem.\nSprawdź swoje połączenie i spróbuj jeszcze raz.",() => {
                this.getData(typ);
              });
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
}
