import Vat from './scenes/Vat.js';
import MainMenu from './scenes/MainMenu.js';
import Quiz from './scenes/Quiz.js';
import Receipt from './scenes/Receipt.js';
import { FontPlugin } from 'phaser-font-plugin';
//firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import Leaderboard from './scenes/Leaderboard.js';

const firebaseConfig = {

  apiKey: "AIzaSyBXhyJQMlKOsVs9Y5BD9Eg35oXUk133-qo",

  authDomain: "miesiacfranczyzobiorcy.firebaseapp.com",

  projectId: "miesiacfranczyzobiorcy",

  storageBucket: "miesiacfranczyzobiorcy.appspot.com",

  messagingSenderId: "523982094103",

  appId: "1:523982094103:web:4ac0fabe791544c9420152",

  measurementId: "G-51CZ4PPC62"

};

const firebase= initializeApp(firebaseConfig);

const analytics = getAnalytics(firebase);

var db = getFirestore(firebase);

const gameConfig = {
  type: Phaser.AUTO,

  plugins: {
    global: [
      {
        key: 'FontPlugin',
        plugin: FontPlugin,
        start: true
      },
    ]
  },
  render: {
    antialias: true,
    pixelArt: false,
    antialiasGL: true,
    roundPixels: false
  },
  dom: {
    createContainer: true // Ważne - pozwala na tworzenie elementów DOM
  },
  scale: {
    parent: 'game-container',
    width: 600,
    height: 800,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT,
  },
  backgroundColor: '#5c5b5b',
  physics: {
    default: 'arcade',
    arcade: {
        gravity: {},
        debug: false
    }
},
  scene: [MainMenu, Vat, Quiz, Receipt, Leaderboard],

};

const game =  new Phaser.Game(gameConfig);

game.firebase = firebase;
game.db = db;
game.player = null;
