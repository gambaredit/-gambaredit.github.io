import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Lazy Gemini client helper
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ status: "ok", geminiKeyAvailable: hasKey });
  });

  // 1. AI Viral Hook & Content Idea Generator (Gemini 3.7 Flash - Free Tier Friendly)
  app.post("/api/ai/generate-hook", async (req, res) => {
    try {
      const { topic, style } = req.body;
      const ai = getAI();

      if (!ai) {
        // High quality fallback generation if key not configured
        const sampleHooks = [
          {
            headlineText: "BFF",
            brushLine1: "Awalnya biasa saja,",
            brushLine2: "tapi ending-nya bikin penasaran banget 😳",
            subTagText: "Ytta",
            headlineTheme: "pink-neon",
            suggestedPrompt: "A cinematic hyper-realistic 3D scene of two cute best friends with vibrant neon lighting, 8k resolution, trending on artstation",
          },
          {
            headlineText: "VIRAL",
            brushLine1: "Jangan pernah lihat slide terakhir,",
            brushLine2: "kalau belum siap kaget maksimal! 😱",
            subTagText: "Paham Kan?",
            headlineTheme: "fire-orange",
            suggestedPrompt: "A hyper-detailed 3D render of a mysterious glowing artifact in a cyberpunk room, volumetric fog, high contrast vivid colors",
          },
          {
            headlineText: "ASUPAN",
            brushLine1: "Pas di-zoom ternyata ada yang aneh,",
            brushLine2: "cuma orang jeli yang langsung sadar 👀",
            subTagText: "Viral Indo",
            headlineTheme: "cyan-electric",
            suggestedPrompt: "A vivid Indonesian street aesthetic at golden hour with neon reflections and photorealistic depth of field, 4k ultra quality",
          },
        ];
        const selected = sampleHooks[Math.floor(Math.random() * sampleHooks.length)];
        return res.json({ success: true, data: selected, isFallback: true });
      }

      const prompt = `Anda adalah master viral marketing Facebook & Reels Indonesia. 
Buat 1 set Viral Hook 3D dan teks clickbait penasaran (High CTR) berdasarkan topik: "${topic || 'Foto Konten Viral'}" dan gaya: "${style || 'Penasaran & Curiosity'}".

Kembalikan format JSON persis seperti berikut:
{
  "headlineText": "Kata singkat 3D di atas (misal: BFF, VIRAL, OMG, ASUPAN, HOT, 18+)",
  "brushLine1": "Pita kuas baris 1 (misal: Awalnya biasa saja, / Pas di-zoom / Niatnya cuma iseng)",
  "brushLine2": "Pita kuas baris 2 yang bikin penasaran dengan emoji (misal: tapi ending-nya bikin penasaran banget 😳 / ternyata ada yang janggal 👀)",
  "subTagText": "Teks tag latin singkat (misal: Ytta, Paham Kan?, Viral Indo, Rahasia)",
  "headlineTheme": "pilih salah satu: pink-neon | cyan-electric | gold-metal | fire-orange | white-chrome | cyber-purple",
  "suggestedPrompt": "Prompt bahasa inggris deskriptif untuk menghasilkan gambar AI pendukung berkualitas tinggi 3D/Photorealistic"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json({ success: true, data: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error generating viral hook:", err);
      res.status(500).json({ error: err.message || "Failed to generate hook" });
    }
  });

  // 2. AI Image Generator Endpoint
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "4:5", imageStyle = "3d-pixar" } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(400).json({
          error: "API Key Gemini belum terkonfigurasi. Anda dapat menggunakan Galeri Gambar AI Gratis yang sudah disediakan di aplikasi!",
          needsKey: true,
        });
      }

      // Append style boosters to prompt for ultra-crisp, masterpiece AI image generation
      let fullPrompt = prompt || "A cute 3D character with expressive face, vibrant colors, clean studio lighting";
      if (imageStyle === "3d-pixar") {
        fullPrompt += ", cute expressive 3D character in Disney Pixar render style, smooth porcelain skin, subsurface scattering, octane render, soft studio lighting, vivid glossy specular highlights, 8k crystal clarity, award winning 3D art";
      } else if (imageStyle === "photorealistic") {
        fullPrompt += ", photorealistic 8k master photography, Hasselblad 100MP, f/1.8 lens, cinematic lighting, ultra-sharp facial features, crystal clear eyes, natural dynamic range, detailed texture, de-noised, award winning photo";
      } else if (imageStyle === "cyberpunk") {
        fullPrompt += ", cyberpunk futuristic visual masterpiece, vivid glowing neon magenta and electric cyan reflections, holographic volumetric light, moody high contrast, razor-sharp textures, 8k crystal clear";
      } else if (imageStyle === "anime") {
        fullPrompt += ", high quality anime illustration, Makoto Shinkai aesthetic, luminous celestial glowing sky, intricate details, vivid saturated colors, crystal clear line art, 8k resolution";
      } else {
        fullPrompt += ", ultra-high resolution, crystal clear details, 8k masterpiece, sharp focus, vibrant color grading, high dynamic range HDR, professional quality";
      }

      // Map aspect ratio to supported format
      let mappedRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
      if (aspectRatio === "1:1") mappedRatio = "1:1";
      else if (aspectRatio === "9:16") mappedRatio = "9:16";
      else if (aspectRatio === "16:9") mappedRatio = "16:9";
      else if (aspectRatio === "4:3") mappedRatio = "4:3";
      else mappedRatio = "3:4"; // Default portrait for 4:5 FB feed

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: mappedRatio,
            imageSize: "1K",
          },
        },
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!base64Image) {
        return res.status(500).json({ error: "Model tidak mengembalikan gambar." });
      }

      res.json({
        success: true,
        imageUrl: base64Image,
        promptUsed: fullPrompt,
      });
    } catch (err: any) {
      console.error("Image generation error:", err);
      res.status(500).json({ error: err.message || "Gagal menghasilkan gambar AI" });
    }
  });

  // 3. AI Magic Eraser / Object & Sticker Remover Endpoint
  app.post("/api/ai/clean-image", async (req, res) => {
    try {
      const { imageBase64, instructions } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Foto base64 dibutuhkan" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(400).json({
          error: "API Key Gemini belum terkonfigurasi untuk AI Eraser.",
          needsKey: true,
        });
      }

      // Extract pure base64 data and mime type
      let mimeType = "image/jpeg";
      let cleanData = imageBase64;
      if (imageBase64.includes(";base64,")) {
        const parts = imageBase64.split(";base64,");
        const match = parts[0].match(/:(.*?)$/);
        if (match) mimeType = match[1];
        cleanData = parts[1];
      }

      const editPrompt = instructions || 
        "Seamlessly remove all stickers, heart badges, watermarks, text banners, the red BFF heart sticker, and the Breaking News banner from this image. Perfectly inpaint, reconstruct, and restore the natural fabric cloth folds, smooth texture, and original lighting beneath the stickers with razor-sharp photorealistic quality. Do not leave any blur, residue, or patch artifacts.";

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanData,
                mimeType: mimeType,
              },
            },
            {
              text: editPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            imageSize: "1K",
          },
        },
      });

      let cleanedBase64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            cleanedBase64Image = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!cleanedBase64Image) {
        return res.status(500).json({ error: "Model tidak mengembalikan gambar hasil bersih." });
      }

      res.json({
        success: true,
        imageUrl: cleanedBase64Image,
      });
    } catch (err: any) {
      console.error("AI clean image error:", err);
      res.status(500).json({ error: err.message || "Gagal membersihkan stiker/logo dengan AI" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Studio Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
