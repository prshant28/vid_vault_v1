export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  channelName: string | null;
  duration: string | null;
  isFavorite: boolean;
  tags: Tag[];
  notes: Note[];
  aiOutputs: AiOutput[];
  folderId: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number | null;
  createdAt: string;
}

export interface AiOutput {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string | null;
  videoCount: number;
}

export interface Stats {
  totalVideos: number;
  totalFolders: number;
  totalTags: number;
  recentVideos: Video[];
  favoriteVideos: Video[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface YoutubeVideoResult {
  youtubeId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

export interface LibraryVideoResult {
  id: string;
  title: string;
  thumbnail: string | null;
  channelName: string | null;
  url: string;
}

export interface GlobalChatResponse {
  message: string;
  youtubeVideos: YoutubeVideoResult[];
  libraryVideos: LibraryVideoResult[];
}
