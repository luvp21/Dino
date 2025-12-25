import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, "../dist/index.html");

let html = fs.readFileSync(indexPath, "utf8");

// Hero section matching LandingPage.tsx structure with SEO improvements
const heroHTML = `
<section class="pu-8 md:pu-12 text-center" aria-label="DinoSprint game introduction">
  <div class="container mx-auto px-4">
    <h1 class="text-[20px] md:text-[28px] font-excon font-bold mb-2">
      Chrome Dino inspired endless runner
    </h1>
    <p class="text-[10px] md:text-[12px] text-muted-foreground max-w-2xl mx-auto">
      Race to the top of the leaderboard and unlock rare skins.
    </p>
  </div>
</section>
`;

// Additional SEO content for better indexing (hidden but crawlable)
const seoContent = `
<noscript>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <article>
      <h2>About DinoSprint</h2>
      <p>DinoSprint is a modern multiplayer version of the classic Chrome Dino game. Compete globally, level up your skills, unlock skins, and climb the leaderboard in this free-to-play endless runner game. Experience the nostalgic Chrome Dino gameplay with enhanced multiplayer features, real-time leaderboards, and customizable pixel art skins.</p>

      <h3>Game Features</h3>
      <ul>
        <li>Classic Chrome Dino gameplay with multiplayer enhancements</li>
        <li>Global leaderboard rankings and competitive play</li>
        <li>Unlockable skins and customization options</li>
        <li>Free to play - skill-based gameplay with no pay-to-win mechanics</li>
        <li>Cross-platform desktop support</li>
      </ul>

      <h3>How to Play</h3>
      <p>Use the SPACE bar or UP arrow key to jump over obstacles, and DOWN arrow to duck under low obstacles. The game gets faster as you progress. Compete for the highest score and climb the global leaderboard.</p>

      <h3>Get Started</h3>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/auth">Login or Sign Up</a> - Save your progress, earn coins, and unlock exclusive skins</li>
          <li><a href="/leaderboard">View Leaderboard</a> - See top players and compete for the highest scores</li>
          <li><a href="/shop">Visit Shop</a> - Unlock new skins and customize your dino</li>
          <li><a href="/lobby">Multiplayer Mode</a> - Compete against other players in real-time races</li>
        </ul>
      </nav>

      <h3>Frequently Asked Questions</h3>
      <dl>
        <dt><strong>How do I start playing DinoSprint?</strong></dt>
        <dd>Simply click the PLAY button in the navigation menu. The game will start immediately. Use SPACE or UP arrow to jump and DOWN arrow to duck.</dd>

        <dt><strong>Is there a multiplayer mode?</strong></dt>
        <dd>Yes! Click on MULTI in the navigation to access multiplayer lobbies. You can compete against other players in real-time races.</dd>

        <dt><strong>Do I need to create an account?</strong></dt>
        <dd>No, you can play as a guest. However, creating an account allows you to save your progress, compete on leaderboards, and unlock skins permanently.</dd>

        <dt><strong>How do I unlock new skins?</strong></dt>
        <dd>Play games to earn coins, then visit the SHOP to purchase new skins. Some skins may also be unlocked by reaching certain milestones.</dd>

        <dt><strong>Are my scores saved?</strong></dt>
        <dd>If you're logged in, all your scores are saved permanently. Guest scores are only saved for your current session.</dd>

        <dt><strong>Can I play on mobile?</strong></dt>
        <dd>DinoSprint is optimized for desktop and laptop computers with keyboards. Mobile devices can view stats and leaderboards, but gameplay requires a keyboard.</dd>

        <dt><strong>Is the game free to play?</strong></dt>
        <dd>Yes, DinoSprint is completely free to play. All features, including multiplayer and skins, are accessible through gameplay.</dd>
      </dl>
    </article>
  </div>
</noscript>
`;

// FAQ Structured Data for better SEO
const faqStructuredData = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I start playing DinoSprint?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Simply click the PLAY button in the navigation menu. The game will start immediately. Use SPACE or UP arrow to jump and DOWN arrow to duck."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a multiplayer mode?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Click on MULTI in the navigation to access multiplayer lobbies. You can compete against other players in real-time races."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to create an account?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, you can play as a guest. However, creating an account allows you to save your progress, compete on leaderboards, and unlock skins permanently."
      }
    },
    {
      "@type": "Question",
      "name": "How do I unlock new skins?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Play games to earn coins, then visit the SHOP to purchase new skins. Some skins may also be unlocked by reaching certain milestones."
      }
    },
    {
      "@type": "Question",
      "name": "Are my scores saved?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you're logged in, all your scores are saved permanently. Guest scores are only saved for your current session."
      }
    },
    {
      "@type": "Question",
      "name": "Can I play on mobile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DinoSprint is optimized for desktop and laptop computers with keyboards. Mobile devices can view stats and leaderboards, but gameplay requires a keyboard."
      }
    },
    {
      "@type": "Question",
      "name": "How does the leaderboard work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The leaderboard tracks your best distance scores. There are both weekly and all-time rankings. Logged-in players appear on the global leaderboard."
      }
    },
    {
      "@type": "Question",
      "name": "Is the game free to play?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, DinoSprint is completely free to play. All features, including multiplayer and skins, are accessible through gameplay."
      }
    }
  ]
}
</script>
`;

// WebSite Structured Data for better search visibility
const websiteStructuredData = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DinoSprint",
  "alternateName": "Dino Sprint",
  "url": "https://dinosprint.vercel.app",
  "description": "Play DinoSprint, a modern multiplayer version of the classic Chrome Dino game. Compete globally, level up skills, unlock skins and climb the leaderboard.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://dinosprint.vercel.app/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "DinoSprint",
    "url": "https://dinosprint.vercel.app"
  }
}
</script>
`;

// BreadcrumbList Structured Data
const breadcrumbStructuredData = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://dinosprint.vercel.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Leaderboard",
      "item": "https://dinosprint.vercel.app/leaderboard"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Shop",
      "item": "https://dinosprint.vercel.app/shop"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Multiplayer",
      "item": "https://dinosprint.vercel.app/lobby"
    }
  ]
}
</script>
`;

// Inject structured data before closing head tag
if (html.includes('</head>')) {
  html = html.replace(
    '</head>',
    `${faqStructuredData}${websiteStructuredData}${breadcrumbStructuredData}</head>`
  );
}

// Replace empty React root content safely
html = html.replace(
  /<div id="root"\s*><\/div>/,
  `<div id="root">${heroHTML}${seoContent}</div>`
);

fs.writeFileSync(indexPath, html, "utf8");

console.log("⭐ Static hero markup and structured data injected successfully with SEO improvements!");
