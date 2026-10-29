import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const regionCode = searchParams.get("regionCode");

    if (!regionCode) {
        return NextResponse.json(
            { error: "Region Code required"},
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${regionCode}&key=${apiKey}`);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return NextResponse.json(
                { error: "No video categories found"},
                { status: 404 }
            );
        }

        const assignableItems = data.items.filter(item => item.snippet.assignable).map(item => ({
          id: item.id,
          title: item.snippet.title,
        }));

        return NextResponse.json(assignableItems);
        
    } catch (error) {
        console.error(error);

        return NextReponse.json(
            { error: "Failed to fetch video categories"},
            { status: 500 }
        );
    }
}