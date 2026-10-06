export const BRAND = 'EduVia';

export const NAV_LINKS = [
  { label: 'Gifts', href: '#gifts' },
  { label: 'View Plans', href: '#membership' },
];

export const HERO = {
  title: ['LEARN FROM THE BEST,', 'BE YOUR BEST.'],
  price: '$10/mo',
  priceNote: 'billed annually',
  cta: 'Get EduVia',
  secondaryCta: 'Learn More About EduVia',
  guarantee: '30-day money-back guarantee',
  sub: 'Get unlimited access to thousands of bite-sized lessons.',
};

export const QUIZ = [
  { id: 'career', label: 'Develop my career or leadership skills' },
  { id: 'ai', label: 'Learn about AI and how to leverage it' },
  { id: 'creative', label: 'Become a better actor, musician, or writer' },
  { id: 'wellness', label: 'Cultivate a healthy and active lifestyle' },
  { id: 'science', label: 'Learn about science & technology' },
  { id: 'cooking', label: 'Become a better chef' },
  { id: 'style', label: 'Improve my style, art, or interior design' },
  { id: 'other', label: 'Something else' },
];

/* Two independently scrolling columns for the hero mosaic. */
export const MOSAIC_COLUMNS = [
  [
    {
      name: 'Kenji Nakamura',
      field: 'Directing',
      hue: 348,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Amara Okonjo',
      field: 'Architecture',
      hue: 268,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Sofia Duarte',
      field: 'Culinary',
      hue: 24,
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Rhea Kapoor',
      field: 'Neuroscience',
      hue: 200,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    },
  ],
  [
    {
      name: 'Marcus Feld',
      field: 'Screenwriting',
      hue: 32,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Lena Vogel',
      field: 'Photography',
      hue: 288,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Diego Sanz',
      field: 'Jazz',
      hue: 158,
      image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    },
    {
      name: 'Ingrid Falk',
      field: 'Product Design',
      hue: 210,
      image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80',
    },
  ],
];

export const BENEFITS = [
  {
    title: 'All 200+ classes and original series',
    body: 'Learn from world-class leaders across creative, business, technology, and wellness disciplines.',
  },
  {
    title: 'Learn at your own pace',
    body: 'Bite-sized lessons and deep dives designed to fit your schedule, wherever you are.',
  },
  {
    title: 'New classes added every month',
    body: 'Fresh instruction from the people shaping the field — with new ideas and inspiration every week.',
  },
];

export const PLANS = [
  {
    id: 'annual',
    name: 'Annual',
    price: '$10',
    per: '/mo',
    billed: '$120 billed annually',
    featured: true,
    perks: ['Unlimited access to all classes', 'New classes every month', 'Offline viewing'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$15',
    per: '/mo',
    billed: 'Billed monthly',
    perks: ['Unlimited access to all classes', 'Cancel anytime', 'Offline viewing'],
  },
  {
    id: 'family',
    name: 'Family',
    price: '$15',
    per: '/mo',
    billed: 'Up to 6 profiles',
    perks: ['Everything in Annual', '6 separate profiles', 'Kids profiles included'],
  },
];

export const FEATURED = {
  eyebrow: 'Featured instructor',
  name: 'Kenji Nakamura',
  field: 'Filmmaker',
  title: 'Directing\nGreat Films',
  lessons: 24,
  runtime: '4h 12m',
  body: 'Kenji Nakamura has shaped the visual language of modern cinema. In this class, he breaks down framing, blocking, and the emotional architecture of a scene — from first read to final cut.',
  cta: 'Start learning',
  image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
};

export const CATEGORIES = [
  { id: 'writing', label: 'Writing' },
  { id: 'business', label: 'Business' },
  { id: 'design', label: 'Design' },
  { id: 'film', label: 'Film & TV' },
  { id: 'music', label: 'Music' },
  { id: 'food', label: 'Food' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'science', label: 'Science & Tech' },
];

export const CLASSES = [
  { title: 'The Art of the Short Story', category: 'writing', instructor: 'Marcus Feld', meta: 'Writing · 18 lessons', hue: 32, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' },
  { title: 'Systems That Scale', category: 'business', instructor: 'Amara Okonjo', meta: 'Business · 22 lessons', hue: 268, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80' },
  { title: 'Colour and Composition', category: 'design', instructor: 'Ingrid Falk', meta: 'Design · 15 lessons', hue: 210, image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80' },
  { title: 'Improvisation for Everyone', category: 'film', instructor: 'Kenji Nakamura', meta: 'Film & TV · 20 lessons', hue: 348, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80' },
  { title: 'Rhythm and Voice', category: 'music', instructor: 'Diego Sanz', meta: 'Music · 17 lessons', hue: 158, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80' },
  { title: 'Flavour by Chemistry', category: 'food', instructor: 'Sofia Duarte', meta: 'Food · 26 lessons', hue: 24, image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80' },
];

export const JOURNEY = {
  title: 'Start your journey today',
  body: 'Get started with a 7-day free trial. Cancel any time.',
  cta: 'Try EduVia free',
};

export const CERTIFICATES = {
  title: 'The fastest way to advance your career',
  body: 'Complete any class and earn a shareable certificate of completion — a practical proof point you can put in front of the people who matter.',
  cta: 'Browse classes',
};

export const BUSINESS = {
  eyebrow: 'EduVia for teams',
  title: 'Level up\nyour team',
  body: 'Give your company access to the world’s best teachers. Flexible learning paths, team analytics, and dedicated onboarding for every role.',
  cta: 'Explore EduVia for teams',
  stats: [
    { value: '1,200+', label: 'Companies' },
    { value: '94%', label: 'Completion rate' },
    { value: '3.2×', label: 'Skill growth' },
  ],
};

export const TESTIMONIALS = [
  {
    quote: 'I took the writing class on a lunch break and rewrote the opening chapter that night. It changed how I work.',
    name: 'Priya N.',
    role: 'Product Manager',
    hue: 288,
  },
  {
    quote: 'The production quality rivals anything I’ve paid ten times more for. I have watched every class twice.',
    name: 'Daniel R.',
    role: 'Founder',
    hue: 200,
  },
  {
    quote: 'Our whole design team completed the composition class in a month. The work we shipped after is not comparable.',
    name: 'Yuki T.',
    role: 'Design Lead',
    hue: 24,
  },
  {
    quote: 'I finally understand the numbers I used to nod along to. Worth it for that alone.',
    name: 'Marcus L.',
    role: 'Consultant',
    hue: 158,
  },
];

export const EMAIL = {
  title: 'Get new class alerts',
  body: 'Be first to know when a new instructor drops. Plus occasional essays on learning.',
  cta: 'Sign up',
  placeholder: 'Email address',
};

export const FAQS = [
  {
    q: 'What is EduVia?',
    a: 'EduVia is an online learning platform with hundreds of classes taught by leading experts in writing, business, design, film, music, food, wellness, and science. New classes are added every month.',
  },
  {
    q: 'How much does EduVia cost?',
    a: 'An annual membership is $10 per month, billed once at $120. Monthly membership is $15 per month. Family plans cover up to six profiles.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Cancel in a few clicks from your account settings. Annual members receive a full refund within 30 days, no questions asked.',
  },
  {
    q: 'Can I watch on my TV?',
    a: 'Yes. EduVia is available on smart TVs, streaming devices, phones, tablets, and desktop browsers, and classes can be downloaded for offline viewing.',
  },
  {
    q: 'Do I get a certificate?',
    a: 'Every completed class comes with a shareable certificate of completion you can add to your portfolio or CV.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Start with 7 days free. You will not be charged until the trial ends, and you can cancel any time before then.',
  },
];

/* Rotated by the sticky CTA bar. */
export const STICKY_VERBS = ['walk', 'commute', 'cook', 'clean', 'exercise', 'travel', 'unwind'];

export const FOOTER_COLUMNS = [
  { title: 'Learn', links: [{ label: 'All classes', to: '/browse' }, { label: 'New releases', to: '/browse' }, { label: 'Instructors', to: '/browse' }, { label: 'Categories', to: '/browse' }, { label: 'Certificates', to: '/certificates' }] },
  { title: 'Company', links: [{ label: 'About', to: '/' }, { label: 'Careers', to: '/support' }, { label: 'Press', to: '/support' }, { label: 'For teams', to: '/support' }, { label: 'Gift a membership', to: '/checkout' }] },
  { title: 'Support', links: [{ label: 'Help centre', to: '/support' }, { label: 'Contact us', to: '/support' }, { label: 'Account', to: '/settings' }, { label: 'Billing', to: '/billing' }, { label: 'Status', to: '/support' }] },
  { title: 'Legal', links: [{ label: 'Terms of use', to: '/terms' }, { label: 'Privacy policy', to: '/privacy' }, { label: 'Cookie policy', to: '/cookies' }, { label: 'Subscriber agreement', to: '/terms' }] },
];
