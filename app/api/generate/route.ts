import { NextResponse } from "next/server";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

type GenerateRequest = {
  mood: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const mood = body?.mood?.trim();

    if (!mood) {
      return NextResponse.json({ error: "기분을 입력해주세요." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API KEY MISSING");
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const prompt = `사용자의 기분: ${mood}. 3~4문장 이상의 따뜻한 에세이/편지글 형태로, 사용자의 기분에 깊이 공감하며 위로하는 문체로 작성해줘. 단어 정의가 아닌 마음을 울리는 감성적인 문장들로 채워줘. 예: "지친 하루 끝에 찾아오는 공허함은 당신이 오늘 그만큼 열심히 살았다는 증거예요. 지금은 잠시 짐을 내려놓고 온전히 나 자신을 토닥여주세요. 당신은 충분히 잘하고 있고, 내일은 분명 오늘보다 더 따스한 햇살이 비출 거예요." 응답은 JSON 형식 { quote: "긴 글귀 내용", author: "오늘의 위로", message: "짧은 응원" } 으로 제공해줘.`;
    const url = `${API_URL}?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini fetch error:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      });
      return NextResponse.json(
        { error: "카드를 만들지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || !text.trim()) {
      console.error("Gemini response missing text field:", data);
      return NextResponse.json(
        { error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    console.log("Gemini cleaned text:", cleaned);

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", { cleaned, parseError });
      return NextResponse.json(
        { error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("상세 에러:", error);
    return NextResponse.json(
      { error: "카드를 만들지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

