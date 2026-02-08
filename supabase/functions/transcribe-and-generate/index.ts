import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { libraryId } = await req.json();
    if (!libraryId) {
      throw new Error("libraryId is required");
    }

    // Fetch library item
    const { data: libraryItem, error: fetchError } = await supabase
      .from("library")
      .select("*")
      .eq("id", libraryId)
      .single();

    if (fetchError || !libraryItem) {
      throw new Error("Library item not found");
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(libraryItem.file_path);

    if (downloadError || !fileData) {
      throw new Error("Failed to download file from storage");
    }

    // Step 1: Transcribe with ElevenLabs
    const formData = new FormData();
    formData.append("file", fileData, libraryItem.file_path.split("/").pop());
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", "eng");

    const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      throw new Error(`Transcription failed [${transcribeResponse.status}]: ${errorText}`);
    }

    const transcriptionData = await transcribeResponse.json();
    const transcript = transcriptionData.text;

    // Step 2: Generate study materials with AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert educational content generator. Given a transcript, create comprehensive study materials including:
1. A concise summary (2-3 paragraphs)
2. Structured notes with clear headings and bullet points
3. At least 10 flashcards (question/answer pairs)
4. A 10-question multiple-choice quiz with answers
5. Key points (5-7 main takeaways)
6. A glossary of important terms (at least 5 terms)
7. 5 exam-style questions with model answers`,
          },
          {
            role: "user",
            content: `Create comprehensive study materials from this transcript:\n\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_study_materials",
              description: "Generate comprehensive study materials from a transcript",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["heading", "content"],
                    },
                  },
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                    },
                  },
                  quizzes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctIndex: { type: "number" },
                      },
                      required: ["question", "options", "correctIndex"],
                    },
                  },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" },
                  },
                  glossary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        term: { type: "string" },
                        definition: { type: "string" },
                      },
                      required: ["term", "definition"],
                    },
                  },
                  examQuestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        modelAnswer: { type: "string" },
                      },
                      required: ["question", "modelAnswer"],
                    },
                  },
                },
                required: ["summary", "notes", "flashcards", "quizzes", "keyPoints", "glossary", "examQuestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_study_materials" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI generation failed [${aiResponse.status}]: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No study materials generated");
    }

    const materials = JSON.parse(toolCall.function.arguments);

    // Step 3: Generate visual image
    const imagePrompt = `Create an educational infographic or diagram based on this summary: ${materials.summary.substring(0, 500)}. Make it clear, informative, and visually engaging for students.`;
    
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    let visualImageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (base64Image) {
        visualImageUrl = base64Image;
      }
    }

    // Step 4: Update library item with all generated content
    const { error: updateError } = await supabase
      .from("library")
      .update({
        transcript,
        summary: materials.summary,
        notes: materials.notes,
        flashcards: materials.flashcards,
        quizzes: materials.quizzes,
        key_points: materials.keyPoints,
        glossary: materials.glossary,
        exam_questions: materials.examQuestions,
        visual_image_url: visualImageUrl,
        status: "completed",
      })
      .eq("id", libraryId);

    if (updateError) {
      throw new Error(`Failed to update library: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, libraryId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in transcribe-and-generate:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});