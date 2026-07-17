let text = "";
let characters = [];
const paragraph = document.getElementById("paragraph");
const startBtn = document.getElementById("start-btn-id");
const typingInput = document.getElementById("typingInput");
let isTypingStarted = false;
let currentIndex = 0;
const ignoredKeys = [
"Shift",
"Control",
"Alt",
"Meta",
"CapsLock",
"Escape",
"ArrowLeft",
"ArrowRight",
"ArrowUp",
"ArrowDown",
"Tab"
];
const cursor = document.getElementById("cursor");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");

const bestscore = document.getElementById("best-score");

let selectedMode = "passage";
let timer = 60;
let timerInterval;
let testStarted = false;
let testFinished = false;

let characterStatus = [];

const resultBox = document.getElementById("result-box");

const resultWpm = document.getElementById("result-wpm");

const resultAccuracy = document.getElementById("result-accuracy");

const resultCorrect = document.getElementById("result-correct");

const resultWrong = document.getElementById("result-wrong");

const message = document.getElementById("message");

let fetchwpm = localStorage.getItem("bestWPM");
if(fetchwpm){
    bestscore.innerText = fetchwpm;
}
else{
    bestscore.innerText = 0;
}
// loading question
async function loadData(difficulty) {
    try {
    const randompick = Math.floor(Math.random() * 10);
    const response = await fetch("data.json");

    if (!response.ok) {
        throw new Error("Failed to load passages.");
    }

    const passage = await response.json();
    if(difficulty === "easy"){
            text = passage.easy[randompick].text;
    }
    else if (difficulty === "medium"){
            text = passage.medium[randompick].text;
    }
    else if (difficulty === "hard"){
            text = passage.hard[randompick].text;
    }
    renderText();
}
catch (err) {
    paragraph.innerHTML = "Unable to load typing passages.";
    console.error(err);
}
    
}

//converting passage from <p></p> to <span></span>
function renderText() {
    paragraph.innerHTML = "";

    for (const ch of text) {
        const span = document.createElement("span");
        span.innerText = ch;
        paragraph.appendChild(span);
    }

    characters = paragraph.querySelectorAll("span");
}

// start button function
async function starttyping (reload = true){
        isTypingStarted = true;
        resultBox.style.display = "none";
        startBtn.innerText = "Restart";
            paragraph.classList.remove("blur");
    startBtn.onclick = () => starttyping(true);
        if(reload){
            const difficulty = difficultyFunc();
            await loadData(difficulty);
        }
        testFinished = false;
cursor.style.display = "block";
wpmDisplay.innerText = 0;
accuracyDisplay.innerText = "100%";
        characterStatus = new Array(text.length).fill(null);
        selectedMode = modeFunc();
        if(selectedMode === "passage"){

    startPassageTimer();

}
else{

    startCountdown();

}
        currentIndex = 0;
        moveCursor();
    // Focus hidden input
    typingInput.focus();
}

//making input field active to make typeable
document.addEventListener("click", function(){
    // Only keep focusing after typing has started.
    if(isTypingStarted){
        typingInput.focus();
    }
});

//function to run on pressing any keyword
typingInput.addEventListener("keydown", function(event){
        if(testFinished){

    return;

}
        if (currentIndex >= text.length) {
                return
        }
        if(currentIndex == text.length -1){
                cursor.style.display = "none";
        }
        const typedCharacter = event.key;
        //backspace correction
        if(typedCharacter === "Backspace"){
                if(currentIndex > 0){
                        currentIndex--;
                        characters[currentIndex].classList.remove("correct");
                        characters[currentIndex].classList.remove("wrong");
                        characterStatus[currentIndex] = null;
                        updateStats();
                        moveCursor();
                }
                return;
        }
        //ignoring some keys
        if (ignoredKeys.includes(typedCharacter)) {
                return;
        }

        const expectatedCharacter = text[currentIndex];
        // console.log("expected:",expectatedCharacter);
        if(typedCharacter === expectatedCharacter){
                characters[currentIndex].classList.add("correct");
                characterStatus[currentIndex] = true;
                updateStats();
        }
        else{
                characters[currentIndex].classList.add("wrong");
                characterStatus[currentIndex] = false;
                updateStats();
        }
        currentIndex++;
        moveCursor();
        if(currentIndex >= text.length){
        finishTest();
}
});

//move cursor function

function moveCursor() {

    if (currentIndex >= characters.length) return;

    const rect = characters[currentIndex].getBoundingClientRect();

    cursor.style.left = window.scrollX + rect.left + "px";
    cursor.style.top = window.scrollY + rect.top + "px";

}


//selecting level
function difficultyFunc (){       
        const selected = document.querySelector('input[name="difficulty"]:checked');  
        return selected.value;
}
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

difficultyRadios.forEach(radio => {
    radio.addEventListener("change", async () => {

        // Don't change passage while a test is running
        if (isTypingStarted && !testFinished) {
            return;
        }

        const difficulty = difficultyFunc();
        await loadData(difficulty);

        paragraph.classList.add("blur");
    });
});
//selecting modes
function modeFunc(){
    const selected =
        document.querySelector('input[name="mode"]:checked');
    return selected.value;
}
//This timer counts upward.
function startPassageTimer(){

    clearInterval(timerInterval);

    timer = 0;

    document.getElementById("timer").innerText = timer;

    timerInterval = setInterval(()=>{

        timer++;

        document.getElementById("timer").innerText = timer;

    },1000);

}
//this countdown from 60 to 0
function startCountdown(){

    clearInterval(timerInterval);

    timer = 60;

    document.getElementById("timer").innerText = timer;

    timerInterval = setInterval(()=>{

        timer--;

        document.getElementById("timer").innerText = timer;

        if(timer <= 0){
            finishTest();
        }

    },1000);

}
//finish test function
function finishTest(){
    clearInterval(timerInterval);
    testFinished = true;
    typingInput.blur();

    const accuracy = calculateAccuracy();

const wpm = calculateWPM();

const stats = getStats();
//new logic
const best = localStorage.getItem("bestWPM");
if (best === null) {

    localStorage.setItem("bestWPM", wpm);
    message.innerText = "🎯 Baseline Established!";
    bestscore.innerText = wpm;

}
else {

    if (wpm > Number(best)) {

        localStorage.setItem("bestWPM", wpm);
        message.innerText = "🏆 High Score Smashed!";
        bestscore.innerText = wpm;
    }
    else {

        message.innerText = "Personal Best : " + best + " WPM";

    }

}


resultBox.style.display = "block";

resultWpm.innerText = wpm;

resultAccuracy.innerText = accuracy + "%";

resultCorrect.innerText = stats.correct;

resultWrong.innerText = stats.wrong;
}
//finding accuracy 
function calculateAccuracy() {

    let stats = getStats();
    let correct = stats.correct;
    let wrong = stats.wrong;

    const totalTyped = correct + wrong;
    if (totalTyped === 0) {
        return 100;
    }
    return ((correct / totalTyped) * 100).toFixed(1);
}
//finding wpm
function calculateWPM() {

    let stats = getStats();
    let correct = stats.correct;
    let elapsedMinutes;

    if (selectedMode === "timer") {

        elapsedMinutes = (60 - timer) / 60;

    }

    else {

        elapsedMinutes = timer / 60;

    }

    if (elapsedMinutes <= 0) {
        return 0;
    }

    return Math.round((correct / 5) / elapsedMinutes);

}
//update stats function
function updateStats(){

    const accuracy = calculateAccuracy();

    const wpm = calculateWPM();

    accuracyDisplay.innerText = accuracy + "%";

    wpmDisplay.innerText = wpm;

}
// getstat function
function getStats(){

    let correct = 0;
    let wrong = 0;

    for(const status of characterStatus){

        if(status === true){

            correct++;

        }

        else if(status === false){

            wrong++;

        }

    }

    return{

        correct,

        wrong

    };

}
//getting passage on the first attempts
window.addEventListener("load", async () => {

    const difficulty = difficultyFunc();

    await loadData(difficulty);

    paragraph.classList.add("blur");

});
//starting tutor even after clicking paragraph too
paragraph.addEventListener("click", () => {

    if(!isTypingStarted){

        paragraph.classList.remove("blur");

        starttyping(false);

    }

});