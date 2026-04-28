import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary">
            <Brain className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">Career OS</span>
        </Link>
        <p className="text-sm text-muted-foreground">© 2026 Career OS. AI-powered career decisions.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="transition-smooth hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="transition-smooth hover:text-foreground">Terms</Link>
          <Link to="/contact" className="transition-smooth hover:text-foreground">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
