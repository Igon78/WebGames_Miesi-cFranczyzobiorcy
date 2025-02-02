import { Scene } from 'phaser';
import { collection, addDoc, doc, getDocs, setDoc, getDoc } from "firebase/firestore";

export default class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }
    preload(){
        this.load.image('background', 'assets/main_menu.jpg');
        this.load.font('myFont', 'assets/fonts/IntroBlackCapsRegular.otf');
        this.load.image('textbox', 'assets/gra_opis.png');

    }
    create ()
    {
        //zmienne
        this.attempts_vat =0;
        this.attempts_quiz = 0;
        this.attempts_receipt =0;
        //tło
        let image = this.add.image(300, 400, 'background');
        image.setDisplaySize(600, 800);

        //logowanie
        const savedEmail = this.getCookie("email");

        if (savedEmail !== "") {
            this.game.player = savedEmail;
            this.sendDataToFirestore().then(() => {
                this.load_menu();
            }).catch((error) => {
                this.showMessageBox("Utracono połączenie.\nSprawdź swoje połączenie i połącz się jeszcze raz.", () => {
                    this.scene.restart();
                });
            });
            
        } else{
            this.login();
        }
    }
    //ładowanie menu
    load_menu(){

        //vat button
        const vatButton = this.add.text(460 , 100, `VAT`, {fontFamily: 'myFont', fontSize: 36, color: '#ffffff', //#ffffff
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        vatButton.setInteractive();
        vatButton.on('pointerdown', () => {
            this.updateAttempts('vat').then(() => {
                this.scene.start('Vat')
            }).catch((error) => {
                this.showMessageBox("Utracono połączenie.\nSprawdź swoje połączenie i połącz się jeszcze raz.", () => {
                    this.scene.restart();
                });
            });
            
        });
        vatButton.on('pointerover', () => vatButton.setColor('#46f740'));
        vatButton.on('pointerout', () => vatButton.setColor('#ffffff'));

        //quiz button
        const quizButton = this.add.text(450, 470, `QUIZ`, {fontFamily: 'myFont', fontSize: 36, color: '#ffffff', //#B0B0B0
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        quizButton.setInteractive();
        quizButton.on('pointerdown', () => {
            this.updateAttempts('quiz').then(() => {
                this.scene.start('Quiz')
            }).catch((error) => {
                this.showMessageBox("Utracono połączenie.\nSprawdź swoje połączenie i połącz się jeszcze raz.", () => {
                    this.scene.restart();
                });
            });
        });
        quizButton.on('pointerover', () => quizButton.setColor('#46f740'));
        quizButton.on('pointerout', () => quizButton.setColor('#ffffff'));

        //paragon button
        const paragonButton = this.add.text(195, 640, `PARAGON`, {fontFamily: 'myFont', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        paragonButton.setInteractive();
        paragonButton.on('pointerdown', () => {
            this.updateAttempts('receipt').then(() => {
                this.scene.start('Receipt')
            }).catch((error) => {
                this.showMessageBox("Utracono połączenie.\nSprawdź swoje połączenie i połącz się jeszcze raz.", () => {
                    this.scene.restart();
                });
            });
        });
        paragonButton.on('pointerover', () => paragonButton.setColor('#46f740'));
        paragonButton.on('pointerout', () => paragonButton.setColor('#ffffff'));

        //leaderboard button
        const leaderboardButton = this.add.text(20, 125, 'Wyniki', {fontFamily: 'myFont', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        leaderboardButton.setInteractive();
        leaderboardButton.on('pointerdown', () => this.scene.start('Leaderboard'));
        leaderboardButton.on('pointerover', () => leaderboardButton.setColor('#46f740'));
        leaderboardButton.on('pointerout', () => leaderboardButton.setColor('#ffffff'));

        //logout button
        const logoutButton = this.add.text(40, 510, 'Wyloguj', {fontFamily: 'myFont', fontSize: 14, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        logoutButton.setInteractive();
        logoutButton.on('pointerdown', () => {
            document.cookie = "email" + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
            this.scene.restart();
        })
        logoutButton.on('pointerover', () => logoutButton.setColor('#46f740'));
        logoutButton.on('pointerout', () => logoutButton.setColor('#ffffff'));

        //aktywny gracz
        const playerText = this.add.text(0 , 0,`Zalogowano jako: ${this.game.player}` , {fontFamily: 'myFont', fontSize: 15, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
    
    }
    //ekran logowania
    login(){
        let box = this.add.image(0, 0,'textbox')
        box.setScale(1);
  
        const boxWidth = box.displayWidth; // Używaj displayWidth dla przeskalowanego boxa
        const boxHeight = box.displayHeight;

        let label = this.add.text(450 , 300, 'Zaloguj do gry', {fontFamily: 'myFont', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        label.setOrigin(0.5,0.5);
        label.setPosition(box.x, box.y-100);

        let emailField= this.add.dom(400, 300).createFromHTML(`
            <textarea id="emailTextBox" placeholder="nazwisko.imie@zabka.pl" style="font-family: 'myFont'; width: 300px; height: 20px; padding: 10px; border-radius: 10px; font-size: 16px; background-color: #ffffff; border: 2px solid #000; color: #000; resize: none; white-space: nowrap;"></textarea>
        `);
        emailField.setOrigin(0.5,0.5);
        emailField.setPosition(box.x, box.y-50);
        emailField.setInteractive();

        let button= this.add.dom(500, 300).createFromHTML(`
            <button id="getTextButton" style="font-family: 'myFont'; font-size: 18px; padding: 10px 20px; background-color: green; color: white; border: none; border-radius: 5px;">Zaloguj</button>
        `);
        button.setOrigin(0.5,0.5);
        button.setPosition(box.x, box.y+50);
        button.setInteractive();

        let textinfo = this.add.text(450 , 300, '', {fontFamily: 'myFont', fontSize: 12, color: '#BF0000',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'});
        textinfo.setOrigin(0.5,0.5);
        textinfo.setPosition(box.x, box.y);
  
        // Kontener textbox'a
        let textbox = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2, [box, emailField, button, textinfo, label]);
        textbox.setSize(boxWidth, boxHeight);

        // Usunięcie białych znaków z tekstu
        let textarea = document.getElementById('emailTextBox');
        textarea.addEventListener('input', function() {
            textarea.value = textarea.value.replace(/\s+/g, ''); 
        });

        const handleLogin = () => {

            function check_mail(email){
                let re = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)?\.[a-zA-Z0-9]+@zabka\.pl$/;
                if(re.test(email) && email!='nazwisko.imie@zabka.pl') return true;
                else return false;
            }

            let enteredText = document.getElementById('emailTextBox').value.toLowerCase();
            if(check_mail(enteredText)){

                this.setCookie("email", enteredText, 1);
                this.game.player = enteredText;
                this.sendDataToFirestore().then(() => {
                    this.load_menu();
                }).catch((error) => {
                    this.showMessageBox("Utracono połączenie.\nSprawdź swoje połączenie i połącz się jeszcze raz.", () => {
                        this.scene.restart();
                    });
                });
                textbox.destroy();
            }
            else{
                textinfo.setText("Logowanie nieudane.\nPodaj prawidłowego maila z domeny Żabka.")
            }
        }
        //Login po wciśnięciu przycisku
        button.on('pointerdown', () => {
            handleLogin();
        });
        
        // Login po wciśnięciu Enter
        textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleLogin();
            }
        });

    }
    //wysłanie danych logowania na serwer
    async sendDataToFirestore() {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 3000) // 5 sekund
        );
        const db = this.game.db;
    
        const docRef = doc(db, "users", this.game.player);

        try{
          const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);
          if(!docSnap.exists()){
            await Promise.race([setDoc(doc(db, "users", this.game.player),{
                attempts_vat: 0,
                attempts_quiz: 0,
                attempts_receipt: 0
            }), timeoutPromise]);
          }
          else{
            if(docSnap.data().attempts_vat<=3) {
                this.attempts_vat = docSnap.data().attempts_vat;
            }
            else {
                this.attempts_vat = 3;
            }

            if(docSnap.data().attempts_quiz<=3) {
                this.attempts_quiz = docSnap.data().attempts_quiz;
            }
            else this.attempts_quiz = 3;

            if(docSnap.data().attempts_receipt<=3){
                this.attempts_receipt = docSnap.data().attempts_receipt;
            } 
            else this.attempts_receipt = 3;
            
            
          }
          
        } catch (e) {
            throw new Error("Problem z internetem lub połączeniem z bazą Firebase");
          }
        
    }
    //aktualizacja liczby podejść
    async updateAttempts(game) {
        const db = this.game.db;
        const docRef = doc(db, "users", this.game.player);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: brak odpowiedzi z Firestore")), 3000)
        );

        try{
          const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);

        await Promise.race([setDoc(doc(db, "users", this.game.player),{
            [`attempts_${game}`]: docSnap.data()[`attempts_${game}`] + 1,
          }, { merge: true }), timeoutPromise]);
          
        } catch (e) {
            throw new Error("Problem z internetem lub połączeniem z bazą Firebase");
          }
        
    }
    //Funkcja do ustawiania cookies
    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000)); // exdays to liczba dni
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    //Funkcja do pobierania cookies
    getCookie(cname) {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    //message box
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
