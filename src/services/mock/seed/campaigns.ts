import type { CampaignStatus } from '@/domain/lifecycle';
import type {
  AdCreative,
  AudienceSettings,
  Campaign,
  CategoryId,
  Creator,
  StatusEvent,
} from '@/domain/types';

import { campaignCovers } from './images';
import { stories } from './stories';

/**
 * Seed campaigns: demo data. Figures are fixed so the same campaign shows the same numbers on
 * every screen. Dates are relative to app launch so "days left" stays believable.
 */

const DAY = 86_400_000;
const launch = Date.now();

type Seed = {
  id: string;
  title: string;
  summary: string;
  category: CategoryId;
  creator: Creator;
  status: CampaignStatus;
  goal: number;
  raised: number;
  backers: number;
  /** Days since the campaign opened for funding. */
  openedDaysAgo: number;
  fundingWindowDays: number;
  durationDays: number;
  featured?: boolean;
  trend: number;
  audience: AudienceSettings;
  ad: AdCreative;
  suggestedActions: string[];
};

const seeds: Seed[] = [
  {
    id: 'riverside-wetlands',
    title: 'Keep the Riverside Wetlands Wild',
    summary:
      'A proposed parking expansion would pave over the last wetland on Mill Creek. Most residents don’t know the comment period closes next month.',
    category: 'environment',
    creator: {
      id: 'c-mill-creek',
      name: 'Friends of Mill Creek',
      type: 'community-group',
      location: 'Portland, OR',
      bio: 'Volunteer neighbours who have restored and monitored Mill Creek since 2011.',
    },
    status: 'funding',
    goal: 12_000,
    raised: 8_640,
    backers: 214,
    openedDaysAgo: 26,
    fundingWindowDays: 30,
    durationDays: 21,
    featured: true,
    trend: 92,
    audience: {
      locations: ['Portland, OR', 'Beaverton, OR', 'Gresham, OR'],
      ageRange: [18, 65],
      interests: ['Outdoors', 'Local news', 'Conservation'],
      channels: ['social-feed', 'stories', 'news-sites'],
      budgetSplit: { 'social-feed': 50, stories: 30, 'news-sites': 20 },
    },
    ad: {
      headline: 'Mill Creek’s last wetland needs your voice',
      description: 'The public comment period closes soon. See what’s at stake in 2 minutes.',
      callToAction: 'Read the story',
    },
    suggestedActions: [
      'Submit a public comment before the deadline',
      'Visit the wetland trail on a weekend walk',
      'Share the story with a neighbour',
    ],
  },
  {
    id: 'stroke-fast',
    title: 'Know the Signs of Stroke: Act FAST',
    summary:
      'Every minute counts during a stroke. Four simple signs, Face, Arms, Speech, Time, help bystanders call for help sooner.',
    category: 'health',
    creator: {
      id: 'c-northside-health',
      name: 'Northside Health Collective',
      type: 'nonprofit',
      location: 'Chicago, IL',
      bio: 'A community health nonprofit running free screenings across Chicago’s North Side.',
    },
    status: 'funding',
    goal: 20_000,
    raised: 15_480,
    backers: 402,
    openedDaysAgo: 18,
    fundingWindowDays: 35,
    durationDays: 30,
    featured: true,
    trend: 88,
    audience: {
      locations: ['Chicago, IL', 'Evanston, IL', 'Skokie, IL'],
      ageRange: [35, 75],
      interests: ['Health & wellness', 'Caregiving', 'Family'],
      channels: ['social-feed', 'video', 'search'],
      budgetSplit: { 'social-feed': 45, video: 35, search: 20 },
    },
    ad: {
      headline: 'Could you spot a stroke in 10 seconds?',
      description: 'Learn the four signs that help someone get treatment faster.',
      callToAction: 'Learn the signs',
    },
    suggestedActions: [
      'Learn the four FAST signs',
      'Save your local emergency number',
      'Teach the signs to an older relative',
    ],
  },
  {
    id: 'night-sky',
    title: 'The Night Sky Is Disappearing',
    summary:
      'Light pollution is erasing the stars from our cities. Simple changes to outdoor lighting can bring them back and save energy.',
    category: 'science',
    creator: {
      id: 'c-priya-raman',
      name: 'Dr. Priya Raman',
      type: 'individual',
      location: 'Tucson, AZ',
      bio: 'Astronomer and science communicator who runs free stargazing nights.',
    },
    status: 'funding',
    goal: 6_000,
    raised: 4_620,
    backers: 171,
    openedDaysAgo: 6,
    fundingWindowDays: 30,
    durationDays: 14,
    trend: 71,
    audience: {
      locations: ['Arizona', 'New Mexico'],
      ageRange: [18, 54],
      interests: ['Astronomy', 'Science', 'Photography'],
      channels: ['social-feed', 'video'],
      budgetSplit: { 'social-feed': 60, video: 40 },
    },
    ad: {
      headline: 'When did you last see the Milky Way?',
      description: 'Shielded outdoor lights bring back the stars and cut energy waste.',
      callToAction: 'See how',
    },
    suggestedActions: [
      'Switch outdoor bulbs to warm, shielded fixtures',
      'Join a local dark-sky night',
    ],
  },
  {
    id: 'free-tutoring',
    title: 'Free Tutoring Exists. Families Don’t Know.',
    summary:
      'Thousands of free tutoring hours go unused every term because families never hear about them. This campaign puts the sign-up link in front of parents.',
    category: 'education',
    creator: {
      id: 'c-open-door',
      name: 'Open Door Learning',
      type: 'nonprofit',
      location: 'Atlanta, GA',
      bio: 'Connects K–12 students with trained volunteer tutors at no cost.',
    },
    status: 'promoting',
    goal: 15_000,
    raised: 15_620,
    backers: 389,
    openedDaysAgo: 44,
    fundingWindowDays: 30,
    durationDays: 30,
    trend: 76,
    audience: {
      locations: ['Atlanta, GA', 'Decatur, GA'],
      ageRange: [25, 54],
      interests: ['Parenting', 'Education', 'Local news'],
      channels: ['social-feed', 'search', 'stories'],
      budgetSplit: { 'social-feed': 50, search: 30, stories: 20 },
    },
    ad: {
      headline: 'Free one-on-one tutoring for your child',
      description: 'Trained volunteer tutors, online or in person. No cost, ever.',
      callToAction: 'Find a tutor',
    },
    suggestedActions: ['Share the sign-up link with your school’s parent group'],
  },
  {
    id: 'transit-plan-comment',
    title: 'Public Comment Is Open on the Bus Network Plan',
    summary:
      'The city is redrawing every bus route. Riders who depend on buses most are the least likely to know they can weigh in.',
    category: 'public-policy',
    creator: {
      id: 'c-better-bus',
      name: 'Better Bus Coalition',
      type: 'community-group',
      location: 'Boston, MA',
      bio: 'Riders organising for frequent, reliable, accessible buses.',
    },
    status: 'funding',
    goal: 8_000,
    raised: 7_120,
    backers: 196,
    openedDaysAgo: 27,
    fundingWindowDays: 30,
    durationDays: 14,
    featured: true,
    trend: 84,
    audience: {
      locations: ['Boston, MA', 'Cambridge, MA', 'Somerville, MA'],
      ageRange: [18, 75],
      interests: ['Public transit', 'Local government', 'Commuting'],
      channels: ['social-feed', 'stories', 'news-sites'],
      budgetSplit: { 'social-feed': 40, stories: 35, 'news-sites': 25 },
    },
    ad: {
      headline: 'Your bus route might change. Have your say.',
      description: 'The comment period is open now. It takes about five minutes.',
      callToAction: 'Comment now',
    },
    suggestedActions: ['Leave a comment on your route', 'Attend the virtual town hall'],
  },
  {
    id: 'four-day-week',
    title: 'What a Four-Day Week Did for Small Towns',
    summary:
      'Three rural employers tried a 32-hour week for a year. Their results on hiring, output and family time surprised even the skeptics.',
    category: 'economic-policy',
    creator: {
      id: 'c-prairie-lab',
      name: 'Prairie Policy Lab',
      type: 'organization',
      location: 'Lincoln, NE',
      bio: 'Independent research on work and wages in rural America.',
    },
    status: 'funding',
    goal: 18_000,
    raised: 5_940,
    backers: 141,
    openedDaysAgo: 9,
    fundingWindowDays: 45,
    durationDays: 30,
    trend: 67,
    audience: {
      locations: ['Nebraska', 'Kansas', 'Iowa'],
      ageRange: [25, 64],
      interests: ['Small business', 'Economics', 'Careers'],
      channels: ['social-feed', 'news-sites'],
      budgetSplit: { 'social-feed': 55, 'news-sites': 45 },
    },
    ad: {
      headline: 'A year of four-day weeks, by the numbers',
      description: 'What happened to output, hiring and turnover in three rural workplaces.',
      callToAction: 'See the results',
    },
    suggestedActions: ['Read the full study', 'Share it with your employer'],
  },
  {
    id: 'local-pantry',
    title: 'Every Neighbor Fed: Find Your Local Pantry',
    summary:
      'Many families who qualify for free food never visit a pantry, often because they don’t know one is nearby. This campaign mapped every pantry on the East Side.',
    category: 'community',
    creator: {
      id: 'c-eastside-aid',
      name: 'Eastside Mutual Aid',
      type: 'community-group',
      location: 'Detroit, MI',
      bio: 'Neighbours helping neighbours with food, rides and repairs.',
    },
    status: 'completed',
    goal: 5_000,
    raised: 5_410,
    backers: 233,
    openedDaysAgo: 96,
    fundingWindowDays: 30,
    durationDays: 30,
    trend: 58,
    audience: {
      locations: ['Detroit, MI'],
      ageRange: [18, 75],
      interests: ['Family', 'Local news', 'Community'],
      channels: ['social-feed', 'search'],
      budgetSplit: { 'social-feed': 60, search: 40 },
    },
    ad: {
      headline: 'There’s a free food pantry near you',
      description: 'No paperwork at most locations. Find hours and directions.',
      callToAction: 'Find a pantry',
    },
    suggestedActions: ['Find your nearest pantry', 'Volunteer one shift'],
  },
  {
    id: 'main-street-murals',
    title: 'The Stories Behind Main Street’s Murals',
    summary:
      'Twelve murals, twelve local artists, and the neighbourhood histories they paint. A short video series to bring visitors back downtown.',
    category: 'arts-culture',
    creator: {
      id: 'c-lena-ortiz',
      name: 'Lena Ortiz',
      type: 'influencer',
      location: 'San Antonio, TX',
      bio: 'Muralist and video creator documenting public art across Texas.',
    },
    status: 'funding',
    goal: 4_000,
    raised: 1_280,
    backers: 64,
    openedDaysAgo: 4,
    fundingWindowDays: 30,
    durationDays: 14,
    trend: 63,
    audience: {
      locations: ['San Antonio, TX', 'Austin, TX'],
      ageRange: [18, 44],
      interests: ['Art', 'Travel', 'Local culture'],
      channels: ['stories', 'video', 'social-feed'],
      budgetSplit: { stories: 40, video: 40, 'social-feed': 20 },
    },
    ad: {
      headline: 'Twelve murals. Twelve stories.',
      description: 'Meet the artists who painted Main Street.',
      callToAction: 'Watch the series',
    },
    suggestedActions: ['Take the self-guided mural walk', 'Tag a friend who loves street art'],
  },
  {
    id: 'buy-local-winter',
    title: 'Buy Local This Winter: Small Shops Need You',
    summary:
      'Independent shops depend on the holiday season more than any other time of year. A reminder that the gift you need is probably on your own street.',
    category: 'business',
    creator: {
      id: 'c-downtown-merchants',
      name: 'Downtown Merchants Association',
      type: 'business',
      location: 'Burlington, VT',
      bio: 'Sixty-two independent shops, cafés and studios in downtown Burlington.',
    },
    status: 'goal-reached',
    goal: 10_000,
    raised: 10_350,
    backers: 287,
    openedDaysAgo: 31,
    fundingWindowDays: 30,
    durationDays: 45,
    trend: 74,
    audience: {
      locations: ['Burlington, VT', 'Chittenden County, VT'],
      ageRange: [25, 70],
      interests: ['Shopping', 'Local news', 'Food & drink'],
      channels: ['social-feed', 'stories', 'search'],
      budgetSplit: { 'social-feed': 45, stories: 30, search: 25 },
    },
    ad: {
      headline: 'The best gifts are down the street',
      description: 'Sixty-two independent shops, one walkable downtown.',
      callToAction: 'Browse the shops',
    },
    suggestedActions: ['Do one gift shop locally this season'],
  },
  {
    id: 'microchip-pets',
    title: 'Lost Pets Get Home Faster With Microchips',
    summary:
      'Microchipped dogs are more than twice as likely to be returned home. Many owners never register the chip, so it can’t help.',
    category: 'other',
    creator: {
      id: 'c-second-chance',
      name: 'Second Chance Animal Rescue',
      type: 'nonprofit',
      location: 'Denver, CO',
      bio: 'Rescue, rehabilitation and adoption for dogs and cats since 2008.',
    },
    status: 'funding',
    goal: 3_500,
    raised: 2_870,
    backers: 158,
    openedDaysAgo: 25,
    fundingWindowDays: 30,
    durationDays: 14,
    trend: 69,
    audience: {
      locations: ['Denver, CO', 'Aurora, CO', 'Boulder, CO'],
      ageRange: [18, 65],
      interests: ['Pets', 'Animal welfare'],
      channels: ['social-feed', 'stories'],
      budgetSplit: { 'social-feed': 55, stories: 45 },
    },
    ad: {
      headline: 'Is your pet’s microchip registered?',
      description: 'An unregistered chip can’t bring them home. It takes two minutes to check.',
      callToAction: 'Check now',
    },
    suggestedActions: ['Check your pet’s chip registration', 'Update your phone number'],
  },
  {
    id: 'heat-check-elders',
    title: 'Heat Waves Kill Quietly. Check on Your Elders.',
    summary:
      'Heat is one of the deadliest kinds of weather, and older people living alone are most at risk. A two-minute phone call during a heat advisory can help.',
    category: 'environment',
    creator: {
      id: 'c-cool-blocks',
      name: 'Cool Blocks Initiative',
      type: 'organization',
      location: 'Phoenix, AZ',
      bio: 'Block-by-block heat resilience programs in the Southwest.',
    },
    status: 'promoting',
    goal: 25_000,
    raised: 26_100,
    backers: 612,
    openedDaysAgo: 40,
    fundingWindowDays: 30,
    durationDays: 30,
    trend: 95,
    audience: {
      locations: ['Phoenix, AZ', 'Las Vegas, NV', 'Tucson, AZ'],
      ageRange: [25, 64],
      interests: ['Family', 'Caregiving', 'Weather'],
      channels: ['social-feed', 'video', 'news-sites'],
      budgetSplit: { 'social-feed': 40, video: 30, 'news-sites': 30 },
    },
    ad: {
      headline: 'Heat advisory today? Make one call.',
      description: 'Older neighbours living alone are most at risk. A check-in helps.',
      callToAction: 'What to ask',
    },
    suggestedActions: ['Set a heat-advisory reminder', 'Call an older neighbour today'],
  },
  {
    id: 'teen-dinner-talk',
    title: 'Talk About Teen Mental Health at Dinner',
    summary:
      'Teens say they want parents to ask, but don’t know how to start. Five conversation openers, tested with real families.',
    category: 'health',
    creator: {
      id: 'c-sam-okafor',
      name: 'Sam Okafor',
      type: 'influencer',
      location: 'Minneapolis, MN',
      bio: 'Family therapist and creator sharing practical parenting conversations.',
    },
    status: 'funding',
    goal: 9_000,
    raised: 6_210,
    backers: 301,
    openedDaysAgo: 24,
    fundingWindowDays: 30,
    durationDays: 21,
    featured: true,
    trend: 90,
    audience: {
      locations: ['United States'],
      ageRange: [30, 55],
      interests: ['Parenting', 'Mental health', 'Family'],
      channels: ['video', 'social-feed', 'stories'],
      budgetSplit: { video: 45, 'social-feed': 35, stories: 20 },
    },
    ad: {
      headline: '“How was school?” isn’t working. Try this.',
      description: 'Five openers that get teens talking, tested with real families.',
      callToAction: 'Get the openers',
    },
    suggestedActions: ['Try one opener this week', 'Save a crisis line number'],
  },
  {
    id: 'bees-need-weeds',
    title: 'Bees Need Weeds: Let Your Lawn Grow',
    summary:
      'In a Massachusetts study, lawns mowed every two weeks had more bees than lawns mowed weekly. Less work, more pollinators.',
    category: 'science',
    creator: {
      id: 'c-pollinator-project',
      name: 'The Pollinator Project',
      type: 'nonprofit',
      location: 'Madison, WI',
      bio: 'Researchers and gardeners protecting native pollinators.',
    },
    status: 'completed',
    goal: 7_500,
    raised: 8_020,
    backers: 344,
    openedDaysAgo: 120,
    fundingWindowDays: 30,
    durationDays: 30,
    trend: 61,
    audience: {
      locations: ['Wisconsin', 'Minnesota', 'Illinois'],
      ageRange: [25, 70],
      interests: ['Gardening', 'Nature', 'Home'],
      channels: ['social-feed', 'search'],
      budgetSplit: { 'social-feed': 65, search: 35 },
    },
    ad: {
      headline: 'Mow less. Help the bees.',
      description: 'Why a slightly wilder lawn makes a big difference for pollinators.',
      callToAction: 'Learn more',
    },
    suggestedActions: ['Mow every two weeks this summer', 'Leave clover and dandelions to flower'],
  },
  {
    id: 'money-before-18',
    title: 'Financial Basics Before 18',
    summary:
      'Most teens leave school without learning how interest, credit or payslips work. A free six-lesson course any family can use.',
    category: 'education',
    creator: {
      id: 'c-money-smart',
      name: 'Money Smart Youth',
      type: 'nonprofit',
      location: 'Columbus, OH',
      bio: 'Free personal finance lessons for teens and their families.',
    },
    status: 'funding',
    goal: 14_000,
    raised: 3_920,
    backers: 98,
    openedDaysAgo: 3,
    fundingWindowDays: 40,
    durationDays: 30,
    trend: 55,
    audience: {
      locations: ['Ohio', 'Indiana', 'Michigan'],
      ageRange: [35, 55],
      interests: ['Parenting', 'Personal finance', 'Education'],
      channels: ['social-feed', 'video', 'search'],
      budgetSplit: { 'social-feed': 40, video: 35, search: 25 },
    },
    ad: {
      headline: 'Six lessons every teen should get before 18',
      description: 'Interest, credit and payslips, explained simply. Free for families.',
      callToAction: 'Start lesson one',
    },
    suggestedActions: ['Do lesson one together', 'Share with your school'],
  },
  {
    id: 'lead-pipes',
    title: 'Lead Pipes Are Still Here. Is Yours?',
    summary:
      'Millions of homes still get water through lead service lines. A free lookup tool shows whether yours is one of them.',
    category: 'public-policy',
    creator: {
      id: 'c-clean-water-watch',
      name: 'Clean Water Watch',
      type: 'organization',
      location: 'Pittsburgh, PA',
      bio: 'Water-quality advocates helping residents understand their tap water.',
    },
    status: 'distribution-prep',
    goal: 16_000,
    raised: 16_480,
    backers: 455,
    openedDaysAgo: 33,
    fundingWindowDays: 30,
    durationDays: 30,
    trend: 80,
    audience: {
      locations: ['Pittsburgh, PA', 'Allegheny County, PA'],
      ageRange: [25, 75],
      interests: ['Home', 'Health', 'Local news'],
      channels: ['social-feed', 'search', 'news-sites'],
      budgetSplit: { 'social-feed': 40, search: 35, 'news-sites': 25 },
    },
    ad: {
      headline: 'Does lead pipe carry your tap water?',
      description: 'Enter your address to check the free city lookup.',
      callToAction: 'Check my address',
    },
    suggestedActions: ['Look up your service line', 'Request a free water test'],
  },
  {
    id: 'neighborhood-cleanup',
    title: 'Join the Big Neighborhood Cleanup',
    summary:
      'One Saturday, forty blocks, every hand welcome. Gloves and bags provided at four meeting points.',
    category: 'community',
    creator: {
      id: 'c-greenway-neighbors',
      name: 'Greenway Neighbors',
      type: 'community-group',
      location: 'Richmond, VA',
      bio: 'A neighbourhood association keeping the Greenway clean and green.',
    },
    status: 'funding-ended',
    goal: 3_000,
    raised: 1_890,
    backers: 72,
    openedDaysAgo: 34,
    fundingWindowDays: 30,
    durationDays: 7,
    trend: 40,
    audience: {
      locations: ['Richmond, VA'],
      ageRange: [16, 70],
      interests: ['Volunteering', 'Outdoors', 'Community'],
      channels: ['social-feed', 'stories'],
      budgetSplit: { 'social-feed': 60, stories: 40 },
    },
    ad: {
      headline: 'Forty blocks. One Saturday. You in?',
      description: 'Gloves and bags provided. Bring a friend.',
      callToAction: 'Find a meeting point',
    },
    suggestedActions: ['Pick a meeting point', 'Bring a friend'],
  },
  {
    id: 'indigenous-languages',
    title: 'Indigenous Languages Live Here',
    summary:
      'Six languages are still spoken in our region, some by fewer than fifty people. Short audio stories introduce listeners to their first words.',
    category: 'arts-culture',
    creator: {
      id: 'c-native-voices',
      name: 'Native Voices Radio',
      type: 'organization',
      location: 'Albuquerque, NM',
      bio: 'Community radio produced by and for Native listeners.',
    },
    status: 'promoting',
    goal: 11_000,
    raised: 11_640,
    backers: 298,
    openedDaysAgo: 38,
    fundingWindowDays: 30,
    durationDays: 21,
    trend: 72,
    audience: {
      locations: ['New Mexico', 'Arizona', 'Colorado'],
      ageRange: [18, 65],
      interests: ['Culture', 'Podcasts', 'History'],
      channels: ['social-feed', 'video'],
      budgetSplit: { 'social-feed': 50, video: 50 },
    },
    ad: {
      headline: 'Hear six languages that still live here',
      description: 'Short audio stories from fluent speakers in our region.',
      callToAction: 'Listen now',
    },
    suggestedActions: ['Listen to one story', 'Learn a greeting'],
  },
  {
    id: 'right-to-repair',
    title: 'Repair Before You Replace',
    summary:
      'Most broken appliances are fixable for a fraction of a new one. A guide to local repair shops and the questions to ask.',
    category: 'business',
    creator: {
      id: 'c-fixers-guild',
      name: 'The Fixers Guild',
      type: 'business',
      location: 'Seattle, WA',
      bio: 'A cooperative of independent repair shops across Puget Sound.',
    },
    status: 'completed',
    goal: 6_000,
    raised: 6_240,
    backers: 190,
    openedDaysAgo: 88,
    fundingWindowDays: 30,
    durationDays: 21,
    trend: 52,
    audience: {
      locations: ['Seattle, WA', 'Tacoma, WA', 'Bellevue, WA'],
      ageRange: [25, 65],
      interests: ['Home', 'Sustainability', 'DIY'],
      channels: ['social-feed', 'search'],
      budgetSplit: { 'social-feed': 50, search: 50 },
    },
    ad: {
      headline: 'Broken? It’s probably fixable.',
      description: 'Find a trusted local repair shop before you buy new.',
      callToAction: 'Find a shop',
    },
    suggestedActions: ['Get a repair quote before replacing'],
  },
];

/** Deterministic status history so timelines agree with the current status. */
function buildHistory(status: CampaignStatus, openedAt: number, fundingEndsAt: number): StatusEvent[] {
  const at = (ms: number) => new Date(ms).toISOString();
  const events: StatusEvent[] = [
    { status: 'submitted', at: at(openedAt - 6 * DAY) },
    { status: 'approved', at: at(openedAt - 2 * DAY) },
    { status: 'funding', at: at(openedAt) },
  ];
  const after: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
    'goal-reached': ['goal-reached'],
    'funding-ended': ['funding-ended'],
    'distribution-prep': ['goal-reached', 'distribution-prep'],
    promoting: ['goal-reached', 'distribution-prep', 'promoting'],
    completed: ['goal-reached', 'distribution-prep', 'promoting', 'completed'],
  };
  (after[status] ?? []).forEach((s, i) => {
    events.push({ status: s, at: at(Math.min(fundingEndsAt, launch) + i * 3 * DAY - 9 * DAY) });
  });
  return events;
}

function toCampaign(seed: Seed): Campaign {
  const openedAt = launch - seed.openedDaysAgo * DAY;
  const fundingEndsAt = openedAt + seed.fundingWindowDays * DAY;
  return {
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    category: seed.category,
    creator: seed.creator,
    cover: campaignCovers[seed.id] ?? null,
    status: seed.status,
    goalCents: seed.goal * 100,
    raisedCents: seed.raised * 100,
    backerCount: seed.backers,
    durationDays: seed.durationDays,
    publishedAt: new Date(openedAt).toISOString(),
    fundingEndsAt: new Date(fundingEndsAt).toISOString(),
    featured: seed.featured ?? false,
    trendScore: seed.trend,
    story: stories[seed.id]?.story ?? [],
    sources: stories[seed.id]?.sources ?? [],
    suggestedActions: seed.suggestedActions,
    audience: seed.audience,
    ad: seed.ad,
    submittedAt: new Date(openedAt - 6 * DAY).toISOString(),
    history: buildHistory(seed.status, openedAt, fundingEndsAt),
    updates: stories[seed.id]?.updates ?? [],
  };
}

export function seedCampaigns(): Campaign[] {
  return seeds.map(toCampaign);
}
