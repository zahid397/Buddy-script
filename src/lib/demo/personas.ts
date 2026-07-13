// 14 clearly fictional demo personas ("bots") that the demo engine acts as.
// Names, bios, locations are all invented — none reference real people or
// companies. Avatars reuse images already shipped in public/assets (no
// external network calls, nothing to break offline).

export type PersonaDef = {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  location: string;
  interests: string[];
  avatarUrl: string;
};

const AVATAR_POOL = [
  '/assets/js/images/card_ppl1.png',
  '/assets/js/images/card_ppl2.png',
  '/assets/js/images/card_ppl3.png',
  '/assets/js/images/card_ppl4.png',
  '/assets/js/images/chat_profile.png',
  '/assets/js/images/chat_profile1.png',
  '/assets/js/images/people1.png',
  '/assets/js/images/people2.png',
  '/assets/js/images/people3.png',
  '/assets/js/images/man.png',
  '/assets/js/images/react_img1.png',
  '/assets/js/images/react_img2.png',
  '/assets/js/images/react_img3.png',
  '/assets/js/images/recommend1.png',
];

export const DEMO_PERSONAS: PersonaDef[] = [
  { firstName: 'Priya', lastName: 'Nakamura', email: 'priya.nakamura@demo.buddyscript.dev', bio: 'Product designer who overthinks color palettes. Always up for a coffee chat.', location: 'San Francisco, CA', interests: ['design', 'coffee', 'hiking'], avatarUrl: AVATAR_POOL[0] },
  { firstName: 'Jordan', lastName: 'Ashworth', email: 'jordan.ashworth@demo.buddyscript.dev', bio: 'Backend engineer, mostly living in distributed systems and Rust these days.', location: 'Austin, TX', interests: ['rust', 'distributed-systems', 'climbing'], avatarUrl: AVATAR_POOL[1] },
  { firstName: 'Sofia', lastName: 'Lindqvist', email: 'sofia.lindqvist@demo.buddyscript.dev', bio: 'Product manager. Obsessed with good onboarding flows and bad ski puns.', location: 'Stockholm, Sweden', interests: ['product', 'ux-research', 'skiing'], avatarUrl: AVATAR_POOL[2] },
  { firstName: 'Marcus', lastName: 'Whitfield', email: 'marcus.whitfield@demo.buddyscript.dev', bio: 'Frontend dev. React by day, five-a-side football by evening.', location: 'London, UK', interests: ['react', 'typescript', 'football'], avatarUrl: AVATAR_POOL[3] },
  { firstName: 'Amara', lastName: 'Okonkwo', email: 'amara.okonkwo@demo.buddyscript.dev', bio: 'Data scientist. I promise not every conversation turns into a talk about ML.', location: 'Lagos, Nigeria', interests: ['machine-learning', 'python', 'photography'], avatarUrl: AVATAR_POOL[4] },
  { firstName: 'Liam', lastName: "O'Sullivan", email: 'liam.osullivan@demo.buddyscript.dev', bio: 'DevOps engineer. If it can be containerized, I have opinions about it.', location: 'Dublin, Ireland', interests: ['kubernetes', 'cycling', 'home-brewing'], avatarUrl: AVATAR_POOL[5] },
  { firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.tanaka@demo.buddyscript.dev', bio: 'Mobile engineer, Swift and Kotlin in equal measure. Currently mid-way through a JRPG.', location: 'Tokyo, Japan', interests: ['swift', 'kotlin', 'gaming'], avatarUrl: AVATAR_POOL[6] },
  { firstName: 'Elena', lastName: 'Petrova', email: 'elena.petrova@demo.buddyscript.dev', bio: 'Security engineer. I read incident reports for fun, which says a lot.', location: 'Berlin, Germany', interests: ['security', 'ctf', 'chess'], avatarUrl: AVATAR_POOL[7] },
  { firstName: 'Noah', lastName: 'Bergström', email: 'noah.bergstrom@demo.buddyscript.dev', bio: 'Early-stage founder. Building something new, still figuring out the name.', location: 'Oslo, Norway', interests: ['startups', 'sailing', 'reading'], avatarUrl: AVATAR_POOL[8] },
  { firstName: 'Isabela', lastName: 'Rocha', email: 'isabela.rocha@demo.buddyscript.dev', bio: 'Growth marketer who genuinely likes spreadsheets. Send help, or send data.', location: 'São Paulo, Brazil', interests: ['marketing', 'seo', 'dance'], avatarUrl: AVATAR_POOL[9] },
  { firstName: 'Tariq', lastName: 'Hassan', email: 'tariq.hassan@demo.buddyscript.dev', bio: 'Full-stack developer. Next.js and Postgres, mostly, with the occasional 5k.', location: 'Dubai, UAE', interests: ['nextjs', 'postgres', 'running'], avatarUrl: AVATAR_POOL[10] },
  { firstName: 'Chloe', lastName: 'Bennett', email: 'chloe.bennett@demo.buddyscript.dev', bio: 'UX writer. I care more about your button copy than is probably healthy.', location: 'Toronto, Canada', interests: ['writing', 'design', 'yoga'], avatarUrl: AVATAR_POOL[11] },
  { firstName: 'Kenji', lastName: 'Watanabe', email: 'kenji.watanabe@demo.buddyscript.dev', bio: 'Engineering manager. Recovering perfectionist, current mentor enthusiast.', location: 'Osaka, Japan', interests: ['leadership', 'mentoring', 'cooking'], avatarUrl: AVATAR_POOL[12] },
  { firstName: 'Fatima', lastName: 'Zahra', email: 'fatima.zahra@demo.buddyscript.dev', bio: 'QA engineer. I will find the edge case. I will always find the edge case.', location: 'Casablanca, Morocco', interests: ['testing', 'automation', 'travel'], avatarUrl: AVATAR_POOL[13] },
];
