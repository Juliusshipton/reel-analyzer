export interface VideoCategory {
    id: string;
    title: string;
}

export interface YouTubeCategory {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        title: string;
        assignable: boolean;
        channelId: string;
    };
}