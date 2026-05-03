import { Router } from 'express';
import { query } from '../db.js';

export const aiRouter = Router();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = 'HuggingFaceH4/zephyr-7b-beta';

async function getProfileContext() {
  try {
    const result = await query('SELECT section, data FROM profile_sections');
    const profile = {};
    result.rows.forEach(r => { profile[r.section] = r.data; });
    return JSON.stringify(profile);
  } catch { return ''; }
}

function smartFallback(message) {
  const msg = message.toLowerCase();
  if (msg.includes('experience') || msg.includes('work') || msg.includes('job') || msg.includes('company') || msg.includes('intern')) {
    return "Pravakar is currently a Backend .NET Trainee at Vertex Special Technology (Feb 2025–Present), where he builds enterprise software, conducts PoCs, and collaborates across teams in Nepal, Pakistan, and the US using Scrum.";
  }
  if (msg.includes('project') || msg.includes('vstellar') || msg.includes('yaintra') || msg.includes('numairik') || msg.includes('ide')) {
    return "Pravakar has built 3 major projects: vStellar (a VS Code-like IDE with ElectronJS + Angular + Java test runner), yAIntra (HRMS with RBAC REST APIs and JWT auth research), and NumAIrik (multi-tenant accounting software with full 2FA: Email, SMS, and Authenticator App).";
  }
  if (msg.includes('skill') || msg.includes('tech') || msg.includes('language') || msg.includes('stack') || msg.includes('know')) {
    return "Pravakar's core stack: C# (5/5), .NET Core, ASP.NET Core MVC, Entity Framework Core, SQL Server. He also works with React, Angular, and Java. Strong background in OOP, REST APIs, and multi-tenant architecture.";
  }
  if (msg.includes('education') || msg.includes('degree') || msg.includes('study') || msg.includes('university') || msg.includes('college')) {
    return "Pravakar holds a BSc in Computer Science & IT from Bhaktapur Multiple Campus, Tribhuvan University (2021–2025). He received consecutive Academic Excellence Scholarships in 2024 for top academic performance.";
  }
  if (msg.includes('contact') || msg.includes('email') || msg.includes('hire') || msg.includes('reach') || msg.includes('phone')) {
    return "Reach Pravakar at pravakarrijal11@gmail.com or +977-9815185130. He's based in Kathmandu, Nepal. LinkedIn: linkedin.com/in/pravakar-rijal";
  }
  if (msg.includes('certif')) {
    return "Pravakar holds a Microsoft Certified Foundational C# (Sept 2024) and completed CS50: Introduction to Computer Science from Harvard (Jun 2023).";
  }
  if (msg.includes('who') || msg.includes('about') || msg.includes('pravakar') || msg.includes('tell me')) {
    return "Pravakar Rijal is a .NET Developer & Backend Specialist from Kathmandu, Nepal. He builds scalable enterprise applications using C#, ASP.NET Core, and SQL Server. Currently training at Vertex Special Technology while completing his BSc in CS.";
  }
  return "I'm an AI assistant trained on Pravakar's portfolio. Ask me about his skills, projects, experience, education, or contact details!";
}

aiRouter.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  if (HF_API_KEY) {
    try {
      const context = await getProfileContext();
      const prompt = `<|system|>You are an AI assistant for Pravakar Rijal's interactive portfolio. Answer questions about him concisely (2-3 sentences). Profile data: ${context}</s><|user|>${message}</s><|assistant|>`;
      const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 200, temperature: 0.7, return_full_text: false } })
      });
      if (response.ok) {
        const data = await response.json();
        const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
        if (text?.trim()) return res.json({ response: text.trim(), model: HF_MODEL });
      }
    } catch { /* fall through */ }
  }

  res.json({ response: smartFallback(message), model: 'local-knowledge' });
});
