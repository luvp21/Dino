import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <PixelCard className="text-center max-w-md">
        <div className="text-[48px] mb-4">404</div>
        <h1 className="text-[14px] mb-4">PAGE NOT FOUND</h1>
        <p className="text-[8px] text-muted-foreground mb-6">
          LOOKS LIKE YOU RAN INTO A CACTUS.
          THE PAGE YOU'RE LOOKING FOR DOESN'T EXIST.
        </p>
        <Link to="/">
          <PixelButton>BACK TO GAME</PixelButton>
        </Link>
      </PixelCard>
    </div>
  );
};

export default NotFound;
