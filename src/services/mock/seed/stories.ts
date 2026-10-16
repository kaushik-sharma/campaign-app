import type { CampaignUpdate, Source, StoryBlock } from '@/domain/types';

import { storyImages } from './images';

/**
 * Seed stories and sources. Demo content: the organisations are fictional, but every source links
 * to a real, publicly available page, and statistics only state what those sources say.
 */
type StorySeed = { story: StoryBlock[]; sources: Source[]; updates?: CampaignUpdate[] };

const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();

const p = (id: string, text: string): StoryBlock => ({ id, type: 'paragraph', text });
const h = (id: string, text: string): StoryBlock => ({ id, type: 'heading', text });

export const stories: Record<string, StorySeed> = {
  'riverside-wetlands': {
    sources: [
      { id: 's1', title: 'Why are wetlands important?', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/wetlands/why-are-wetlands-important' },
      { id: 's2', title: 'Wetlands', publisher: 'U.S. Geological Survey', url: 'https://www.usgs.gov/special-topics/water-science-school/science/wetlands' },
    ],
    story: [
      p('b1', 'Behind the community garden on Mill Creek sits four acres of reeds, shallow water and birdsong. It is the last wetland left along the creek, and a proposed parking expansion would pave most of it.'),
      h('b2', 'What the wetland does for the neighbourhood'),
      p('b3', 'Wetlands work like sponges. They soak up stormwater, slow it down and release it gradually, which eases flooding downstream. They also filter sediment and pollutants before water reaches the creek.'),
      { id: 'b4', type: 'stat', value: '~1 million gallons', label: 'Floodwater one acre of wetland can typically store', sourceId: 's1' },
      { id: 'b5', type: 'image', image: storyImages['riverside-wetlands'], caption: 'Egrets and herons feed in the wetland’s shallow water through the summer.' },
      h('b6', 'Why reach matters now'),
      p('b7', 'The city’s public comment period closes next month. Comments carry weight, but only if people know the decision is happening. Most residents we have spoken to had never heard of it.'),
      { id: 'b8', type: 'quote', text: 'We are not asking anyone to take a side before they’ve seen it. We’re asking them to come and look.', attribution: 'Friends of Mill Creek' },
    ],
    updates: [
      { id: 'u1', title: 'Weekend walks added', body: 'Volunteers are leading free 30-minute walks on the boardwalk every Saturday morning until the comment period closes.', at: daysAgo(5) },
    ],
  },
  'stroke-fast': {
    sources: [
      { id: 's1', title: 'Stroke', publisher: 'National Institute of Neurological Disorders and Stroke', url: 'https://www.ninds.nih.gov/health-information/disorders/stroke' },
      { id: 's2', title: 'Stroke', publisher: 'MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/stroke.html' },
    ],
    story: [
      p('b1', 'A stroke happens when blood flow to part of the brain is cut off. Brain cells start to die within minutes, which is why the time between the first symptom and treatment matters so much.'),
      h('b2', 'Four letters to remember'),
      { id: 'b3', type: 'stat', value: 'F · A · S · T', label: 'Face drooping, Arm weakness, Speech difficulty, Time to call emergency services', sourceId: 's2' },
      p('b4', 'Bystanders are often the first to notice. A face that droops on one side, an arm that drifts down, speech that is slurred or strange: any one of these is a reason to call for help immediately, even if the symptoms seem to pass.'),
      h('b5', 'Who we want to reach'),
      p('b6', 'Our screenings show that adult children and caregivers of older relatives are the people most likely to be in the room when it matters. This campaign puts the four signs in front of them, in the feeds they already use.'),
      { id: 'b7', type: 'quote', text: 'Everyone who stood next to someone having a stroke tells us the same thing: I wish I’d known what I was looking at.', attribution: 'Northside Health Collective' },
    ],
  },
  'night-sky': {
    sources: [
      { id: 's1', title: 'The new world atlas of artificial night sky brightness (Falchi et al., 2016)', publisher: 'Science Advances, via PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/27386582/' },
      { id: 's2', title: 'Light Pollution', publisher: 'U.S. National Park Service', url: 'https://www.nps.gov/subjects/nightskies/lightpollution.htm' },
    ],
    story: [
      p('b1', 'For most of human history, the Milky Way was the brightest thing in the night sky. Today, most people in North America have never seen it from home.'),
      { id: 'b2', type: 'stat', value: '~80%', label: 'Of North Americans who can no longer see the Milky Way from where they live', sourceId: 's1' },
      { id: 'b3', type: 'image', image: storyImages['night-sky'], caption: 'Unshielded light spills upward and sideways, washing out the sky above cities.' },
      h('b4', 'It isn’t darkness we need, it’s better light'),
      p('b5', 'Most light pollution comes from fixtures that send light where nobody needs it: up into the sky and sideways into windows. Shielded fixtures that point down, warmer bulbs, and lights on timers keep streets safe and bring the stars back.'),
      p('b6', 'The same changes save energy. Light that goes up into the sky is light someone paid for and nobody used.'),
      { id: 'b7', type: 'quote', text: 'You don’t have to drive to the desert to see the stars. You have to change a few porch lights.', attribution: 'Dr. Priya Raman' },
    ],
  },
  'free-tutoring': {
    sources: [
      { id: 's1', title: 'The Impressive Effects of Tutoring on PreK-12 Learning (Nickow, Oreopoulos & Quan)', publisher: 'National Bureau of Economic Research', url: 'https://www.nber.org/papers/w27476' },
    ],
    story: [
      p('b1', 'Open Door Learning offers one-on-one tutoring to any K–12 student in the metro area, online or in person, at no cost. Every term, hundreds of tutor hours go unbooked.'),
      h('b2', 'Tutoring works'),
      p('b3', 'A large review of randomized studies found that tutoring programs produced substantial gains in learning, especially when sessions were frequent and run by trained tutors.'),
      { id: 'b4', type: 'stat', value: '96', label: 'Randomized controlled trials of tutoring reviewed in the study', sourceId: 's1' },
      h('b5', 'The problem is awareness'),
      p('b6', 'Families who need help most are often the least likely to hear about free programs. School newsletters get lost; flyers go home crumpled. Ads in the places parents already scroll reach them directly.'),
    ],
    updates: [
      { id: 'u1', title: 'Ads are live', body: 'Ads started running in Atlanta and Decatur this week. Sign-ups are already up compared with last term.', at: daysAgo(3) },
    ],
  },
  'transit-plan-comment': {
    sources: [
      { id: 's1', title: 'TransitCenter', publisher: 'TransitCenter', url: 'https://transitcenter.org/' },
    ],
    story: [
      p('b1', 'The city is redesigning its entire bus network for the first time in decades. Routes will move, some stops will close and frequencies will change.'),
      h('b2', 'The people most affected are the least likely to know'),
      p('b3', 'Public meetings happen on weekday evenings. Online comment forms are buried on city websites. Riders who work shifts, care for family or don’t follow local news rarely get a say, even though they rely on the bus the most.'),
      p('b4', 'We’re not telling anyone what to say. We want every rider to check their route on the draft map and leave a comment before the deadline.'),
      { id: 'b5', type: 'quote', text: 'A bus network should be designed with the people who ride it, not just the people who show up to meetings.', attribution: 'Better Bus Coalition' },
    ],
  },
  'four-day-week': {
    sources: [
      { id: 's1', title: '4 Day Week Global', publisher: '4 Day Week Global', url: 'https://www.4dayweek.com/' },
    ],
    story: [
      p('b1', 'Over twelve months, three employers in rural Nebraska and Kansas moved staff to a 32-hour week with no cut in pay: a machine shop, a regional credit union and a county health clinic.'),
      h('b2', 'What we measured'),
      p('b3', 'We tracked output, hiring, sick days and staff turnover, and interviewed employees and managers every quarter. Our full report is available on request; this campaign shares the headline findings.'),
      p('b4', 'All three employers chose to keep the four-day week after the trial. Managers told us hiring got easier in towns where competing for workers had become a constant struggle.'),
      p('b5', 'Larger pilots run with the nonprofit 4 Day Week Global have reported similar results in cities. We wanted to know whether it works in small towns too.'),
    ],
  },
  'local-pantry': {
    sources: [
      { id: 's1', title: 'Food Security in the U.S.', publisher: 'USDA Economic Research Service', url: 'https://www.ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/' },
      { id: 's2', title: 'Feeding America', publisher: 'Feeding America', url: 'https://www.feedingamerica.org/' },
    ],
    story: [
      p('b1', 'There are more free food pantries on Detroit’s East Side than most residents realise. Many families who qualify never visit one, and the most common reason they give is simple: they didn’t know it was there.'),
      h('b2', 'One map, every pantry'),
      p('b3', 'Volunteers visited every pantry on the East Side to confirm hours, what paperwork is needed (usually none) and whether they deliver. The result is one simple map that works on any phone.'),
      p('b4', 'The USDA measures how many households struggle to afford enough food every year. Behind each number is a family deciding between groceries and rent.'),
    ],
    updates: [
      { id: 'u1', title: 'Final report published', body: 'The campaign finished its 30-day run. The report shows where ads were delivered and how many people reached the pantry map.', at: daysAgo(20) },
    ],
  },
  'main-street-murals': {
    sources: [
      { id: 's1', title: 'Americans for the Arts', publisher: 'Americans for the Arts', url: 'https://www.americansforthearts.org/' },
    ],
    story: [
      p('b1', 'Twelve murals line San Antonio’s Main Street, each painted by a local artist and each telling a piece of the neighbourhood’s history: the family bakery, the flood of 1921, the first Tejano radio station.'),
      h('b2', 'A short series, one mural at a time'),
      p('b3', 'Each video is under two minutes: the artist, the wall and the story behind it. The goal is simple: give people a reason to walk downtown and see them in person.'),
      { id: 'b4', type: 'quote', text: 'Every one of these walls was painted for the people who live here. Most of them have never stopped to look.', attribution: 'Lena Ortiz' },
    ],
  },
  'buy-local-winter': {
    sources: [
      { id: 's1', title: 'U.S. Small Business Administration', publisher: 'U.S. Small Business Administration', url: 'https://www.sba.gov/' },
    ],
    story: [
      p('b1', 'Downtown Burlington has sixty-two independent shops, cafés and studios within a ten-minute walk. For many of them, the weeks between Thanksgiving and New Year decide whether the year ends in profit.'),
      h('b2', 'A reminder, not a sale'),
      p('b3', 'This campaign doesn’t advertise discounts. It reminds people in the county that the gift they’re about to order online is probably sitting on a shelf a few blocks away.'),
      p('b4', 'Money spent at locally owned businesses tends to stay in the community longer: wages, rent and supplies that circulate in the same town.'),
    ],
  },
  'microchip-pets': {
    sources: [
      { id: 's1', title: 'Characteristics of animals with microchips entering animal shelters (Lord et al., 2009)', publisher: 'Journal of the American Veterinary Medical Association', url: 'https://avmajournals.avma.org/doi/10.2460/javma.235.2.160' },
      { id: 's2', title: 'Microchips reunite pets with families', publisher: 'American Veterinary Medical Association', url: 'https://www.avma.org/resources-tools/pet-owners/petcare/microchips-reunite-pets-families' },
    ],
    story: [
      p('b1', 'A microchip is only as useful as the phone number attached to it. When a lost dog arrives at a shelter, staff scan for a chip, look up the registry, and call. If the chip was never registered, or the number is old, the trail ends there.'),
      { id: 'b2', type: 'stat', value: '52% vs 22%', label: 'Return-to-owner rate for microchipped dogs vs dogs without chips in a study of 53 shelters', sourceId: 's1' },
      h('b3', 'Check it today'),
      p('b4', 'Ask your vet to scan your pet’s chip at the next visit, then look up the number in a registry and make sure your details are current. It takes about two minutes.'),
    ],
  },
  'heat-check-elders': {
    sources: [
      { id: 's1', title: 'Heat Safety', publisher: 'National Weather Service', url: 'https://www.weather.gov/safety/heat' },
      { id: 's2', title: 'Climate change and heat: fact sheet', publisher: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health' },
    ],
    story: [
      p('b1', 'Heat doesn’t look like a disaster. There is no wreckage, no flood line on the wall. But it is one of the deadliest kinds of weather, and older adults who live alone are among the most at risk.'),
      h('b2', 'Why a phone call works'),
      p('b3', 'Older bodies regulate temperature less well, and some medicines make it harder. People who live alone may not notice warning signs in themselves, and no one else is there to notice for them.'),
      p('b4', 'A two-minute call during a heat advisory can catch problems early: Is it cool where you are? Are you drinking water? Do you need a ride somewhere with air conditioning?'),
      { id: 'b5', type: 'quote', text: 'The most effective heat plan we’ve found is a neighbour with a phone.', attribution: 'Cool Blocks Initiative' },
    ],
    updates: [
      { id: 'u1', title: 'Ads live in three cities', body: 'Ads are now running in Phoenix, Las Vegas and Tucson ahead of the next forecast heat advisory.', at: daysAgo(4) },
    ],
  },
  'teen-dinner-talk': {
    sources: [
      { id: 's1', title: 'Child and Adolescent Mental Health', publisher: 'National Institute of Mental Health', url: 'https://www.nimh.nih.gov/health/topics/child-and-adolescent-mental-health' },
      { id: 's2', title: '988 Suicide & Crisis Lifeline', publisher: '988 Lifeline', url: 'https://988lifeline.org/' },
    ],
    story: [
      p('b1', 'Teenagers say they want their parents to ask how they’re really doing. Parents say they don’t know how to start. Dinner is often the one time in the day the whole family sits down together.'),
      h('b2', 'Five openers that work better than “How was school?”'),
      p('b3', 'We tested conversation starters with families over six months. The ones that worked were specific, low-pressure and didn’t demand a big answer: “What was the best part of today?” works better than “Are you okay?”'),
      p('b4', 'Talking isn’t treatment, and some things need professional help. The campaign links to the 988 Suicide & Crisis Lifeline for anyone who needs support right now.'),
    ],
  },
  'bees-need-weeds': {
    sources: [
      { id: 's1', title: 'To mow or to mow less: Lawn mowing frequency affects bee abundance and diversity in suburban yards (Lerman et al., 2018)', publisher: 'Biological Conservation', url: 'https://doi.org/10.1016/j.biocon.2018.01.025' },
    ],
    story: [
      p('b1', 'The tidy lawn is one of the least bee-friendly landscapes there is. But you don’t need to replace yours to help pollinators. You just need to mow a little less.'),
      { id: 'b2', type: 'image', image: storyImages['bees-need-weeds'], caption: 'Dandelions and clover are early food for bees when little else is in bloom.' },
      h('b3', 'What the research found'),
      p('b4', 'Researchers in Massachusetts compared yards mowed every one, two and three weeks. Yards mowed every two weeks had more bees than yards mowed weekly, and the longest-mowed lawns produced the most flowers.'),
      p('b5', 'Dandelions and clover aren’t a sign of neglect. For bees, they’re lunch.'),
    ],
    updates: [
      { id: 'u1', title: 'Final report published', body: 'The campaign has finished. Thank you to everyone who backed it. The full delivery report is now available.', at: daysAgo(40) },
    ],
  },
  'money-before-18': {
    sources: [
      { id: 's1', title: 'Survey of the States', publisher: 'Council for Economic Education', url: 'https://www.councilforeconed.org/survey-of-the-states/' },
      { id: 's2', title: 'MyMoney.gov', publisher: 'U.S. Financial Literacy and Education Commission', url: 'https://www.mymoney.gov/' },
    ],
    story: [
      p('b1', 'Many teenagers leave high school without learning how interest compounds, how a credit score works or what the deductions on a first paycheck mean. A growing number of states now require a personal finance course, but many students still graduate without one.'),
      h('b2', 'Six lessons, at home'),
      p('b3', 'Our course is six short lessons that a parent and teen can do together: budgeting, saving, credit, debt, payslips and avoiding scams. Each takes about twenty minutes and is free.'),
    ],
  },
  'lead-pipes': {
    sources: [
      { id: 's1', title: 'Basic Information about Lead in Drinking Water', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/ground-water-and-drinking-water/basic-information-about-lead-drinking-water' },
      { id: 's2', title: 'Lead Service Lines', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/ground-water-and-drinking-water/lead-service-lines' },
    ],
    story: [
      p('b1', 'A service line is the pipe that carries water from the main under the street into your home. In older neighbourhoods, many of them are still made of lead.'),
      { id: 'b2', type: 'image', image: storyImages['lead-pipes'], caption: 'Lead service lines installed decades ago are still in use in many older cities.' },
      p('b3', 'According to the EPA, lead in drinking water can harm health, and children are especially vulnerable. Replacing lead lines is the most reliable fix, but residents first need to know whether they have one.'),
      h('b4', 'Look it up in a minute'),
      p('b5', 'The city has published a lookup tool that shows the known material of each service line by address. Residents can also request a free water test.'),
    ],
  },
  'neighborhood-cleanup': {
    sources: [
      { id: 's1', title: 'Keep America Beautiful', publisher: 'Keep America Beautiful', url: 'https://kab.org/' },
    ],
    story: [
      p('b1', 'Once a year, Greenway Neighbors cleans forty blocks of streets, alleys and creek banks in a single morning. Gloves, bags and coffee are provided at four meeting points.'),
      p('b2', 'This year the campaign didn’t reach its funding goal before the deadline. The funds raised will still pay for a smaller round of ads in the week before the event.'),
    ],
  },
  'indigenous-languages': {
    sources: [
      { id: 's1', title: 'International Decade of Indigenous Languages 2022–2032', publisher: 'UNESCO', url: 'https://www.unesco.org/en/decades/indigenous-languages' },
      { id: 's2', title: 'Indigenous languages: gateways to the world’s cultural diversity', publisher: 'UNESCO', url: 'https://www.unesco.org/en/articles/cutting-edge-indigenous-languages-gateways-worlds-cultural-diversity' },
    ],
    story: [
      p('b1', 'Six Indigenous languages are still spoken in our region. Some have thousands of speakers; others fewer than fifty, most of them elders.'),
      { id: 'b2', type: 'stat', value: '2022–2032', label: 'The UN International Decade of Indigenous Languages', sourceId: 's1' },
      h('b3', 'Hearing is the first step'),
      p('b4', 'Each audio story is three minutes long: a fluent speaker telling a short story, with an English translation. Listeners learn a greeting at the end of each one.'),
    ],
  },
  'right-to-repair': {
    sources: [
      { id: 's1', title: 'Right to Repair', publisher: 'iFixit', url: 'https://www.ifixit.com/Right-to-Repair' },
      { id: 's2', title: 'The Repair Association', publisher: 'The Repair Association', url: 'https://repair.org/' },
    ],
    story: [
      p('b1', 'When a washing machine, phone or laptop breaks, the first instinct is to replace it. Often a local repair shop could fix it for a fraction of the price.'),
      h('b2', 'Five questions to ask before you buy new'),
      p('b3', 'How old is it? What does the repair cost compared with a replacement? Are parts available? Will the repair be guaranteed? Can I see the old part? Our guide walks through each one.'),
    ],
    updates: [
      { id: 'u1', title: 'Final report published', body: 'Distribution has finished and the final report is available.', at: daysAgo(30) },
    ],
  },
};
