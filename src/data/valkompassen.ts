export type VPartyId = 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP'

export const PARTY_IDS: VPartyId[] = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']

export const PARTY_NAMES: Record<VPartyId, string> = {
  S:  'Socialdemokraterna',
  M:  'Moderaterna',
  SD: 'Sverigedemokraterna',
  C:  'Centerpartiet',
  V:  'Vänsterpartiet',
  KD: 'Kristdemokraterna',
  L:  'Liberalerna',
  MP: 'Miljöpartiet',
}

export interface ValkompasQuestion {
  id: number
  area: string
  text: string
  positions: Record<VPartyId, number>
}

export const QUESTIONS: ValkompasQuestion[] = [
  {
    id: 1, area: 'Skatter & ekonomi',
    text: 'Inkomstskatten för höginkomsttagare bör sänkas.',
    positions: { S: -2, M: 2, SD: 0, C: 2, V: -2, KD: 1, L: 2, MP: -1 },
  },
  {
    id: 2, area: 'Skatter & ekonomi',
    text: 'Det bör finnas ett tak på vinstuttag i välfärdsföretag inom vård, skola och omsorg.',
    positions: { S: 2, M: -2, SD: 1, C: -1, V: 2, KD: -1, L: -2, MP: 2 },
  },
  {
    id: 3, area: 'Skatter & ekonomi',
    text: 'RUT- och ROT-avdragen bör behållas eller utökas.',
    positions: { S: -1, M: 2, SD: 1, C: 2, V: -2, KD: 1, L: 2, MP: -1 },
  },
  {
    id: 4, area: 'Migration & integration',
    text: 'Sverige bör ta emot färre asylsökande än idag.',
    positions: { S: 0, M: 1, SD: 2, C: -1, V: -2, KD: 1, L: -1, MP: -2 },
  },
  {
    id: 5, area: 'Migration & integration',
    text: 'Det bör ställas tydligare krav på språk och arbete för att få permanent uppehållstillstånd.',
    positions: { S: 1, M: 2, SD: 2, C: 1, V: -2, KD: 2, L: 1, MP: -1 },
  },
  {
    id: 6, area: 'Migration & integration',
    text: 'Nyanlända bör ha rätt till samma bidragsnivåer som övriga invånare direkt från ankomst.',
    positions: { S: 0, M: -1, SD: -2, C: -1, V: 2, KD: -1, L: 0, MP: 1 },
  },
  {
    id: 7, area: 'Klimat & energi',
    text: 'Sverige bör bygga ut ny kärnkraft.',
    positions: { S: 1, M: 2, SD: 2, C: 1, V: -1, KD: 2, L: 2, MP: -2 },
  },
  {
    id: 8, area: 'Klimat & energi',
    text: 'Bensinskatten bör höjas för att minska utsläppen från transporter.',
    positions: { S: 0, M: -1, SD: -2, C: -1, V: 2, KD: -1, L: 0, MP: 2 },
  },
  {
    id: 9, area: 'Klimat & energi',
    text: 'Klimatmålen bör prioriteras även om det påverkar sysselsättningen negativt på kort sikt.',
    positions: { S: 0, M: -1, SD: -2, C: 0, V: 2, KD: 0, L: 1, MP: 2 },
  },
  {
    id: 10, area: 'Välfärd & skola',
    text: 'Privata aktörer bör kunna driva skolor med offentlig finansiering.',
    positions: { S: -1, M: 2, SD: 0, C: 2, V: -2, KD: 2, L: 2, MP: -1 },
  },
  {
    id: 11, area: 'Välfärd & skola',
    text: 'Skolor i socioekonomiskt svaga områden bör få mer resurser än andra skolor.',
    positions: { S: 2, M: 0, SD: 1, C: 1, V: 2, KD: 1, L: 1, MP: 2 },
  },
  {
    id: 12, area: 'Välfärd & skola',
    text: 'Sjukvården bör i högre grad drivas i offentlig regi utan privata utförare.',
    positions: { S: 1, M: -2, SD: 1, C: -1, V: 2, KD: -1, L: -2, MP: 1 },
  },
  {
    id: 13, area: 'Kriminalitet & rättsväsende',
    text: 'Minimistraffen för grova brott bör höjas kraftigt.',
    positions: { S: 1, M: 2, SD: 2, C: 0, V: -1, KD: 2, L: 1, MP: -1 },
  },
  {
    id: 14, area: 'Kriminalitet & rättsväsende',
    text: 'Polisen bör få utökade möjligheter till övervakning för att bekämpa grov brottslighet.',
    positions: { S: 1, M: 2, SD: 2, C: 0, V: -2, KD: 1, L: 0, MP: -1 },
  },
  {
    id: 15, area: 'Kriminalitet & rättsväsende',
    text: 'Unga lagöverträdare bör i första hand hanteras av socialtjänsten snarare än rättsväsendet.',
    positions: { S: 1, M: -1, SD: -2, C: 1, V: 2, KD: 0, L: 0, MP: 2 },
  },
  {
    id: 16, area: 'Arbetsmarknad',
    text: 'Det bör bli enklare för arbetsgivare att säga upp personal (förändra LAS).',
    positions: { S: -1, M: 2, SD: 0, C: 2, V: -2, KD: 1, L: 2, MP: -1 },
  },
  {
    id: 17, area: 'Arbetsmarknad',
    text: 'Ersättningsnivån och täckningen i a-kassan bör utökas.',
    positions: { S: 2, M: -1, SD: 1, C: 0, V: 2, KD: 0, L: 0, MP: 1 },
  },
  {
    id: 18, area: 'Försvar',
    text: 'Sverige bör öka försvarsanslagen till minst 2 % av BNP.',
    positions: { S: 2, M: 2, SD: 2, C: 2, V: 0, KD: 2, L: 2, MP: 0 },
  },
  {
    id: 19, area: 'Bostäder',
    text: 'Hyresregleringen bör avskaffas och ersättas med marknadshyror.',
    positions: { S: -2, M: 1, SD: -1, C: 2, V: -2, KD: 0, L: 2, MP: -1 },
  },
  {
    id: 20, area: 'Bostäder',
    text: 'Staten bör öka investeringsstödet till byggande av hyresrätter.',
    positions: { S: 2, M: -1, SD: 1, C: 0, V: 2, KD: 0, L: -1, MP: 2 },
  },
]

export function computeResults(answers: Record<number, number>) {
  return PARTY_IDS.map(partyId => {
    const totalDist = QUESTIONS.reduce((acc, q) => {
      const user = answers[q.id] ?? 0
      return acc + Math.abs(user - q.positions[partyId])
    }, 0)
    const maxPossible = QUESTIONS.length * 4
    const similarity = Math.round((1 - totalDist / maxPossible) * 100)
    return { partyId, similarity }
  }).sort((a, b) => b.similarity - a.similarity)
}
