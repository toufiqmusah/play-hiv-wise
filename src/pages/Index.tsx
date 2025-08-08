import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  useEffect(() => {
    document.title = "Play HIV & PrEP Trivia | Learn While You Play";
    const name = "description";
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", "Interactive trivia on HIV self-testing, PrEP, and reproductive health. Choose difficulty, earn points, and climb the leaderboard.");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="text-center px-6">
        <h1 className="text-4xl font-bold mb-4">Learn HIV & Reproductive Health Through Play</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join the yFit ideathon challenge experience: a fast, fun trivia game to boost awareness of HIV self-testing,
          PrEP, and reproductive health.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/game">Start Trivia</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="#about" className="story-link">Learn More</a>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
