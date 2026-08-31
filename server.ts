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
        // Return a smart fallback response if no key is supplied
        const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
        let fallbackReply = "¡Hola! Como asistente de IVA CREATIVA, te ayudo a crear guiones para TikTok, estructurar ganchos virales y redactar mensajes para cerrar paquetes de videos con negocios.";
        
        if (lastMsg.toLowerCase().includes("guion") || lastMsg.toLowerCase().includes("hook") || lastMsg.toLowerCase().includes("restaurante")) {
          fallbackReply = `🎬 Guion Viral para Restaurante (TikTok 30s):
- **Hook (0-3s)**: "¿El secreto para que este corte de carne se deshaga en tu boca? Mira esto..." (Toma primer plano del cuchillo cortando carne humeante con sonido crujiente).
- **Cuerpo (3-20s)**: "En [Nombre del Local] marinamos cada pieza 24 horas a fuego lento con leña de algarrobo. Si eres amante de la buena carne, este es tu nuevo punto en Lima."
- **CTA (20-30s)**: "Muestra este video al llegar y recibe una copa de cortesía. ¡Etiqueta a tu amigo parrillero en comentarios!"`;
        } else if (lastMsg.toLowerCase().includes("propuesta") || lastMsg.toLowerCase().includes("pack") || lastMsg.toLowerCase().includes("presupuesto")) {
          fallbackReply = `💬 Mensaje comercial para WhatsApp:
"¡Hola [Nombre]! Te saluda el equipo de IVA CREATIVA 🎬.

Vimos el potencial de su negocio en redes y armamos una propuesta para posicionarlos con videos virales en TikTok y Reels:

📦 Pack Crecimiento TikTok:
• 12 Videos en formato vertical (Guion + Rodaje profesional + Edición con retención).
• 1 Jornada de grabación en tu local (equipo de cámaras, luces y microfonía).
• Entrega de contenido listo para publicar semanalmente.
• Inversión: S/ 2,400 (50% adelanto al agendar rodaje / 50% al entregar).

¿Te gustaría que agendemos la sesión de rodaje para esta semana? ¡Quedamos atentos!"`;
        } else if (lastMsg.toLowerCase().includes("seguimiento") || lastMsg.toLowerCase().includes("cierres")) {
          fallbackReply = "🎯 Seguimiento de ventas para hoy:\n1. Escribe a los negocios con cotizaciones enviadas hace más de 48h para resolver dudas de guiones.\n2. Coordina fechas de rodaje con clientes que ya abonaron su adelanto del 50%.\n3. Envía recordatorio de pago a los paquetes con saldo pendiente de entrega.";
        } else if (lastMsg.toLowerCase().includes("formatos") || lastMsg.toLowerCase().includes("ideas")) {
          fallbackReply = `💡 5 Formatos de Video Virales para Negocios en TikTok:
1. **POV Experiencia Real**: "POV: Vienes a almorzar a las 2pm y te atienden como rey".
2. **Derribando Mitos**: "3 cosas que tu dentista/médico/marca nunca te dijo sobre...".
3. **El Detrás de Escenas**: "Cómo preparamos 100 pedidos en 2 horas sin morir en el intento".
4. **Transformación Antes / Después**: Resultado visual impactante con audio en tendencia.
5. **Entrevista / Reacción con Clientes**: "¿Cuánto calificarías este plato del 1 al 10?"`;
        }

        return res.json({ text: fallbackReply });
      }

      const ai = new GoogleGenAI({ apiKey });

      const conversationHistory = (messages || [])
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "Agencia" : "Director IA"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${system || ""}\n\nHistorial de la conversación:\n${conversationHistory}\n\nDirector IA:`;

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

  // AI Parse endpoint for turning text/chat into structured shoot/client
  app.post("/api/ai/parse", async (req, res) => {
    try {
      const { text, currentYear } = req.body;
      const year = currentYear || new Date().getFullYear();
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback basic heuristic parser for TikTok agency
        const now = new Date();
        const dateStr = new Date(now.setDate(now.getDate() + 5)).toISOString().slice(0, 10);
        return res.json({
          lugar: text.slice(0, 40) || "Cliente / Negocio",
          fecha: dateStr,
          horario: "10:00 a 14:00",
          contacto: "Cliente WhatsApp",
          ticket: 2400,
          notas: text.slice(0, 120)
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Extrae de este mensaje de WhatsApp los datos de un cliente o rodaje para una agencia de videos de TikTok. Responde ÚNICAMENTE un JSON válido (sin formato markdown ni texto adicional).
Claves exactas:
- lugar (string: nombre del negocio, cliente, restaurante, marca o locación)
- fecha (string formato YYYY-MM-DD o "")
- horario (string con horario de rodaje, ej: "10:00 a 14:00" o "")
- contacto (string con nombre, WhatsApp o cargo del contacto)
- ticket (número entero con la tarifa o presupuesto en Soles S/, 0 si no se menciona)
- notas (string con requerimientos de grabación, paquete de videos solicitado o detalles clave)

Año actual de referencia: ${year}.
Expresiones como "2400 soles", "2.4k", "2400" equivalen a 2400.
Si falta un dato, coloca "" o 0.

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
    console.log(`IVA CREATIVA CRM server running on port ${PORT}`);
  });
}

startServer();
