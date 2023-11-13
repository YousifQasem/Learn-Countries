import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = 3000;
const URL = "https://flagsapi.com/PS/shiny/64.png";

app.use(bodyParser.urlencoded({extended: true }));
app.use(express.static("public"));

let totalAnswerCorrect = 0;
let totlaAnswerNOtCorrect = 0;

const db = new pg.Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST
});

db.connect();

let quiz = [];
let quizFlag =[];

db.query("SELECT * FROM capitals", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    quiz = res.rows;
    
    db.query("SELECT * FROM countries", (err2, res2) => {
      if (err2) {
        console.error("Error executing second query", err2.stack);
      } else {
        quizFlag = res2.rows;
        
        db.end();
      }
    });
  }
});


let currentQuestion = [];
let currentFlag = [];

app.get("/", (req, res) => {
  res.render("welcome.ejs"); 
});

app.get("/learn-capital", async (req, res) => {
  totalAnswerCorrect = 0;
  totlaAnswerNOtCorrect = 0;
  await nextQuestion();
  res.render("index.ejs", { question: currentQuestion });
});

app.post("/learn-capital/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let theAnswer = false;
  
  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()){
    totalAnswerCorrect++;
    console.log(totalAnswerCorrect);
    theAnswer = true;
  }
  else {
    totlaAnswerNOtCorrect ++;
    console.log(totlaAnswerNOtCorrect)
  }

nextQuestion();
res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect : theAnswer, 
    totalScore : totalAnswerCorrect,
    totalMistake : totlaAnswerNOtCorrect,
  });
  console.log(currentQuestion);
});

app.get("/learn-flags", async (req, res) => {
  totalAnswerCorrect = 0;
  totlaAnswerNOtCorrect = 0;
  try {
    await nextFlag();
    const country_code = currentFlag.country_code; 
    const url = `https://flagsapi.com/${country_code}/shiny/64.png`;
    const response = await axios.get(url, { responseType: 'arraybuffer'});
    const imageBase64 = Buffer.from(response.data).toString('base64');
    res.render("flags.ejs", { data: imageBase64 });
  }
  catch (error) { 
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/learn-flags/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let theAnswer = false;
    
  if (currentFlag.country_name.toLowerCase() === answer.toLowerCase()){
    totalAnswerCorrect++;
    console.log(totalAnswerCorrect);
    theAnswer = true;
  }
  else {
    totlaAnswerNOtCorrect ++;
    console.log(totlaAnswerNOtCorrect)
  }
  const imageBase64 = await nextFlag(); 
  res.render("flags.ejs" , {
    data: imageBase64,
    wasCorrect : theAnswer, 
    totalScore : totalAnswerCorrect,
    totalMistake : totlaAnswerNOtCorrect,

  })
  console.log(currentFlag);
})

async function nextQuestion() {
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
  currentQuestion = randomCountry;
}

async function nextFlag() {
  const randomFlag = quizFlag[Math.floor(Math.random() * quizFlag.length)]
  currentFlag = randomFlag;
  const country_code = currentFlag.country_code; 
  const url = `https://flagsapi.com/${country_code}/shiny/64.png`;
  const response = await axios.get(url, { responseType: 'arraybuffer'});
  return Buffer.from(response.data).toString('base64');
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

