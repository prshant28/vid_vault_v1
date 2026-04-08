const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;
let _handlingUnauthorized = false;

export function setApiToken(token: string | null) {
  _token = token;
  _handlingUnauthorized = false;
}

export function setOnUnauthorized(fn: (() => void) | null) {
  _onUnauthorized = fn;
}

function authHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  return headers;
}

async function handleRes(res: Response) {
  if (res.status === 401 && _token) {
    if (!_handlingUnauthorized) {
      _handlingUnauthorized = true;
      _onUnauthorized?.();
    }
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  async getStats() {
    const res = await fetch(`${BASE_URL}/stats`, { headers: authHeaders() });
    return handleRes(res);
  },
  async listVideos(params?: { folderId?: string; tagId?: string; search?: string; favorites?: boolean; hasAi?: boolean; watched?: boolean; recentDays?: number; limit?: number; offset?: number }) {
    const qs = new URLSearchParams();
    if (params?.folderId) qs.set("folderId", params.folderId);
    if (params?.tagId) qs.set("tagId", params.tagId);
    if (params?.search) qs.set("search", params.search);
    if (params?.favorites) qs.set("favorites", "true");
    if (params?.hasAi) qs.set("hasAi", "true");
    if (params?.watched) qs.set("watched", "true");
    if (params?.recentDays != null) qs.set("recentDays", String(params.recentDays));
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const res = await fetch(`${BASE_URL}/videos?${qs}`, { headers: authHeaders() });
    return handleRes(res);
  },
  async getVideo(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}`, { headers: authHeaders() });
    return handleRes(res);
  },
  async addVideo(url: string, folderId?: string) {
    const res = await fetch(`${BASE_URL}/videos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url, folderId }),
    });
    return handleRes(res);
  },
  async deleteVideo(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async listTags() {
    const res = await fetch(`${BASE_URL}/tags`, { headers: authHeaders() });
    return handleRes(res);
  },
  async toggleFavorite(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/favorite`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async toggleWatched(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/watch`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async listFolders() {
    const res = await fetch(`${BASE_URL}/folders`, { headers: authHeaders() });
    return handleRes(res);
  },
  async createFolder(name: string, color?: string) {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, color }),
    });
    return handleRes(res);
  },
  async deleteFolder(folderId: string) {
    const res = await fetch(`${BASE_URL}/folders/${folderId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async listNotes(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/notes`, { headers: authHeaders() });
    return handleRes(res);
  },
  async createNote(videoId: string, content: string, timestamp?: number) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/notes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content, timestamp }),
    });
    return handleRes(res);
  },
  async updateNote(noteId: string, content: string, timestamp?: number | null) {
    const res = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ content, timestamp: timestamp ?? null }),
    });
    return handleRes(res);
  },
  async deleteNote(noteId: string) {
    const res = await fetch(`${BASE_URL}/notes/${noteId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async generateAiContent(videoId: string, type: string, language?: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/ai/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ type, ...(language ? { language } : {}) }),
    });
    return handleRes(res);
  },
  async listAiOutputs(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/ai/outputs`, { headers: authHeaders() });
    return handleRes(res);
  },
  async updateVideo(videoId: string, data: { folderId?: string | null; title?: string }) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleRes(res);
  },
  async addTagToVideo(videoId: string, tagId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/tags`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tagId }),
    });
    return handleRes(res);
  },
  async removeTagFromVideo(videoId: string, tagId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/tags/${tagId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async createTag(name: string, color?: string) {
    const res = await fetch(`${BASE_URL}/tags`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, color }),
    });
    return handleRes(res);
  },
  async deleteTag(tagId: string) {
    const res = await fetch(`${BASE_URL}/tags/${tagId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async quickAnalyzeVideo(videoId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/ai/quick-analyze`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleRes(res);
  },
  async deleteAiOutput(videoId: string, outputId: string) {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/ai/outputs/${outputId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.status === 204) return {};
    return handleRes(res);
  },
  async videoChat(message: string, videoId: string, history?: Array<{ role: "user" | "assistant"; content: string }>) {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message, videoId, history }),
    });
    return handleRes(res);
  },
  async globalChat(message: string, history?: Array<{ role: "user" | "assistant"; content: string }>) {
    const res = await fetch(`${BASE_URL}/ai/global-chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message, history }),
    });
    return handleRes(res);
  },
  async getTranscript(videoId: string): Promise<{ ytId: string; lines: Array<{ start: number; dur: number; text: string }> }> {
    const res = await fetch(`${BASE_URL}/videos/${videoId}/transcript`, { headers: authHeaders() });
    return handleRes(res);
  },
  async importPlaylist(url: string, folderName?: string): Promise<{ folder: { id: string; name: string; videosCount: number }; imported: number; skipped: number; total: number }> {
    const res = await fetch(`${BASE_URL}/videos/playlist`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url, ...(folderName ? { folderName } : {}) }),
    });
    return handleRes(res);
  },
  async previewVideo(url: string): Promise<{ title?: string; channelName?: string; thumbnail?: string; duration?: number; youtubeId?: string }> {
    const res = await fetch(`${BASE_URL}/preview?url=${encodeURIComponent(url)}`, { headers: authHeaders() });
    return handleRes(res);
  },
  async crossVideoChat(message: string, history?: Array<{ role: "user" | "assistant"; content: string }>): Promise<{ message: string; sourceCount: number }> {
    const res = await fetch(`${BASE_URL}/ai/cross-video`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message, history }),
    });
    return handleRes(res);
  },
  async getKeyTerms(): Promise<{ terms: Array<{ term: string; definition: string; videoCount: number }>; videoCount: number }> {
    const res = await fetch(`${BASE_URL}/ai/key-terms`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    return handleRes(res);
  },
  async globalSearch(q: string): Promise<{
    videos: Array<{ id: string; title: string; thumbnail: string | null; channelName: string | null; duration: string | null; folderId: string | null }>;
    notes: Array<{ id: string; snippet: string; timestamp: number | null; videoId: string; videoTitle: string; videoThumbnail: string | null }>;
    aiOutputs: Array<{ id: string; type: string; snippet: string; videoId: string; videoTitle: string; videoThumbnail: string | null }>;
  }> {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
    return handleRes(res);
  },
};
