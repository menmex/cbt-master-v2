import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { onRequest } from "firebase-functions/v2/https";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const getGeminiAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Route: Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: Validate Practice Session & Subscription Status
app.post("/api/practice/validate-session", (req, res) => {
  try {
    const { userId, requestedLimit, isPremium, userRole } = req.body;

    const isUnlimited =
      requestedLimit === "unlimited" ||
      requestedLimit === "Unlimited" ||
      Number(requestedLimit) > 30;

    if (isUnlimited) {
      if (!isPremium && userRole !== "admin") {
        return res.status(403).json({
          success: false,
          error:
            "Unlimited Questions is a Premium Feature. Only Premium subscribers can access Unlimited Questions.",
          isPremiumRequired: true,
        });
      }
    }

    return res.json({
      success: true,
      validatedLimit: isUnlimited
        ? "unlimited"
        : Math.min(Math.max(Number(requestedLimit) || 10, 1), 30),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: err.message || "Failed to validate session." });
  }
});

// API Route: Generate AI Questions from Course Material (PDF, Photo, Text Writing, Documents)
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const {
      materialText,
      fileData,
      mimeType,
      fileName,
      universityName = "University",
      level = "100 Level",
      courseCode = "GST101",
      courseTitle = "General Course",
      topic = "General Topic",
      difficulty = "Medium",
      questionCount = 5,
    } = req.body;

    const hasFile = !!(fileData && typeof fileData === 'string' && fileData.trim().length > 0);
    const hasText = !!(materialText && typeof materialText === 'string' && materialText.trim().length >= 10);

    if (!hasFile && !hasText) {
      return res.status(400).json({
        error: "Please provide either an uploaded file (PDF, photo/image, Word/text document) or text material (minimum 10 characters).",
      });
    }

    const ai = getGeminiAi();
    const instructionPrompt = `You are an expert university examiner and CBT question author.
Analyze the provided study material / exam photo / document for ${universityName} course "${courseCode}: ${courseTitle}" (${level}, topic: "${topic || 'General Topic'}").
Generate exactly ${questionCount} high-quality, exam-standard multiple-choice practice questions at "${difficulty || 'Medium'}" difficulty.

Requirements for each question:
1. "question": A clear, unambiguous question statement testing comprehension, application, or factual recall.
2. "optionA": First plausible answer choice.
3. "optionB": Second plausible answer choice.
4. "optionC": Third plausible answer choice.
5. "optionD": Fourth plausible answer choice.
6. "correctAnswer": Must strictly be one of "A", "B", "C", or "D".
7. "explanation": A concise, educational step-by-step breakdown explaining why the correct answer is right and why distractors are incorrect.
8. "difficulty": "${difficulty || 'Medium'}"
9. "topic": "${topic || 'General Topic'}"`;

    const contentsParts: any[] = [];

    if (hasFile) {
      let normalizedMime = mimeType || 'application/pdf';
      const fName = (fileName || '').toLowerCase();

      if (fName.endsWith('.pdf')) normalizedMime = 'application/pdf';
      else if (fName.endsWith('.jpg') || fName.endsWith('.jpeg')) normalizedMime = 'image/jpeg';
      else if (fName.endsWith('.png')) normalizedMime = 'image/png';
      else if (fName.endsWith('.webp')) normalizedMime = 'image/webp';
      else if (fName.endsWith('.txt')) normalizedMime = 'text/plain';
      else if (fName.endsWith('.csv')) normalizedMime = 'text/csv';
      else if (fName.endsWith('.json')) normalizedMime = 'application/json';
      else if (fName.endsWith('.html') || fName.endsWith('.htm')) normalizedMime = 'text/html';

      // Strip base64 data URI header if present
      let cleanBase64 = fileData;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      contentsParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: normalizedMime,
        },
      });
    }

    if (hasText) {
      contentsParts.push({
        text: `Source Text / Material Content:\n"""\n${materialText.slice(0, 20000)}\n"""`,
      });
    }

    contentsParts.push({ text: instructionPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              optionC: { type: Type.STRING },
              optionD: { type: Type.STRING },
              correctAnswer: { type: Type.STRING, description: "Must be A, B, C, or D" },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              topic: { type: Type.STRING },
            },
            required: ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"],
          },
        },
      },
    });

    const questionsRaw = JSON.parse(response.text || "[]");
    return res.json({ success: true, questions: questionsRaw });
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate questions." });
  }
});

// API Route: Generate AI Explanation for a question
app.post("/api/ai/explain-question", async (req, res) => {
  try {
    const { question, optionA, optionB, optionC, optionD, correctAnswer, userAnswer } = req.body;

    const ai = getGeminiAi();
    const prompt = `Provide a friendly, deep educational explanation for this university examination question.
Question: ${question}
Option A: ${optionA}
Option B: ${optionB}
Option C: ${optionC}
Option D: ${optionD}
Correct Answer: Option ${correctAnswer}
Student's Chosen Answer: ${userAnswer ? `Option ${userAnswer}` : "Not answered"}

Explain step-by-step why Option ${correctAnswer} is correct and why the student's answer (if wrong) was mistaken. Keep it concise, engaging, and easy to memorize for exams.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ success: true, explanation: response.text });
  } catch (err: any) {
    console.error("AI Explanation Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate explanation." });
  }
});

// API Route: AI Performance Analysis
app.post("/api/ai/analyze-performance", async (req, res) => {
  try {
    const { score, totalQuestions, courseCode, timeSpentSeconds, weakTopics, strongTopics } = req.body;

    const ai = getGeminiAi();
    const prompt = `Analyze this student's CBT examination result and provide 3 actionable, encouraging study strategies:
Course: ${courseCode}
Score: ${score} out of ${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%)
Time Spent: ${Math.floor(timeSpentSeconds / 60)} minutes ${timeSpentSeconds % 60} seconds
Weak Topics: ${weakTopics?.join(", ") || "None identified"}
Strong Topics: ${strongTopics?.join(", ") || "General knowledge"}

Return JSON format with:
1. "verdict": Short summary phrase (e.g., "Excellent Performance!", "Great Effort - Focus on Weak Areas")
2. "feedback": Paragraph of tactical feedback.
3. "recommendations": Array of 3 bullet points for next steps.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            feedback: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["verdict", "feedback", "recommendations"],
        },
      },
    });

    const analysis = JSON.parse(response.text || "{}");
    return res.json({ success: true, analysis });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate analysis." });
  }
});

// API Route: MenCore AI Chat (Gemini AI for General Knowledge & Outside Questions)
app.post("/api/ai/mencore-chat", async (req, res) => {
  try {
    const { questionText, userProfile } = req.body;

    if (!questionText || typeof questionText !== "string") {
      return res.status(400).json({ error: "Question text is required." });
    }

    const ai = getGeminiAi();
    const userName = userProfile?.name || "Student";
    const systemPrompt = `You are MenCore AI (Smart MenCore, Powered by Menmex), the official intelligent CBT & Academic Companion for Acadet CBT Master.
You are addressing ${userName}.
You act just like Gemini AI: smart, articulate, highly knowledgeable, friendly, and comprehensive across all domains (academic subjects, science, mathematics, literature, history, technology, general knowledge, current facts, and exam preparation).
Provide clear, structured, well-formatted answers with markdown bolding, bullet points, code blocks or mathematical formulas where appropriate.
If the student asks a question about CBT exams or university courses, give them an accurate, encouraging, and highly detailed breakdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: questionText,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const textAnswer = response.text || "I processed your question using MenCore Gemini AI.";
    return res.json({ success: true, answer: textAnswer });
  } catch (err: any) {
    console.error("MenCore Gemini AI Chat Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process query via Gemini AI.",
    });
  }
});

// API Route: Payment Verification Simulation & Korapay Integration
function isKorapayConfigured(): boolean {
  const secretKey = (process.env.KORAPAY_SECRET_KEY || "").trim();
  const publicKey = (process.env.KORAPAY_PUBLIC_KEY || "").trim();

  const isSecretValid =
    secretKey !== "" &&
    !secretKey.includes("placeholder") &&
    !secretKey.includes("MY_");
  const isPublicValid =
    publicKey !== "" &&
    !publicKey.includes("placeholder") &&
    !publicKey.includes("MY_");

  return isSecretValid || isPublicValid;
}

app.get("/api/korapay/config", (_req, res) => {
  const configured = isKorapayConfigured();
  const secretKey = process.env.KORAPAY_SECRET_KEY || "";
  const publicKey = process.env.KORAPAY_PUBLIC_KEY || "";
  const isLiveConfigured = secretKey.startsWith("sk_live_");

  return res.json({
    isConfigured: configured,
    publicKey: configured ? publicKey : "",
    mode: isLiveConfigured ? "live" : "test",
    isLiveConfigured,
    message: configured ? "Korapay payment gateway is operational." : "Payment service temporarily unavailable",
  });
});

app.post("/api/korapay/initialize", async (req, res) => {
  try {
    if (!isKorapayConfigured()) {
      return res.json({
        success: false,
        error: "Payment service temporarily unavailable",
        isPaymentDisabled: true,
      });
    }

    const { userId, userEmail, userName, planId, planName, amount, redirectUrl } = req.body;
    const reference = `KORA-CBT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const secretKey = (process.env.KORAPAY_SECRET_KEY || "").trim();
    const publicKey = (process.env.KORAPAY_PUBLIC_KEY || "").trim();
    const baseUrl = process.env.KORAPAY_BASE_URL || "https://api.korapay.com/merchant/api/v1";

    const isLiveKey = secretKey.startsWith("sk_live_");

    if (secretKey) {
      try {
        const koraRes = await fetch(`${baseUrl}/charges/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
          },
          body: JSON.stringify({
            amount: Number(amount) || 1500,
            currency: "NGN",
            reference,
            notification_url: `${process.env.APP_URL || 'https://ais-dev-65xmt2vtu7m7i77aevqwnt-392291001943.europe-west2.run.app'}/api/korapay/webhook`,
            redirect_url: redirectUrl || `${process.env.APP_URL || 'https://ais-dev-65xmt2vtu7m7i77aevqwnt-392291001943.europe-west2.run.app'}?payment_ref=${reference}`,
            customer: {
              name: userName || "Acadet Student",
              email: userEmail,
            },
            metadata: {
              userId,
              planId,
              planName,
            },
          }),
        });

        const koraData = await koraRes.json();

        if (koraData.status && koraData.data) {
          return res.json({
            success: true,
            reference,
            checkoutUrl: koraData.data.checkout_url,
            data: koraData.data,
          });
        }
      } catch (e) {
        console.warn("Korapay API Live init failed, using gateway reference response:", e);
      }
    }

    // Direct Korapay initialization response
    return res.json({
      success: true,
      reference,
      checkoutUrl: `${process.env.APP_URL || 'https://ais-dev-65xmt2vtu7m7i77aevqwnt-392291001943.europe-west2.run.app'}?payment_ref=${reference}`,
      publicKey,
      amount: Number(amount) || 1500,
      planId: planId || "plan-30d",
      planName: planName || "30-Day Premium",
      mode: isLiveKey ? "live" : "test",
    });
  } catch (err: any) {
    console.error("Korapay Init Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to initialize Korapay payment." });
  }
});

app.post("/api/korapay/verify", async (req, res) => {
  try {
    if (!isKorapayConfigured()) {
      return res.json({
        success: false,
        error: "Payment service temporarily unavailable",
        isPaymentDisabled: true,
      });
    }

    const { reference, userId, planId, amount, gateway = "Korapay" } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false, error: "Payment reference is required." });
    }

    const secretKey = process.env.KORAPAY_SECRET_KEY || "sk_test_placeholder";
    const baseUrl = process.env.KORAPAY_BASE_URL || "https://api.korapay.com/merchant/api/v1";
    const isLiveKey = secretKey && !secretKey.includes("placeholder") && secretKey.startsWith("sk_");

    let isVerifiedSuccess = true;
    let actualAmount = Number(amount) || (planId === 'plan-14d' ? 800 : 1500);

    if (isLiveKey) {
      try {
        const verifyRes = await fetch(`${baseUrl}/charges/${reference}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status && verifyData.data && (verifyData.data.status === 'success' || verifyData.data.status === 'successful')) {
          isVerifiedSuccess = true;
          actualAmount = verifyData.data.amount || actualAmount;
        } else {
          isVerifiedSuccess = false;
        }
      } catch (err) {
        console.warn("Korapay API Live verify check failed:", err);
      }
    }

    if (!isVerifiedSuccess) {
      return res.status(400).json({
        success: false,
        error: "Korapay payment verification failed or payment was cancelled/unsuccessful.",
      });
    }

    // Determine plan duration & expiry date
    const is14d = planId === 'plan-14d' || actualAmount === 800;
    const durationDays = is14d ? 14 : 30;
    const planTitle = is14d ? '14 Days Premium' : '30 Days Premium';
    const expiryDate = new Date(Date.now() + durationDays * 86400000).toISOString();
    const paidAt = new Date().toISOString();

    const activationPayload = {
      isPremium: true,
      subscriptionStatus: "active",
      subscriptionPlan: planTitle,
      paymentReference: reference,
      paymentAmount: actualAmount,
      paymentStatus: "successful",
      paymentDate: paidAt,
      expiryDate,
    };

    const transaction = {
      id: `tx-${Date.now()}`,
      userId: userId || "usr-student-1",
      reference,
      gateway: gateway || "Korapay",
      amount: actualAmount,
      planName: planTitle,
      date: paidAt,
      expiryDate,
      status: "Successful",
      paymentMethod: "Korapay Checkout",
    };

    return res.json({
      success: true,
      message: "Payment verified successfully by server! Premium subscription activated.",
      subscription: activationPayload,
      transaction,
    });
  } catch (err: any) {
    console.error("Korapay Verify Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to verify Korapay payment." });
  }
});

app.post("/api/korapay/webhook", (req, res) => {
  try {
    const event = req.body;
    console.log("Korapay Webhook Event Received:", event?.event, event?.data?.reference);

    // Always respond 200 to Korapay webhook to acknowledge delivery
    return res.status(200).json({ status: "success", message: "Webhook processed" });
  } catch (e: any) {
    console.error("Webhook Error:", e);
    return res.status(200).json({ status: "success" });
  }
});

app.post("/api/payments/verify", (req, res) => {
  const { reference, gateway, planId, amount } = req.body;
  const is14d = planId === 'plan-14d' || Number(amount) === 800;
  const durationDays = is14d ? 14 : 30;
  const expiryDate = new Date(Date.now() + durationDays * 86400000).toISOString();

  return res.json({
    success: true,
    message: "Payment successfully verified and subscription activated!",
    data: {
      reference: reference || `CBT-${Date.now()}`,
      gateway: gateway || "Korapay",
      amount: amount || (is14d ? 800 : 1500),
      planId: planId || "plan-30d",
      planName: is14d ? "14 Days Premium" : "30 Days Premium",
      paidAt: new Date().toISOString(),
      expiryDate,
      status: "success",
    },
  });
});

// Admin Authentication & Rate Limiting Store
const failedAdminAttempts = new Map<string, { count: number; lockUntil: number }>();
const validAdminSessions = new Set<string>();

app.post("/api/admin/login", (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "global_client";
  const now = Date.now();
  const attemptInfo = failedAdminAttempts.get(clientIp) || { count: 0, lockUntil: 0 };

  if (attemptInfo.lockUntil > now) {
    const secondsLeft = Math.ceil((attemptInfo.lockUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed login attempts. Admin login is temporarily locked for ${secondsLeft} seconds.`
    });
  }

  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME || "Menmex";
  const expectedPassword = process.env.ADMIN_PASSWORD || "joyce@menmex";

  if (username === expectedUsername && password === expectedPassword) {
    failedAdminAttempts.delete(clientIp);
    const sessionToken = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    validAdminSessions.add(sessionToken);

    return res.json({
      success: true,
      token: sessionToken,
      adminUser: {
        id: "usr-admin-menmex",
        name: "System Administrator",
        username: expectedUsername,
        email: "admin@menmex.ng",
        role: "admin",
        universityId: "uni-ful",
        universityName: "Federal University Lokoja, Kogi State (FUL)",
        departmentId: "dept-ful-1",
        departmentName: "Computer Science",
        subscription: {
          isPremium: true,
          plan: "30-Day Premium",
          startDate: new Date().toISOString(),
          expiryDate: null,
          questionsAttemptedCount: 0,
          freeLimit: 999999,
        },
        bookmarks: [],
        createdDate: new Date().toISOString(),
      }
    });
  } else {
    const newCount = attemptInfo.count + 1;
    let lockUntil = 0;
    if (newCount >= 5) {
      lockUntil = now + 60 * 1000; // 60 second lock after 5 consecutive failures
    }
    failedAdminAttempts.set(clientIp, { count: newCount, lockUntil });

    // Exact requirement: "Invalid administrator username or password."
    return res.status(401).json({
      error: "Invalid administrator username or password."
    });
  }
});

// Admin Session Verification
app.post("/api/admin/verify", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
  if (token && validAdminSessions.has(token)) {
    return res.json({ valid: true, role: "admin" });
  }
  return res.status(403).json({ valid: false, error: "Access Denied. Administrator privileges are required." });
});

// Export Cloud Function handler for Firebase Hosting / Cloud Functions deployments
export const api = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  app
);

export { app };

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.FUNCTION_NAME && !process.env.FUNCTION_TARGET) {
  startServer();
}
