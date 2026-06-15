import type { InterviewPrep, InterviewQuestion } from "../types";
import { coachInterviewAnswer } from "./answerCoach";

const CATEGORIES: InterviewQuestion["category"][] = ["technical", "behavioral", "system-design", "general"];

export interface InterviewReadiness {
  score: number;
  level: "not-started" | "at-risk" | "ready" | "sharp";
  answeredCount: number;
  weakAnswerCount: number;
  missingCategories: InterviewQuestion["category"][];
  nextActions: string[];
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function daysUntil(date: string, now: Date) {
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil((target - now.getTime()) / (1000 * 60 * 60 * 24));
}

function levelFromScore(score: number): InterviewReadiness["level"] {
  if (score >= 85) return "sharp";
  if (score >= 65) return "ready";
  if (score >= 35) return "at-risk";
  return "not-started";
}

export function buildInterviewReadiness(prep: InterviewPrep, now = new Date()): InterviewReadiness {
  const questions = prep.questions;
  const answeredQuestions = questions.filter((question) => hasText(question.answer));
  const coveredCategories = new Set(questions.map((question) => question.category));
  const missingCategories = CATEGORIES.filter((category) => !coveredCategories.has(category));
  const coachedAnswers = answeredQuestions.map((question) => coachInterviewAnswer(question.answer, question.category));
  const weakAnswerCount = coachedAnswers.filter((coach) => coach.score < 70).length;
  const averageCoachScore = coachedAnswers.length
    ? coachedAnswers.reduce((sum, coach) => sum + coach.score, 0) / coachedAnswers.length
    : 0;

  let score = 0;
  if (hasText(prep.research)) score += 15;
  if (hasText(prep.notes)) score += 10;
  score += Math.min(15, questions.length * 4);
  score += CATEGORIES.filter((category) => coveredCategories.has(category)).length * 5;
  score += Math.round((answeredQuestions.length / Math.max(questions.length, 1)) * 20);
  score += Math.round((averageCoachScore / 100) * 20);
  score = Math.min(100, score);

  const nextActions: string[] = [];
  const dueSoon = daysUntil(prep.date, now) <= 3;
  if (!hasText(prep.research)) nextActions.push("Add company research and role-specific talking points.");
  if (!hasText(prep.notes)) nextActions.push("Write the interview plan: logistics, risks, questions, and close.");
  if (weakAnswerCount > 0) nextActions.push("Strengthen weak answers with measurable results and reflection.");
  if (dueSoon) nextActions.push("Run one timed rehearsal before the interview.");
  if (questions.length < 4) nextActions.push("Add at least four likely questions across technical and behavioral coverage.");
  if (missingCategories.length > 0) nextActions.push(`Cover missing categories: ${missingCategories.join(", ")}.`);
  if (answeredQuestions.length < questions.length) nextActions.push("Draft answers for every saved question.");

  return {
    score,
    level: levelFromScore(score),
    answeredCount: answeredQuestions.length,
    weakAnswerCount,
    missingCategories,
    nextActions: nextActions.slice(0, 4),
  };
}
