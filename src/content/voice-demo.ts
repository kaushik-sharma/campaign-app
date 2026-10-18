/**
 * The guided voice questions and the demo transcripts typed out on screen. Speech recognition
 * isn't available in Expo Go, so the voice flow is a clearly labeled demo; "Type instead" lets
 * people answer in their own words.
 */
export const VOICE_QUESTIONS = [
  { prompt: 'What do you want people to know?', hint: 'The one message you want to spread.' },
  { prompt: 'Who should hear it, and where?', hint: 'Places, ages and interests.' },
  { prompt: 'Why does it matter now?', hint: 'Facts, figures or sources that back it up.' },
  { prompt: 'What should people do after seeing it?', hint: 'One or two simple actions.' },
] as const;

export const DEMO_TRANSCRIPTS: [string, string, string, string] = [
  'Some neighborhoods in Tucson are much hotter than others because they have almost no trees. I want people to know that planting shade trees can cool those streets a lot.',
  'Renters and homeowners in Tucson, mostly adults who care about their neighborhood, gardening and the outdoors.',
  'Summers keep getting hotter. The EPA says shaded surfaces can be 20 to 45 degrees cooler than unshaded ones at their peak.',
  'Ask the city or your utility about free shade-tree programs, and help water new trees on your block in their first summers.',
];
