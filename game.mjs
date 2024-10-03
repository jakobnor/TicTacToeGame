import ANSI from "./ansi.mjs";
import { print, askQuestion, clearScreen } from "./io.mjs";
import { debug, DEBUG_LEVELS } from "./debug.mjs";
import DICTIONARY from "./language.mjs";
import showSplashScreen from "./splash.mjs";

const GAME_BOARD_SIZE = 3;
const PLAYER_1 = 1;
const PLAYER_2 = -1;

const MENU_CHOICES = {
    PLAY_PVP: 1,
    PLAY_PVC: 2,
    SETTINGS: 3,
    EXIT: 4,
};

const NO_CHOICE = -1;

let language = DICTIONARY.en;
let gameboard;
let currentPlayer;

clearScreen();
showSplashScreen();
setTimeout(start, 2500);

async function start() {
    do {
        let chosenAction = NO_CHOICE;
        chosenAction = await showMenu();

        if (chosenAction == MENU_CHOICES.PLAY_PVP) {
            await runGame("PvP");
        } else if (chosenAction == MENU_CHOICES.PLAY_PVC) {
            await runGame("PvC");
        } else if (chosenAction == MENU_CHOICES.SETTINGS) {
            await showSettings();
        } else if (chosenAction == MENU_CHOICES.EXIT) {
            clearScreen();
            process.exit();
        }
    } while (true);
}

async function runGame(type) {
    let isPlaying = true;

    while (isPlaying) {
        initializeGame();
        if (type === "PvP") {
            isPlaying = await playGamePvP();
        } else {
            isPlaying = await playGamePvC();
        }
    }
}

async function showMenu() {
    let choice = NO_CHOICE;
    let validChoice = false;

    while (!validChoice) {
        clearScreen();
        print(language.MENU_TITLE);
        print(`${MENU_CHOICES.PLAY_PVP}. ${language.PLAY_PVP}`);
        print(`${MENU_CHOICES.PLAY_PVC}. ${language.PLAY_PVC}`);
        print(`${MENU_CHOICES.SETTINGS}. ${language.SETTINGS}`);
        print(`${MENU_CHOICES.EXIT}. ${language.EXIT}`);

        choice = await askQuestion("");

        if (Object.values(MENU_CHOICES).includes(Number(choice))) {
            validChoice = true;
        }
    }

    return choice;
}

async function showSettings() {
    clearScreen();
    print(language.CHOOSE_LANGUAGE);
    print("1. English");
    print("2. Norwegian");

    const choice = await askQuestion("Enter your choice: ");
    if (choice === "1") {
        language = DICTIONARY.en;
    } else if (choice === "2") {
        language = DICTIONARY.no;
    }
    print(language.LANGUAGE_CHANGED);
    await askQuestion("Press Enter to return to the menu...");
}

async function playGamePvP() {
    let outcome;
    do {
        clearScreen();
        showGameBoardWithCurrentState();
        showHUD();
        let move = await getGameMoveFromCurrentPlayer();
        updateGameBoardState(move);
        outcome = evaluateGameState();
        if (outcome === 0) {
            changeCurrentPlayer();
        }
    } while (outcome === 0);

    showGameSummary(outcome);
    return await askWantToPlayAgain();
}

async function playGamePvC() {
    let outcome;
    do {
        clearScreen();
        showGameBoardWithCurrentState();
        showHUD();
        let move;
        if (currentPlayer === PLAYER_1) {
            move = await getGameMoveFromCurrentPlayer();
        } else {
            move = getComputerMove();
        }
        updateGameBoardState(move);
        outcome = evaluateGameState();
        if (outcome === 0) {
            changeCurrentPlayer();
        }
    } while (outcome === 0);

    showGameSummary(outcome);
    return await askWantToPlayAgain();
}

function getComputerMove() {
    let position;
    do {
        position = [
            Math.floor(Math.random() * GAME_BOARD_SIZE),
            Math.floor(Math.random() * GAME_BOARD_SIZE),
        ];
    } while (!isValidPositionOnBoard(position));

    return position;
}

async function askWantToPlayAgain() {
    let answer = await askQuestion(language.PLAY_AGAIN_QUESTION);
    return answer.toLowerCase().startsWith(language.CONFIRM);
}

function showGameSummary(outcome) {
    clearScreen();
    let winningPlayer = (outcome > 0) ? 1 : 2;
    print(language.WINNER + winningPlayer + "\n");
    showGameBoardWithCurrentState();
    print(language.GAME_OVER);
}

function changeCurrentPlayer() {
    currentPlayer *= -1;
}

function evaluateGameState() {
    let sum = 0;
    let state = 0;

    for (let row = 0; row < GAME_BOARD_SIZE; row++) {
        for (let col = 0; col < GAME_BOARD_SIZE; col++) {
            sum += gameboard[row][col];
        }
        if (Math.abs(sum) === 3) {
            state = sum;
        }
        sum = 0;
    }

    for (let col = 0; col < GAME_BOARD_SIZE; col++) {
        for (let row = 0; row < GAME_BOARD_SIZE; row++) {
            sum += gameboard[row][col];
        }
        if (Math.abs(sum) === 3) {
            state = sum;
        }
        sum = 0;
    }

    sum = 0;
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        sum += gameboard[i][i];
    }
    if (Math.abs(sum) === 3) {
        state = sum;
    }

    sum = 0;
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        sum += gameboard[i][GAME_BOARD_SIZE - 1 - i];
    }
    if (Math.abs(sum) === 3) {
        state = sum;
    }

    if (!gameboard.flat().includes(0) && state === 0) {
        return 2; // Draw
    }

    return state;
}

function updateGameBoardState(move) {
    const ROW_ID = 0;
    const COLUMN_ID = 1;
    gameboard[move[ROW_ID]][move[COLUMN_ID]] = currentPlayer;
}

async function getGameMoveFromCurrentPlayer() {
    let position = null;
    do {
        let rawInput = await askQuestion(language.PLACE_MARK);
        position = rawInput.split(" ").map(Number).map(x => x - 1); // Adjusting to 0-based index
    } while (!isValidPositionOnBoard(position));

    return position;
}

function isValidPositionOnBoard(position) {
    if (position.length < 2) {
        return false;
    }

    let isValidInput = true;
    if (
        position[0] >= GAME_BOARD_SIZE ||
        position[1] >= GAME_BOARD_SIZE ||
        position[0] < 0 ||
        position[1] < 0 ||
        gameboard[position[0]][position[1]] !== 0
    ) {
        isValidInput = false;
    }

    return isValidInput;
}

function showHUD() {
    let playerSymbol = currentPlayer === PLAYER_1 ? ANSI.GREEN + "X" + ANSI.RESET : ANSI.RED + "O" + ANSI.RESET;
    print(`${language.CURRENT_PLAYER} ${playerSymbol}\n`);
}

function initializeGame() {
    gameboard = [];
    for (let i = 0; i < GAME_BOARD_SIZE; i++) {
        gameboard[i] = Array(GAME_BOARD_SIZE).fill(0);
    }
    currentPlayer = PLAYER_1;
}

function showGameBoardWithCurrentState() {
    console.log(language.CURRENT_GAME_BOARD);
    gameboard.forEach((row, index) => {
        const displayRow = row.map(cell => {
            if (cell === PLAYER_1) return `[${ANSI.GREEN}X${ANSI.RESET}]`;
            else if (cell === PLAYER_2) return `[${ANSI.RED}O${ANSI.RESET}]`;
            else return `[ ]`;
        });
        console.log(displayRow.join(" | "));
        if (index < GAME_BOARD_SIZE - 1) console.log("---+---+---");
    });
    console.log();
}

