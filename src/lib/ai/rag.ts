// AegisAI StadiumOS — Lightweight RAG Engine
// Implements in-memory keyword matching, score calculation, citation, and grounding helpers.

export interface PlaybookArticle {
  article: string;
  content: string;
  page: number;
  section: string;
}

export interface RagResult {
  article: string;
  content: string;
  page: number;
  section: string;
  score: number;
  citation: string;
}

export const PLAYBOOK_MANUAL_DB: PlaybookArticle[] = [
  {
    article: "Article 4.1: High Crowd Concentration & Gate Bottlenecks",
    content: "When crowd density at any gate exceeds 80% design capacity or queue wait-times exceed 30 minutes, operators must immediately: 1. Push dynamic rerouting alerts to fans within 500 meters via the companion app; 2. Open auxiliary turnstiles and activate overflow queue corrals; 3. Divert incoming intermodal traffic to secondary gates.",
    page: 12,
    section: "4. Crowd Management"
  },
  {
    article: "Article 7.3: Thermal Management & Heat Stress Mitigation",
    content: "At external ambient temperatures exceeding 35°C (95°F) or solar heat-index extremes, the Operations Command must deploy active Volunteer Hydration Squads. Squads must be dispatched directly to solar-exposed seating (Sectors B14-B18, East Concourse). Priority cooling shelters, water-station locations, and wheelchair accessibility guides must be highlighted on stadium navigation boards.",
    page: 24,
    section: "7. Environmental Safety"
  },
  {
    article: "Article 9.2: Smart Grid MEP & Peak Power Shedding",
    content: "Under localized electrical transformer stress or grid voltage instability, operations managers are authorized to trigger MEP Peak Power Shedding. Protocols include: 1. Dimming non-essential concourse architectural lighting by up to 60%; 2. De-energizing peripheral marketing/concession digital screens; 3. Discharging integrated battery backup arrays to support medical center HVAC.",
    page: 31,
    section: "9. Infrastructure & Power"
  },
  {
    article: "Article 12.5: Medical Incident Evacuation & Response Corridors",
    content: "Priority medical emergencies require dispatching a first-aid crew with an target arrival under 3 minutes. Personnel routes must leverage dedicated emergency corridors (e.g., Corridor 4 near Sector B) and high-priority transit elevators (Elevator Orange/Green). Command centers must coordinate with regional 911 dispatch and clear vehicle ingress loops.",
    page: 45,
    section: "12. Medical & Emergency"
  },
  {
    article: "Article 15.1: Regional Transport Disruptions",
    content: "If metropolitan light-rail or regional rail transit experiences delays within 1 hour of match egress, operators must: 1. Coordinate with rideshare platforms to expand geofenced pickup capacity in Zone Silver; 2. Increase loop shuttle frequencies to 5-minute headways; 3. Display delay warnings on stadium screens, prompting fans to remain for post-match entertainment to stagger exit demand.",
    page: 58,
    section: "15. Regional Logistics"
  }
];

export function retrievePlaybookArticles(query: string, limit = 2): RagResult[] {
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  
  const results: RagResult[] = PLAYBOOK_MANUAL_DB.map(art => {
    let score = 0;
    const combinedText = `${art.article} ${art.content} ${art.section}`.toLowerCase();
    
    keywords.forEach((word: string) => {
      if (combinedText.includes(word)) {
        score += 1;
        // Exact article/number matches get extra weight
        const numPart = art.article.match(/\d+\.\d+/);
        if (numPart && query.includes(numPart[0])) {
          score += 3;
        }
      }
    });

    const citation = `[FIFA Stadium Manual 2026, Section ${art.section}, ${art.article}, p. ${art.page}]`;
    return {
      ...art,
      score,
      citation
    };
  });

  // Sort by score (descending), and fallback to order if scores match
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function generateContextBlock(results: RagResult[]): string {
  return results
    .filter(r => r.score > 0)
    .map(r => `Source Reference: ${r.citation}\n"${r.content}"`)
    .join("\n\n");
}
