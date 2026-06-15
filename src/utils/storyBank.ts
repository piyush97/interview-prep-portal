import type { StoryBankEntry } from "../types";

export function storyToAnswer(story: StoryBankEntry): string {
  const parts = [
    story.situation && `Situation: ${story.situation}`,
    story.task && `Task: ${story.task}`,
    story.action && `Action: ${story.action}`,
    story.result && `Result: ${story.result}`,
    story.reflection && `Reflection: ${story.reflection}`,
  ].filter(Boolean);
  return parts.join(" ");
}

export function storyHasProof(story: StoryBankEntry): boolean {
  return story.metrics.length > 0 || /\d/.test(`${story.result} ${story.action}`);
}

export function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
