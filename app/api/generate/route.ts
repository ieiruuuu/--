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

    const prompt = `사용자의 기분: ${mood}

[중요 지시사항]
1. 답변은 무조건 한국어로 작성해.
2. 전체 길이는 2~3문장으로 짧고 강렬하게 작성해.
3. 화려하고 강렬한 붓글씨 스타일의 축복 메시지 카드 톤으로 작성해.
4. 어미는 "~하세요", "~입니다", "~바랍니다" 처럼 단호하고 긍정적인 표현을 사용해.
5. 힘 있고 축복하는 인사말 형태로 작성해줘.
6. 보기 좋게 문장 단위로 줄바꿈을 해줘. (각 문장마다 줄바꿈)

예시 형식:
"기분 좋은 행복한 휴일 보내세요.
늘 함께해주셔서 감사합니다.
당신의 앞날에 축복이 가득하길 기원합니다."

또는

"오늘도 수고하셨습니다.
당신의 모든 순간이 빛나기를 바랍니다.
건강하고 행복한 나날 되세요."

응답은 JSON 형식 { quote: "2~3문장 축복 메시지 (문장 단위 줄바꿈)", author: "오늘의 위로", message: "짧은 응원" } 으로 제공해줘.`;
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

