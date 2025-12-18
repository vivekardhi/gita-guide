import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const gitaMap = JSON.parse(
  fs.readFileSync(new URL("./gitaMap.json", import.meta.url))
);


const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function analyzeProblem(problem) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Classify the user's problem into one main theme from this list only: fear, confusion, attachment, anger, failure. Respond with ONLY the theme word."
        },
        { role: "user", content: problem }
      ]
    })
  });

  const data = await res.json();
  const theme = data.choices[0].message.content
    .toLowerCase()
    .trim();

  return { themes: [theme] };
}


async function explainVerse(problem, verse) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Explain the Bhagavad Gita verse calmly, practically, and in modern language."
        },
        {
          role: "user",
          content: `Problem: ${problem}\nVerse: ${verse}`
        }
      ]
    })
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

app.post("/ask", async (req, res) => {
  try {
    const { problem } = req.body;

    const analysis = await analyzeProblem(problem);
    const theme = analysis.themes[0] || "confusion";
    const verseRef = gitaMap[theme][0];

    const verseData = await fetchVerse(
      verseRef.chapter,
      verseRef.verse
    );

    const explanation = await explainVerse(
      problem,
      verseData.slok
    );

const verseText =
  verseData.slok ||
  verseData.shloka ||
  "Verse not available";

const meaningText =
  verseData.translation ||
  verseData.te?.ht ||
  verseData.tej?.ht ||
  "Meaning not available";

const explanationText =
  explanation && explanation.trim().length > 0
    ? explanation
    : "Krishna advises calm action without attachment to outcomes.";
console.log("GITA API RESPONSE:", verseData);
console.log("EXPLANATION:", explanation);

res.json({
  verse: verseText,
  meaning: meaningText,
  explanation: explanationText
});

  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});


