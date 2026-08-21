import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { system, messages } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Return a smart simulated or helper response if no key is supplied
        const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
        let fallbackReply = "¡Hola! Como tu asistente de secretaría DJ, te recomiendo confirmar las fechas pendientes con los organizadores y enviar las propuestas con el 50% de seña para asegurar la reserva.";
        
        if (lastMsg.toLowerCase().includes("redactar")) {
          fallbackReply = "¡Hola! ¿Cómo estás? Te escribo para confirmar la fecha del evento. Avísame y te reservo la fecha con el 50% de seña. ¡Saludos!";
        } else if (lastMsg.toLowerCase().includes("seguimiento") || lastMsg.toLowerCase().includes("quién sigo")) {
          fallbackReply = "Revisá tus consultas abiertas: hacé un follow-up hoy a los organizadores que consultaron presupuesto en los últimos 3 días para cerrar antes del fin de semana.";
        } else if (lastMsg.toLowerCase().includes("semana") || lastMsg.toLowerCase().includes("organizá")) {
          fallbackReply = "Plan para esta semana:\n1. Confirmar sonido y traslados de tus fechas del fin de semana.\n2. Mandar propuestas a consultas pendientes.\n3. Grabar y publicar 2 reels con momentos de tu último show.";
        } else if (lastMsg.toLowerCase().includes("contenido")) {
          fallbackReply = "5 ideas de contenido para esta semana:\n1. Reel: 'Transición que nunca falla en el club'.\n2. Historia: Encuesta de géneros para tu próximo set.\n3. Reel: 'POV: Cuando el público explota a las 3 AM'.\n4. Carrusel: '3 tracks que no pueden faltar en mi set'.\n5. Video corto preparando el set en Rekordbox.";
        }

        return res.json({ text: fallbackReply });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Convert messages to Gemini format or structured prompt
      const conversationHistory = (messages || [])
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "DJ" : "Secretaría"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${system || ""}\n\nHistorial de la conversación:\n${conversationHistory}\n\nSecretaría:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const text = response.text || "(sin respuesta)";
      res.json({ text: text.trim() });
    } catch (error: any) {
      console.error("Error in /api/ai/chat:", error);
      res.status(500).json({ error: error.message || "Error al procesar consulta con IA" });
    }
  });

  // AI Parse endpoint for turning text/chat into structured date
  app.post("/api/ai/parse", async (req, res) => {
    try {
      const { text, currentYear } = req.body;
      const year = currentYear || new Date().getFullYear();
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback basic heuristic parser
        const now = new Date();
        const dateStr = new Date(now.setDate(now.getDate() + 7)).toISOString().slice(0, 10);
        return res.json({
          lugar: text.slice(0, 40) || "Evento privado",
          fecha: dateStr,
          horario: "00:00 a 04:00",
          contacto: "Cliente WhatsApp",
          ticket: 150000,
          notas: text.slice(0, 100)
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Extraé de este mensaje los datos de una posible fecha de DJ. Respondé ÚNICAMENTE un JSON válido (sin formato markdown \`\`\`json ni texto adicional).
Claves exactas:
- lugar (string: nombre del lugar, club, boliche o tipo de evento)
- fecha (string formato YYYY-MM-DD o "")
- horario (string, ej: "01:00 a 05:00" o "")
- contacto (string con nombre y/o teléfono o usuario)
- ticket (número entero en pesos, 0 si no hay o no se menciona)
- notas (string con requerimientos de sonido, música o detalles importantes)

Año actual de referencia: ${year}. Interpretá fechas relativas hacia el futuro próximo.
Expresiones como "150 lucas", "150k", "150 mil" equivalen a 150000.
Si falta un dato, poné "" o 0.

Mensaje del cliente:
"${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });

      const raw = response.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/ai/parse:", error);
      res.status(500).json({ error: error.message || "Error al interpretar mensaje con IA" });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`CRM DJ server running on port ${PORT}`);
  });
}

startServer();
