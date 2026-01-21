// Collaboration data structure for easy scalability
export interface Collaboration {
  id: string;
  slug: string;
  title: string;
  partner: string;
  summary: string;
  coverImage: string;
  heroImage: string;
  date: string;
  timeline: string;
  featured: boolean;
  externalLinks: {
    label: string;
    url: string;
  }[];
  content: {
    overview: string;
    enablements: string[];
    userBenefits: string[];
    milestones: {
      date: string;
      title: string;
      description: string;
    }[];
  };
}

export const collaborations: Collaboration[] = [
  {
    id: '1',
    slug: 'market360-monime',
    title: 'Market360 × Monime',
    partner: 'Monime',
    summary: 'Seamless mobile money payments and wallet funding through USSD technology, enabling secure transactions for all Sierra Leoneans.',
    coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop',
    date: 'January 2026',
    timeline: 'Active Partnership',
    featured: true,
    externalLinks: [
      { label: 'Visit Monime Website', url: 'https://monime.io' },
      { label: 'Learn More About Monime', url: 'https://monime.io/about' },
    ],
    content: {
      overview: `Market360 has partnered with Monime to bring you the most convenient payment experience in Sierra Leone. This collaboration integrates Monime's cutting-edge USSD-based payment infrastructure directly into Market360, allowing users to fund their wallets, make purchases, and withdraw funds seamlessly using their mobile phones.

Monime is Sierra Leone's leading fintech platform, providing secure and accessible financial services to millions of users. By combining Market360's marketplace capabilities with Monime's payment technology, we're creating a truly integrated shopping experience that works for everyone—from urban professionals to rural entrepreneurs.

This partnership represents our commitment to financial inclusion and accessibility, ensuring that everyone can participate in the digital economy regardless of their location or banking status.`,
      enablements: [
        'USSD-based wallet deposits - Simply dial a code to add funds instantly',
        'Automated withdrawal processing - Receive funds directly to your Orange or Africell mobile money account',
        'Real-time transaction tracking - Monitor all your payments and transfers',
        'Secure escrow system - Your payments are protected until order completion',
        'Multi-provider support - Works with all major mobile money providers in Sierra Leone',
        'No internet required for deposits - USSD works on any phone',
      ],
      userBenefits: [
        'Instant wallet funding without visiting a bank or agent',
        'Lower transaction fees compared to traditional methods',
        '24/7 payment processing - no waiting for business hours',
        'Secure transactions protected by industry-standard encryption',
        'Seamless checkout experience within the Market360 app',
        'Automatic refunds to your wallet for cancelled orders',
        'Easy withdrawal to any mobile money number',
      ],
      milestones: [
        {
          date: 'November 2025',
          title: 'Partnership Announced',
          description: 'Market360 and Monime officially announced their strategic partnership to revolutionize e-commerce payments in Sierra Leone.',
        },
        {
          date: 'December 2025',
          title: 'USSD Integration Completed',
          description: 'Successfully integrated Monime\'s USSD payment infrastructure, enabling deposit functionality for all users.',
        },
        {
          date: 'January 2026',
          title: 'Automated Withdrawals Launched',
          description: 'Rolled out instant automated withdrawals to mobile money accounts across all supported providers.',
        },
        {
          date: 'Q1 2026',
          title: 'Enhanced Security Features',
          description: 'Implementation of advanced fraud detection and wallet protection measures to ensure user safety.',
        },
      ],
    },
  },
  {
    id: '2',
    slug: 'community-partners',
    title: 'Community Partner Program',
    partner: 'Local Businesses',
    summary: 'Supporting local entrepreneurs and businesses across Sierra Leone with special marketplace benefits and visibility.',
    coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop',
    date: 'Coming Soon',
    timeline: 'Launching Q2 2026',
    featured: false,
    externalLinks: [],
    content: {
      overview: `Market360 is committed to empowering local businesses and entrepreneurs across Sierra Leone. Our upcoming Community Partner Program will provide special benefits, increased visibility, and dedicated support to help local sellers thrive in the digital marketplace.

This initiative aims to bridge the gap between traditional commerce and e-commerce, giving local businesses the tools and platform they need to reach customers nationwide.`,
      enablements: [
        'Priority listing in search results',
        'Dedicated seller support team',
        'Marketing and promotional assistance',
        'Business development workshops',
        'Reduced platform fees for qualified partners',
      ],
      userBenefits: [
        'Discover authentic local products and services',
        'Support Sierra Leonean entrepreneurs',
        'Access to unique, handcrafted items',
        'Build relationships with trusted local sellers',
      ],
      milestones: [
        {
          date: 'Q2 2026',
          title: 'Program Launch',
          description: 'Official launch of the Community Partner Program with initial partner onboarding.',
        },
      ],
    },
  },
];

export const getCollaborationBySlug = (slug: string): Collaboration | undefined => {
  return collaborations.find(c => c.slug === slug);
};

export const getFeaturedCollaborations = (): Collaboration[] => {
  return collaborations.filter(c => c.featured);
};
