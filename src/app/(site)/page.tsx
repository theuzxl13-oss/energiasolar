import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { SolutionsSection } from "@/components/sections/solutions";
import { ChargerSimulatorSection, SolarSimulatorSection } from "@/components/sections/simulators-section";
import { EletropostoHighlight } from "@/components/sections/eletroposto-highlight";
import { WhyChooseSection } from "@/components/sections/why-choose";
import { ProcessTimeline } from "@/components/sections/process-timeline";
import { ProjectsPreview } from "@/components/sections/projects-preview";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <SolutionsSection />
      <SolarSimulatorSection />
      <EletropostoHighlight />
      <ChargerSimulatorSection />
      <WhyChooseSection />
      <ProcessTimeline />
      <ProjectsPreview />
      <TestimonialsSection />
      <FaqSection />
      <CtaBanner />
    </>
  );
}
