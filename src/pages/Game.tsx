import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// Simple WebAudio sound effects (no external dependency)
function useGameSounds(enabled: boolean) {
  const playTone = (freq: number, duration = 0.12, type: OscillatorType = "sine", volume = 0.03) => {
    if (!enabled || typeof window === "undefined" || !(window as any).AudioContext) return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duration);
  };

  return {
    click: () => playTone(420, 0.08, "triangle"),
    correct: () => {
      playTone(660, 0.08, "sine");
      setTimeout(() => playTone(880, 0.12, "sine"), 90);
    },
    wrong: () => {
      playTone(200, 0.12, "sawtooth");
      setTimeout(() => playTone(160, 0.12, "sawtooth"), 100);
    },
    levelUp: () => {
      playTone(523.25, 0.08, "square");
      setTimeout(() => playTone(659.25, 0.08, "square"), 90);
      setTimeout(() => playTone(783.99, 0.12, "square"), 180);
    },
  };
}

// Types moved to shared data module
import { DIFFICULTY_POINTS, QUESTIONS, type Difficulty, type Question } from "@/data/questions";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function usePageSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    const name = "description";
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", description);
  }, [title, description]);
}

interface ScoreEntry { name: string; score: number; date: string; }
const LB_KEY = "yfit_leaderboard";

function readLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(list: ScoreEntry[]) {
  localStorage.setItem(LB_KEY, JSON.stringify(list));
}

export default function Game() {
  usePageSEO(
    "Health Quest — HIV, PrEP & Reproductive Health Trivia",
    "Health Quest: mixed-topic trivia on HIV self-testing, PrEP, and reproductive health. Pick a difficulty, learn fast, and climb the leaderboard."
  );

  const [playerName, setPlayerName] = useState("");
  
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [soundOn, setSoundOn] = useState(true);
  const sfx = useGameSounds(soundOn);

  const [step, setStep] = useState<"setup" | "playing" | "result">("setup");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const total = questions.length;

  const filtered = useMemo(() => {
    const pool = QUESTIONS.filter(q => q.difficulty === difficulty);
    return shuffle(pool).slice(0, 10);
  }, [difficulty]);

  useEffect(() => {
    if (step === "setup") {
      setQuestions(filtered);
      setCurrentIdx(0);
      setScore(0);
      setSelected(null);
      setRank(null);
    }
  }, [filtered, step]);

  const current = questions[currentIdx];

  const handleStart = () => {
    if (!playerName.trim()) {
      toast({ title: "Enter your name", description: "We’ll use it on the leaderboard." });
      return;
    }
    sfx.levelUp();
    setStep("playing");
  };

  const handleOption = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const isCorrect = index === current.answerIndex;
    if (isCorrect) {
      setScore(prev => prev + DIFFICULTY_POINTS[difficulty]);
      sfx.correct();
      toast({ title: "Correct!", description: current.explanation ?? "Great job!" });
    } else {
      sfx.wrong();
      toast({ title: "Not quite", description: current.explanation ?? "You’ve got this next time." });
    }
  };

  const next = () => {
    sfx.click();
    if (currentIdx + 1 < total) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
    } else {
      // Save to leaderboard
      const entry: ScoreEntry = { name: playerName.trim(), score, date: new Date().toISOString() };
      const lb = readLeaderboard();
      const updated = [...lb, entry].sort((a, b) => b.score - a.score).slice(0, 20);
      writeLeaderboard(updated);
      const newRank = updated.findIndex(e => e === entry) + 1;
      setRank(newRank || null);
      setStep("result");
      sfx.levelUp();
    }
  };

  const restart = () => {
    sfx.click();
    setStep("setup");
  };

  const progressValue = total ? Math.round(((currentIdx) / total) * 100) : 0;

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Health Quest — HIV, PrEP & Reproductive Health Trivia</h1>
          <p className="text-muted-foreground">Learn by playing. Choose your path and test your knowledge.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={soundOn ? "secondary" : "outline"} onClick={() => setSoundOn(v => !v)}>
            {soundOn ? "Sound: On" : "Sound: Off"}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </header>

      {step === "setup" && (
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle>Get Ready</CardTitle>
              <CardDescription>Set your name and difficulty.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Player name</label>
                <Input placeholder="e.g., Ada" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Difficulty</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">10 questions • {DIFFICULTY_POINTS[difficulty]} pts each</span>
                <Button onClick={handleStart}>Start game</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Answer questions to earn points and learn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Mixed questions from HIV self-testing, PrEP, and reproductive health.</p>
              <p>• Select difficulty to adjust challenge and points.</p>
              <p>• Answer 10 questions, then save your score to the local leaderboard.</p>
            </CardContent>
          </Card>
        </section>
      )}

      {step === "playing" && current && (
        <section className="max-w-2xl mx-auto">
          <Card className="hover-scale">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Question {currentIdx + 1} of {total}</CardTitle>
                <span className="text-sm text-muted-foreground">All Topics • {difficulty.toUpperCase()}</span>
              </div>
              <div className="pt-2">
                <Progress value={progressValue} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-medium">{current.text}</p>
              <div className="grid gap-3">
                {current.options.map((opt, i) => {
                  const isPicked = selected === i;
                  const isCorrect = selected !== null && i === current.answerIndex;
                  const isWrong = selected !== null && isPicked && i !== current.answerIndex;
                  return (
                    <Button
                      key={i}
                      variant={isCorrect ? "secondary" : isWrong ? "destructive" : "outline"}
                      className="justify-start"
                      onClick={() => handleOption(i)}
                      disabled={selected !== null}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Score: {score}</span>
                <Button onClick={next}>{currentIdx + 1 < total ? "Next" : "Finish"}</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {step === "result" && (
        <section className="max-w-3xl mx-auto">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle>Great job, {playerName}!</CardTitle>
              <CardDescription>Your final score is {score}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LeaderboardHighlight name={playerName} score={score} rank={rank} />

              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={restart}>Play again</Button>
                <Button asChild>
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <LeaderboardList highlightName={playerName} />
        </section>
      )}
    </main>
  );
}

function LeaderboardHighlight({ name, score, rank }: { name: string; score: number; rank: number | null }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
      <p className="text-sm text-muted-foreground mb-2">Your placement</p>
      <div className="relative mx-auto h-24 w-full max-w-md overflow-hidden">
        {/* Simple rank animation: slide from bottom */}
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="translate-y-8 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]">
            <span className="text-4xl font-bold">#{rank ?? "-"}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm">{name} • {score} pts</p>
    </div>
  );
}

function LeaderboardList({ highlightName }: { highlightName: string }) {
  const list = useMemo(() => readLeaderboard(), []);
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Leaderboard</h2>
      <div className="rounded-lg border overflow-hidden">
        <ul>
          {list.slice(0, 10).map((e, idx) => (
            <li
              key={e.name + e.date}
              className={`flex items-center justify-between px-4 py-3 ${e.name === highlightName ? "bg-accent" : ""}`}
              style={{ transition: "transform 300ms, background 300ms" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm w-6 text-center">{idx + 1}</span>
                <span className="font-medium">{e.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{e.score} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
