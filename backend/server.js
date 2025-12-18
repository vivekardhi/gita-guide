import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const gitaMap = JSON.parse(
  fs.readFileSync(new URL("./gitaMap.json", import.meta.url))
);

// ---- Analyze problem (simple & safe) ----
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
          content:`
You are a calm, compassionate guide inspired by Krishna.

The user has shared a personal, real-life problem.
First, acknowledge their specific feelings in simple, human language.
Show that you understand what they are going through.

Then, explain how the given Bhagavad Gita verse applies directly to THEIR situation.
Make the connection explicit.

Avoid generic preaching or vague spirituality.
Be practical, grounded, and reassuring.
Speak as if you are guiding one person sitting in front of you.
`
},
        { role: "user", content: problem }
      ]
    })
  });

  const data = await res.json();
  const theme = data.choices?.[0]?.message?.content
    ?.toLowerCase()
    ?.trim() || "fear";

  return theme;
}

// ---- Fetch Gita verse ----
async function fetchVerse(chapter, verse) {
  const res = await fetch(
    `https://bhagavadgitaapi.in/slok/${chapter}/${verse}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("GITA API returned non-JSON:", text.slice(0, 200));
    return {
      slok: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
      translation:
        "You have the right to perform your duty, but not to the fruits of action."
    };
  }
}


// ---- Explain verse ----
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
          content: `
[VERSION: PERSONALIZED_V1]

You are a calm, compassionate guide inspired by Krishna.

First, explicitly mention one detail from the user's problem
to show you understand their situation.

Then explain how the Bhagavad Gita verse applies directly to THEM.
Avoid generic advice.
` },
        {
          role: "user",
          content: `Problem: ${problem}\nVerse: ${verse}`
        }
      ]
    })
  });

  const data = await res.json();
  return (
    data.choices?.[0]?.message?.content ||
    "Krishna advises calm action without attachment to outcomes."
  );
}

// ---- Main API ----
app.post("/ask", async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem) {
      return res.status(400).json({ error: "Problem is required" });
    }

    const theme = await analyzeProblem(problem);
    const verseRef = gitaMap[theme]?.[0] || gitaMap["fear"][0];

    const verseData = await fetchVerse(
      verseRef.chapter,
      verseRef.verse
    );

    const explanation = await explainVerse(
      problem,
      verseData.slok
    );

    const verseText =
      verseData.slok || "Verse not available";

    const meaningText =
      verseData.translation ||
      verseData.te?.ht ||
      verseData.tej?.ht ||
      "Meaning not available";

    res.json({
      verse: verseText,
      meaning: meaningText,
      explanation
    });
  } catch (e) {
    console.error("ASK ERROR:", e);
    res.status(500).json({
      error: "Internal server error",
      details: e.message
    });
  }
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});

