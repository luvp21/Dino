import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: 'How do I start playing DinoSprint?',
      answer: 'Simply click the PLAY button in the navigation menu. The game will start immediately. Use SPACE or UP arrow to jump and DOWN arrow to duck.',
    },
    {
      question: 'Is there a multiplayer mode?',
      answer: 'Yes! Click on MULTI in the navigation to access multiplayer lobbies. You can compete against other players in real-time races.',
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No, you can play as a guest. However, creating an account allows you to save your progress, compete on leaderboards, and unlock skins permanently.',
    },
    {
      question: 'How do I unlock new skins?',
      answer: 'Play games to earn coins, then visit the SHOP to purchase new skins. Some skins may also be unlocked by reaching certain milestones.',
    },
    {
      question: 'Are my scores saved?',
      answer: 'If you\'re logged in, all your scores are saved permanently. Guest scores are only saved for your current session.',
    },
    {
      question: 'Can I play on mobile?',
      answer: 'DinoSprint is optimized for desktop and laptop computers with keyboards. Mobile devices can view stats and leaderboards, but gameplay requires a keyboard.',
    },
    {
      question: 'How does the leaderboard work?',
      answer: 'The leaderboard tracks your best distance scores. There are both weekly and all-time rankings. Logged-in players appear on the global leaderboard.',
    },
    {
      question: 'Is the game free to play?',
      answer: 'Yes, DinoSprint is completely free to play. All features, including multiplayer and skins, are accessible through gameplay.',
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-[22px] md:text-4xl font-pixel font-bold text-center mb-8 md:mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="pixel-card bg-card px-4"
            >
              <AccordionTrigger className="text-[9px] md:text-[14px] font-pixel hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[7px] md:text-[12px] text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

