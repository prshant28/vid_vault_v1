import { describe, it, expect } from "vitest";
import { extractYoutubeId, getYoutubeThumbnail } from "../../lib/youtube";

describe("extractYoutubeId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from short youtu.be URL", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from embed URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from URL with additional query params", () => {
    expect(
      extractYoutubeId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL1234",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from URL with &v= parameter", () => {
    expect(
      extractYoutubeId(
        "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(extractYoutubeId("https://vimeo.com/123456789")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractYoutubeId("")).toBeNull();
  });

  it("returns null when video ID is fewer than 11 characters", () => {
    expect(extractYoutubeId("https://youtu.be/short")).toBeNull();
  });

  it("returns null for a plain domain with no video path", () => {
    expect(extractYoutubeId("https://www.youtube.com")).toBeNull();
  });
});

describe("getYoutubeThumbnail", () => {
  it("returns the maxresdefault thumbnail URL for a given video ID", () => {
    expect(getYoutubeThumbnail("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    );
  });

  it("includes the video ID in the returned URL", () => {
    const id = "abc123defgh";
    const url = getYoutubeThumbnail(id);
    expect(url).toContain(id);
  });

  it("always returns a URL ending with /maxresdefault.jpg", () => {
    const url = getYoutubeThumbnail("someid12345");
    expect(url).toMatch(/\/maxresdefault\.jpg$/);
  });
});
