export interface PromptItem {
  name: string;
  description: string;
  content: string;
  category: string;
}

export const PROMPTS: PromptItem[] = [
  {
    name: 'Code Review',
    category: 'Development',
    description: 'Strakke code review met focus op bugs en verbeteringen',
    content:
      'Review deze code op: 1) bugs en edge cases 2) performance 3) leesbaarheid. Geef korte, actionable feedback. Noem bestand en regel waar relevant.',
  },
  {
    name: 'Refactor Plan',
    category: 'Development',
    description: 'Stap-voor-stap refactor zonder gedrag te breken',
    content:
      'Maak een refactor-plan voor [onderdeel]. Stappen klein houden, per stap: wat veranderen, hoe gedrag hetzelfde blijft, hoe testen. Geen grote big-bang refactor.',
  },
  {
    name: 'PR Description',
    category: 'Development',
    description: 'Van diff naar duidelijke PR-tekst',
    content:
      'Schrijf een PR description op basis van deze changes. Inclusief: wat, waarom, hoe getest. Gebruik bullet points. Tone: professioneel en kort.',
  },
  {
    name: 'Meeting Notes',
    category: 'Productivity',
    description: 'Structuur uit een meeting-transcript',
    content:
      'Vat dit gesprek samen in: 1) Besluiten 2) Actiepunten (met eigenaar) 3) Open vragen. Gebruik korte zinnen. Markdown.',
  },
  {
    name: 'User Story',
    category: 'Product',
    description: 'Van idee naar scherpe user story',
    content:
      'Schrijf een user story voor: [korte beschrijving]. Format: Als [rol] wil ik [doel] zodat [waarde]. Inclusief 2-3 acceptatiecriteria. Een story, geen epics.',
  },
  {
    name: 'Debug Context',
    category: 'Development',
    description: 'Relevante context voor een bugreport',
    content:
      'Ik zie deze fout: [error]. Relevante code/config: [snippet of bestand]. Wat heb ik al geprobeerd: [stappen]. Geef een korte diagnose en mogelijke fix.',
  },
];
