"use client";

import { Music } from "lucide-react";
import ToolPage from "@/components/tools/ToolPage";

export default function MusicPage() {
  return (
    <ToolPage
      toolId="music"
      title="AI Music"
      icon={<Music className="h-6 w-6" />}
      iconColor="bg-orange-50 text-orange-500 dark:bg-orange-950 dark:text-orange-400"
      placeholder="Describe a song, genre, or mood — I'll create lyrics, chord progressions, and composition notes"
      examples={[
        "Write a pop song about summer love",
        "Jazz chord progression in C minor",
        "Lo-fi hip hop beat description",
        "Epic orchestral soundtrack for a fantasy game",
      ]}
    />
  );
}
