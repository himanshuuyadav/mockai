"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";

type SubmitAnswerResponse = {
  score: number;
  feedback: string;
  followUpQuestion: string;
  videoUrl: string;
  questionIndex: number;
  error?: string;
};

type LiveInterviewSessionProps = {
  sessionId: string;
  initialQuestion: string;
  isFreeUser: boolean;
  sessionType: "technical" | "hr";
};

type RecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => RecognitionType;
    webkitSpeechRecognition?: new () => RecognitionType;
  }
}

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type RecordingState = "idle" | "recording" | "paused";

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function pickRecorderMimeType() {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    return undefined;
  }

  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function splitTranscriptLines(text: string) {
  if (!text.trim()) {
    return [] as string[];
  }

  const matches = text.match(/[^.!?\n]+[.!?]?/g) ?? [];
  return matches.map((line) => line.trim()).filter(Boolean);
}

export function LiveInterviewSession({
  sessionId,
  initialQuestion,
  isFreeUser,
  sessionType,
}: LiveInterviewSessionProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<RecognitionType | null>(null);
  const recordingStateRef = useRef<RecordingState>("idle");
  const interviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechDetectedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const greetingQuestion = useMemo(
    () =>
      sessionType === "technical"
        ? "Welcome. We are now in your live technical interview. Think clearly and explain your reasoning step by step."
        : "Welcome. We are now in your live HR interview. Keep your responses authentic, structured, and outcome-focused.",
    [sessionType],
  );

  const [currentQuestion, setCurrentQuestion] = useState(greetingQuestion);
  const [hasShownInitialQuestion, setHasShownInitialQuestion] = useState(false);
  const [revealedWordCount, setRevealedWordCount] = useState(0);

  const [finalTranscript, setFinalTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [isManualTranscriptDirty, setIsManualTranscriptDirty] = useState(false);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [elapsedInterviewSeconds, setElapsedInterviewSeconds] = useState(0);
  const [elapsedRecordingSeconds, setElapsedRecordingSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState("");
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const combinedAutoTranscript = useMemo(() => {
    if (!liveTranscript) {
      return finalTranscript.trim();
    }
    return `${finalTranscript} ${liveTranscript}`.trim();
  }, [finalTranscript, liveTranscript]);

  const transcriptText = isManualTranscriptDirty ? manualTranscript : combinedAutoTranscript;

  const transcriptLines = useMemo(() => splitTranscriptLines(transcriptText), [transcriptText]);
  const questionWords = useMemo(() => currentQuestion.trim().split(/\s+/).filter(Boolean), [currentQuestion]);
  const renderedQuestion = useMemo(
    () => questionWords.slice(0, revealedWordCount).join(" "),
    [questionWords, revealedWordCount],
  );

  const cleanupMedia = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    recorderRef.current = null;
    setRecordingState("idle");
  }, []);

  const playCue = useCallback((frequency: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.02;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);

    oscillator.onended = () => {
      void context.close();
    };
  }, []);

  const syncLiveTranscript = useCallback(
    (nextFinal: string, nextLive: string) => {
      if (isManualTranscriptDirty) {
        return;
      }
      const merged = nextLive ? `${nextFinal} ${nextLive}`.trim() : nextFinal.trim();
      setManualTranscript(merged);
    },
    [isManualTranscriptDirty],
  );

  const startRecognition = useCallback(() => {
    const SpeechCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setIsSpeechSupported(false);
      return;
    }

    setIsSpeechSupported(true);
    const recognition = new SpeechCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalChunk += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalChunk.trim()) {
        setFinalTranscript((prev) => {
          const mergedFinal = `${prev} ${finalChunk}`.trim();
          syncLiveTranscript(mergedFinal, interim.trim());
          return mergedFinal;
        });
      } else {
        syncLiveTranscript(finalTranscript, interim.trim());
      }

      setLiveTranscript(interim.trim());
      setIsSpeechDetected(true);

      if (speechDetectedTimeoutRef.current) {
        clearTimeout(speechDetectedTimeoutRef.current);
      }
      speechDetectedTimeoutRef.current = setTimeout(() => setIsSpeechDetected(false), 900);
    };

    recognition.onerror = () => {
      setError("Speech recognition had an issue. Continue by typing your transcript.");
    };

    recognition.onend = () => {
      if (recordingStateRef.current === "recording") {
        try {
          recognition.start();
        } catch {
          // Ignore rapid restart collisions.
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [finalTranscript, syncLiveTranscript]);

  const stopCapture = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      cleanupMedia();
      return null as Blob | null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const built = chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
        resolve(built);
      };

      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        resolve(chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null);
      }
    });

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    recorderRef.current = null;
    setRecordingState("idle");
    return blob;
  }, [cleanupMedia]);

  const startCapture = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    setLiveTranscript("");
    setIsManualTranscriptDirty(false);
    setManualTranscript(finalTranscript.trim());

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    const mimeType = pickRecorderMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.start(500);
    recorderRef.current = recorder;

    startRecognition();

    setRecordingState("recording");
    playCue(620);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    recordingTimerRef.current = setInterval(() => {
      setElapsedRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, [finalTranscript, playCue, startRecognition]);

  const togglePauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }

    if (recordingState === "recording") {
      if (recorder.state === "recording") {
        recorder.pause();
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingState("paused");
      playCue(420);
      return;
    }

    if (recordingState === "paused") {
      if (recorder.state === "paused") {
        recorder.resume();
      }
      startRecognition();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setElapsedRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecordingState("recording");
      playCue(560);
    }
  }, [playCue, recordingState, startRecognition]);

  const endInterviewAndRedirect = useCallback(
    async (reason: "manual" | "auto_time_limit") => {
      setIsEnding(true);
      setError(null);

      try {
        const answerVideo = recordingState !== "idle" ? await stopCapture() : chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
        const finalTranscriptText = transcriptText.trim();
        cleanupMedia();

        const formData = new FormData();
        formData.append("reason", reason);
        if (finalTranscriptText) {
          formData.append("transcript", finalTranscriptText);
        }
        if (answerVideo) {
          formData.append("video", answerVideo, `answer-${Date.now()}.webm`);
        }

        const response = await fetch(`/api/interview/session/${sessionId}/end`, {
          method: "POST",
          body: formData,
        });
        await parseApiResponse<Record<string, unknown>>(response);

        router.push(`/report?sessionId=${sessionId}`);
      } catch (endError) {
        setIsEnding(false);
        setError(endError instanceof Error ? endError.message : "Unable to end interview.");
      }
    },
    [cleanupMedia, recordingState, router, sessionId, stopCapture, transcriptText],
  );

  useEffect(() => {
    interviewTimerRef.current = setInterval(() => {
      setElapsedInterviewSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
      }
      if (speechDetectedTimeoutRef.current) {
        clearTimeout(speechDetectedTimeoutRef.current);
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      cleanupMedia();
    };
  }, [cleanupMedia]);

  useEffect(() => {
    if (isFreeUser && elapsedInterviewSeconds >= 5 * 60 && !isEnding) {
      void endInterviewAndRedirect("auto_time_limit");
    }
  }, [elapsedInterviewSeconds, endInterviewAndRedirect, isEnding, isFreeUser]);

  useEffect(() => {
    setRevealedWordCount(0);

    if (!questionWords.length) {
      return;
    }

    let wordIndex = 0;
    const revealInterval = setInterval(() => {
      wordIndex += 1;
      setRevealedWordCount(Math.min(wordIndex, questionWords.length));
      if (wordIndex >= questionWords.length) {
        clearInterval(revealInterval);
      }
    }, 65);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(true);
      const speakingFallback = setTimeout(() => setIsAiSpeaking(false), Math.max(1200, questionWords.length * 100));
      return () => {
        clearTimeout(speakingFallback);
        clearInterval(revealInterval);
      };
    }

    return () => {
      clearInterval(revealInterval);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestion, questionWords]);

  useEffect(() => {
    if (hasShownInitialQuestion || currentQuestion !== greetingQuestion || revealedWordCount < questionWords.length) {
      return;
    }

    const nextQuestionTimeout = setTimeout(() => {
      setCurrentQuestion(initialQuestion);
      setHasShownInitialQuestion(true);
    }, 900);

    return () => clearTimeout(nextQuestionTimeout);
  }, [currentQuestion, greetingQuestion, hasShownInitialQuestion, initialQuestion, questionWords.length, revealedWordCount]);

  async function handleRecordButtonClick() {
    try {
      if (recordingState === "idle") {
        await startCapture();
        return;
      }

      await stopCapture();
      playCue(350);
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : "Unable to access camera/microphone.");
      cleanupMedia();
    }
  }

  async function handleNextQuestion() {
    setError(null);
    setIsSubmitting(true);

    try {
      const answerVideo = recordingState !== "idle" ? await stopCapture() : chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;

      const currentTranscript = transcriptText.trim();
      if (!currentTranscript) {
        throw new Error("Transcript is empty. Record or type your answer before moving to next question.");
      }

      const formData = new FormData();
      formData.append("transcript", currentTranscript);
      if (answerVideo) {
        formData.append("video", answerVideo, `answer-${Date.now()}.webm`);
      }

      const response = await fetch(`/api/interview/session/${sessionId}/answer`, {
        method: "POST",
        body: formData,
      });

      const payload = await parseApiResponse<SubmitAnswerResponse>(response);

      setLastScore(payload.score);
      setLastFeedback(payload.feedback);
      setCurrentQuestion(payload.followUpQuestion);
      setFinalTranscript("");
      setLiveTranscript("");
      setManualTranscript("");
      setIsManualTranscriptDirty(false);
      setElapsedRecordingSeconds(0);
      chunksRef.current = [];
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to submit answer.";
      if (message.toLowerCase().includes("time limit")) {
        await endInterviewAndRedirect("auto_time_limit");
        return;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <motion.div
        animate={{ opacity: [0.2, 0.3, 0.2], scale: [1, 1.02, 1] }}
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        animate={{ opacity: [0.15, 0.25, 0.15], x: [0, -30, 0] }}
        className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl"
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pb-6 pt-4 lg:px-10">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-20 rounded-2xl border border-white/10 bg-slate-900/85 px-6 py-4 backdrop-blur"
          initial={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live AI Interviewer</p>
              <AnimatePresence mode="wait">
                <motion.p
                  className="max-w-4xl text-base leading-relaxed text-slate-100 md:text-lg"
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderedQuestion}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex min-w-40 flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${isAiSpeaking ? "animate-pulse bg-emerald-400" : "bg-slate-600"}`} />
                <span>{isAiSpeaking ? "AI speaking" : "AI ready"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
                  href="/"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid flex-1 gap-6 lg:grid-cols-12"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className="space-y-5 lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>Candidate Camera</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      recordingState === "recording" ? "animate-pulse bg-rose-400" : "bg-slate-600"
                    }`}
                  />
                  <span>{recordingState === "recording" ? "Recording" : recordingState === "paused" ? "Paused" : "Ready"}</span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                <video className="aspect-video w-full object-cover" muted playsInline ref={videoRef} />
                <div className="pointer-events-none absolute inset-0 border-2 border-transparent [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recording Console</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {recordingState === "recording"
                      ? "Recording started. Speak naturally and keep answers concise."
                      : recordingState === "paused"
                        ? "Recording paused. Resume when ready."
                        : "Press mic to start your answer."}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200">
                  Answer Timer: {formatTimer(elapsedRecordingSeconds)}
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center gap-4">
                <button
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  onClick={() => void handleRecordButtonClick()}
                  type="button"
                >
                  {recordingState === "recording" ? <span className="h-7 w-7 rounded-md bg-white" /> : <span className="h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-white" />}
                  {recordingState === "recording" ? (
                    <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-indigo-300/60" />
                  ) : null}
                  {recordingState === "recording" ? (
                    <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full border border-indigo-300/50" />
                  ) : null}
                </button>

                <div className="flex h-8 items-end gap-1">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <span
                      className={`w-1 rounded-full ${isSpeechDetected ? "bg-emerald-300" : "bg-slate-600"} ${
                        recordingState === "recording" ? "animate-pulse" : ""
                      }`}
                      key={`wave-${index}`}
                      style={{
                        height: `${10 + ((index % 5) + 1) * 4}px`,
                        animationDelay: `${index * 70}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    disabled={recordingState === "idle" || isSubmitting || isEnding}
                    onClick={togglePauseRecording}
                    type="button"
                    variant="outline"
                  >
                    {recordingState === "paused" ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    disabled={isSubmitting || isEnding}
                    onClick={() => void endInterviewAndRedirect("manual")}
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  >
                    {isEnding ? "Ending..." : "End Interview"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Transcript</p>
                <div className="text-xs text-slate-400">
                  Session Timer: <span className="font-medium text-slate-200">{formatTimer(elapsedInterviewSeconds)}</span>
                </div>
              </div>
              {isFreeUser ? (
                <p className="mt-2 text-xs text-amber-200/90">Free plan: session auto-ends at 05:00.</p>
              ) : null}
              {!isSpeechSupported ? (
                <p className="mt-2 text-xs text-slate-400">Speech recognition is unavailable on this browser. Type your answer manually.</p>
              ) : null}

              <div className="mt-4 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70 p-3 no-scrollbar">
                {transcriptLines.length ? (
                  transcriptLines.slice(-8).map((line, index) => (
                    <motion.p
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm leading-relaxed text-slate-100"
                      initial={{ opacity: 0, y: 6 }}
                      key={`${line}-${index}`}
                      transition={{ duration: 0.18 }}
                    >
                      {line}
                    </motion.p>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Your response transcript will stream here while you speak.</p>
                )}
              </div>

              <textarea
                className="mt-3 min-h-36 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onChange={(event) => {
                  setManualTranscript(event.target.value);
                  setIsManualTranscriptDirty(true);
                }}
                placeholder="Transcript editor: you can refine or paste your final answer here before submitting."
                value={transcriptText}
              />
            </div>

            {lastScore !== null ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest AI Feedback</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{lastScore}/100</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{lastFeedback}</p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
            ) : null}

            <Button
              className="h-11"
              disabled={isSubmitting || isEnding}
              onClick={() => void handleNextQuestion()}
              type="button"
            >
              {isSubmitting ? "Analyzing Answer..." : "Submit Answer & Next Question"}
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
