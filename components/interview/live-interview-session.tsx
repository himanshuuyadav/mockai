"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

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

export function LiveInterviewSession({ sessionId, initialQuestion, isFreeUser }: LiveInterviewSessionProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<RecognitionType | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>("");
  const [lastScore, setLastScore] = useState<number | null>(null);

  const displayedTranscript = useMemo(() => {
    if (!liveTranscript) {
      return finalTranscript;
    }
    return `${finalTranscript} ${liveTranscript}`.trim();
  }, [finalTranscript, liveTranscript]);

  const cleanupMedia = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: "video/webm" }) : null;
        resolve(blob);
      };
      recorder.stop();
      recorderRef.current = null;
    });
  }, []);

  const endInterviewAndRedirect = useCallback(
    async (reason: "manual" | "auto_time_limit") => {
      setIsEnding(true);
      setError(null);

      try {
        if (isRecording) {
          recognitionRef.current?.stop();
          await stopRecording();
          setIsRecording(false);
        }
        cleanupMedia();

        const response = await fetch(`/api/interview/session/${sessionId}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to end interview.");
        }

        router.push(`/report?sessionId=${sessionId}`);
      } catch (endError) {
        setIsEnding(false);
        setError(endError instanceof Error ? endError.message : "Unable to end interview.");
      }
    },
    [cleanupMedia, isRecording, router, sessionId, stopRecording],
  );

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  useEffect(() => {
    if (isFreeUser && elapsedSeconds >= 5 * 60 && !isEnding) {
      void endInterviewAndRedirect("auto_time_limit");
    }
  }, [elapsedSeconds, endInterviewAndRedirect, isEnding, isFreeUser]);

  async function handleToggleRecording() {
    try {
      if (isRecording) {
        recognitionRef.current?.stop();
        await stopRecording();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        return;
      }

      setError(null);
      chunksRef.current = [];

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

      const SpeechCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SpeechCtor) {
        const recognition = new SpeechCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            if (result.isFinal) {
              finalChunk += `${result[0].transcript} `;
            } else {
              interim += result[0].transcript;
            }
          }

          if (finalChunk) {
            setFinalTranscript((prev) => `${prev} ${finalChunk}`.trim());
          }
          setLiveTranscript(interim.trim());
        };

        recognition.onerror = () => {
          setError("Speech recognition had an issue. You can continue by editing transcript manually.");
        };

        recognition.onend = () => {
          if (isRecording) {
            try {
              recognition.start();
            } catch {
              // ignore restart collisions
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : "Unable to access camera/microphone.");
      cleanupMedia();
      setIsRecording(false);
    }
  }

  async function handleNextQuestion() {
    setError(null);
    setIsSubmitting(true);

    try {
      let answerVideo: Blob | null = null;

      if (isRecording) {
        recognitionRef.current?.stop();
        answerVideo = await stopRecording();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
      } else if (chunksRef.current.length) {
        answerVideo = new Blob(chunksRef.current, { type: "video/webm" });
      }

      const transcriptText = `${finalTranscript} ${liveTranscript}`.trim();
      if (!transcriptText) {
        throw new Error("Transcript is empty. Please answer before moving to next question.");
      }

      const formData = new FormData();
      formData.append("transcript", transcriptText);
      if (answerVideo) {
        formData.append("video", answerVideo, `answer-${Date.now()}.webm`);
      }

      const response = await fetch(`/api/interview/session/${sessionId}/answer`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as SubmitAnswerResponse;
      if (!response.ok) {
        if ((payload.error || "").toLowerCase().includes("time limit")) {
          await endInterviewAndRedirect("auto_time_limit");
          return;
        }
        throw new Error(payload.error || "Failed to generate follow-up question.");
      }

      setLastScore(payload.score);
      setLastFeedback(payload.feedback);
      setCurrentQuestion(payload.followUpQuestion);
      setFinalTranscript("");
      setLiveTranscript("");
      chunksRef.current = [];
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Current AI Question</p>
          <p className="mt-1 text-base font-medium">{currentQuestion}</p>
        </div>
        <div className="rounded-md border bg-slate-50 px-3 py-1 text-sm font-medium">
          Timer: {formatTimer(elapsedSeconds)}
        </div>
      </div>

      {isFreeUser ? (
        <p className="text-xs text-slate-500">Free plan limit: interview auto-ends at 05:00.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Camera Preview</p>
          <video className="aspect-video w-full rounded-md border bg-black object-cover" muted ref={videoRef} />
          <Button onClick={handleToggleRecording} type="button">
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Live Transcript</p>
          <textarea
            className="min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => {
              setFinalTranscript(event.target.value);
              setLiveTranscript("");
            }}
            placeholder="Your spoken answer transcript appears here..."
            value={displayedTranscript}
          />
        </div>
      </div>

      {lastScore !== null ? (
        <div className="rounded-md border bg-slate-50 p-3">
          <p className="text-sm font-medium">Last Answer Score: {lastScore}/100</p>
          <p className="mt-1 text-sm text-slate-700">{lastFeedback}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={isSubmitting || isEnding} onClick={handleNextQuestion} type="button">
          {isSubmitting ? "Generating Follow-up..." : "Next Question"}
        </Button>
        <Button
          disabled={isSubmitting || isEnding}
          onClick={() => void endInterviewAndRedirect("manual")}
          type="button"
          variant="outline"
        >
          {isEnding ? "Ending..." : "End Interview"}
        </Button>
      </div>
    </section>
  );
}
