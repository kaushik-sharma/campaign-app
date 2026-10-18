import { demo } from '@/config/demo';
import { formatMoney } from '@/lib/format';

/**
 * Secondary pages (PRD): How it works, About, Partners, FAQ, Help, Contact, Terms, Privacy and
 * Community guidelines. Prototype copy: legal pages are illustrative, not binding terms.
 */
export type InfoSection = { heading?: string; body: string };
export type InfoPage = { title: string; intro: string; sections: InfoSection[]; illustrative?: boolean };

const adPct = Math.round((1 - demo.fees.platformPct) * 100);
const feePct = 100 - adPct;
const minimum = formatMoney(demo.funding.minimumToDistributeCents);

export const INFO_SLUGS = [
  'how-it-works',
  'about',
  'faq',
  'help',
  'contact',
  'partners',
  'terms',
  'privacy',
  'guidelines',
] as const;

export type InfoSlug = (typeof INFO_SLUGS)[number];

export const infoPages: Record<InfoSlug, InfoPage> = {
  'how-it-works': {
    title: 'How it works',
    intro: 'Campaigns helps important messages reach people beyond their creator’s own network.',
    sections: [
      { heading: '1. Create', body: 'A person or organization writes a campaign: the message, the evidence behind it, the ads that will carry it and who it should reach.' },
      { heading: '2. Review', body: 'Our team checks that the story’s claims match its sources, the visuals and ad copy follow the community guidelines, and the targeting suits the message. Nothing is published or advertised before review is complete.' },
      { heading: '3. Amplify', body: `Backers pool contributions toward the campaign’s funding goal. ${adPct}% of what’s raised buys ads; ${feePct}% covers review, ad setup and reporting. When funding closes, we set up the ads and run them for the campaign’s chosen duration.` },
      { heading: 'After the run', body: 'Every campaign gets a public report showing what was raised, what was spent on ads, and how many people the ads reached, with estimates and measured figures clearly separated.' },
    ],
  },
  about: {
    title: 'About Campaigns',
    intro: 'Most good messages never travel further than the people who already follow their creator. Campaigns exists to change that.',
    sections: [
      { body: 'We are a community-funded advertising platform. Creators, nonprofits, businesses and community groups publish campaigns; backers fund the ads that carry them to new audiences.' },
      { heading: 'Not a donation platform', body: 'Contributions pay for distribution of a message. They do not go to the creator or the cause, and they are not charitable donations.' },
      { heading: 'This prototype', body: 'This app is a prototype. Campaigns, creators, figures and payments are sample data, and no real money moves.' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    intro: 'Answers about funding, fees, reach and refunds.',
    sections: [
      { heading: 'Is my contribution a donation?', body: 'No. It pays for advertising that spreads the campaign’s message. It doesn’t go to the creator or fund the cause directly.' },
      { heading: 'What fees are there?', body: `Card processing (${(demo.fees.processingPct * 100).toFixed(1)}% + $${(demo.fees.processingFixedCents / 100).toFixed(2)}) is added at checkout so your full contribution reaches the pool. Of the funds raised, ${feePct}% is a platform fee for review, ad setup and reporting; ${adPct}% buys ads.` },
      { heading: 'How is reach estimated?', body: `From two assumptions: an average cost of $${demo.reach.assumedCpmUsd} per 1,000 ad views and ${demo.reach.avgFrequency} views per person, shown as a ±${Math.round(demo.reach.spread * 100)}% range. Actual reach depends on ad inventory, prices, targeting and performance, and is never guaranteed.` },
      { heading: 'What if the goal isn’t reached?', body: `Funds raised still pay for a smaller ad run, unless less than ${minimum} was raised. In that case every backer is refunded in full.` },
      { heading: 'What happens to unspent money?', body: 'If ads can’t spend the full budget, the unspent amount is refunded to backers in proportion to what they contributed.' },
      { heading: 'Does funding mean ads start immediately?', body: 'No. Once funding closes, our team prepares and approves the ads with distribution partners. Ads start only when approval, payment and setup are complete.' },
      { heading: 'Is my name shown publicly?', body: 'Not unless you choose to. Backer names are private by default; payment records are kept accurately either way.' },
    ],
  },
  help: {
    title: 'Help',
    intro: 'Something not working as expected? Start here.',
    sections: [
      { heading: 'A payment failed', body: 'Failed and canceled payments are never charged. You can try again from the campaign page.' },
      { heading: 'I can’t find a campaign', body: 'Only reviewed campaigns appear in Explore. Campaigns still in review are visible to their creator only.' },
      { heading: 'My campaign needs changes', body: 'If review asks for changes, you’ll get a notification with the reviewer’s notes. Edit the draft and resubmit.' },
      { heading: 'Still stuck?', body: 'Contact us and we’ll get back to you within two working days.' },
    ],
  },
  contact: {
    title: 'Contact',
    intro: 'We’d love to hear from you.',
    sections: [
      { heading: 'Support', body: 'support@campaigns.app (prototype address, not monitored)' },
      { heading: 'Press and partnerships', body: 'partners@campaigns.app (prototype address, not monitored)' },
    ],
  },
  partners: {
    title: 'Distribution partners',
    intro: 'Ads run on established advertising networks across social feeds, stories, search, video and news sites.',
    sections: [
      { body: 'We choose networks for each campaign based on its audience and channels. The specific networks used are named in each campaign’s final report.' },
      { heading: 'Our commitments', body: 'Every ad is labeled as sponsored, links back to the campaign page, and targets broad audiences only. Backer information is never shared with ad networks.' },
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'The rules for creating, backing and promoting campaigns.',
    illustrative: true,
    sections: [
      { heading: 'Contributions', body: 'Contributions fund distribution of a campaign’s message. They are not donations, purchases or investments.' },
      { heading: 'Review and publication', body: 'We may approve, request changes to or decline any campaign. No campaign is published or advertised before review is complete.' },
      { heading: 'Refunds', body: `If a campaign raises less than ${minimum}, is declined, canceled or cannot be distributed, backers are refunded. Unspent ad budget is refunded proportionally.` },
    ],
  },
  privacy: {
    title: 'Privacy',
    intro: 'What we collect and why.',
    illustrative: true,
    sections: [
      { heading: 'Accounts', body: 'Your name, email address and password are handled by our sign-in provider, Google Firebase, to keep you signed in. Passwords are never stored by Campaigns or visible to us.' },
      { heading: 'Backers', body: 'We collect the details needed to process a payment and send a receipt. Guest backers only need an email address. Names are private unless you choose to show them.' },
      { heading: 'Advertising', body: 'Ads target broad groups by location, age and interests. We never share backer or creator account details with advertising partners.' },
      { heading: 'Your choices', body: 'You can change notification and visibility settings at any time from your profile.' },
    ],
  },
  guidelines: {
    title: 'Community guidelines',
    intro: 'What makes a campaign eligible.',
    sections: [
      { heading: 'Be accurate', body: 'Claims must be supported by the sources you cite, and sources must be publicly accessible.' },
      { heading: 'Be respectful', body: 'No harassment, hate speech, or content targeting private individuals.' },
      { heading: 'Be transparent', body: 'Say who you are. Creators and organizations must be named on every campaign.' },
      { heading: 'Not eligible', body: 'Fundraising for individuals, political candidates or parties, misleading health claims, and anything illegal.' },
    ],
  },
};
