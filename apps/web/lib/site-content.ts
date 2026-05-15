import type {
  CourseTrack,
  DashboardMetric,
  MarketingPage,
  ProductCard,
  VocabularyAdvancedOptions,
  VocabularyKeywordSeed,
  VocabularyTopic,
} from "./site-models";

export const productCards: ProductCard[] = [
  {
    slug: "ielts",
    title: "IELTS Speaking Simulator",
    description: "Mock all three IELTS speaking parts with AI scoring, timing, and detailed follow-up guidance.",
    category: "Assessment",
  },
  {
    slug: "ielts-writing",
    title: "IELTS Writing Simulator",
    description: "Review Task 1 and Task 2 responses with band estimates, grammar notes, and structural suggestions.",
    category: "Assessment",
  },
  {
    slug: "jobinterview",
    title: "Mock Job Interview",
    description: "Practice real interview scenarios with adaptive questions and coaching on confidence, fluency, and clarity.",
    category: "Career",
  },
  {
    slug: "leveltest",
    title: "English Level Test",
    description: "Take a 15 to 20 minute speaking test and receive a CEFR-aligned report with next-step recommendations.",
    category: "Assessment",
  },
  {
    slug: "vocabulary-booster",
    title: "Vocabulary Booster",
    description: "Train themed vocabulary with retrieval practice, spaced repetition, and speaking prompts.",
    category: "Vocabulary",
  },
];

export const marketingPages: MarketingPage[] = [
  {
    slug: "ielts",
    title: "IELTS Speaking Simulator",
    eyebrow: "AI Test Prep",
    summary: "Full speaking-part practice with timing, transcript review, and actionable band feedback.",
    heroDescription:
      "Recreate real IELTS speaking conditions with instant scoring, transcript playback, and feedback mapped to fluency, vocabulary, grammar, and coherence.",
    ctaLabel: "Start IELTS Practice",
    bullets: [
      "Three-part practice flows with examiner-style prompts",
      "Band-oriented feedback summaries and next drills",
      "Playback, transcript review, and reusable answer bank",
    ],
  },
  {
    slug: "ielts-writing",
    title: "IELTS Writing Simulator",
    eyebrow: "AI Writing Coach",
    summary: "Task 1 and Task 2 feedback with score estimates, corrections, and structure guidance.",
    heroDescription:
      "Support essay planning, drafting, and revision with targeted suggestions for grammar, cohesion, lexical range, and task response.",
    ctaLabel: "Open Writing Simulator",
    bullets: [
      "Task-specific prompting and rubric-aware scoring",
      "Live rewrite suggestions and correction explanations",
      "Progress snapshots across essays and band criteria",
    ],
  },
  {
    slug: "jobinterview",
    title: "Mock Job Interview",
    eyebrow: "Career Readiness",
    summary: "Role-based interview practice with adaptive questions and AI coaching.",
    heroDescription:
      "Build concise, confident interview answers with industry-specific prompts, follow-up questions, and coaching on fluency and structure.",
    ctaLabel: "Start Mock Interview",
    bullets: [
      "Question sets by role, seniority, and interview style",
      "Feedback on confidence, clarity, and examples",
      "Reusable STAR answer library and score history",
    ],
  },
  {
    slug: "leveltest",
    title: "English Level Test",
    eyebrow: "Placement & Assessment",
    summary: "A fast speaking-based level test with CEFR scoring and a personalized study path.",
    heroDescription:
      "Let learners discover their current English level through an AI-led speaking flow that produces instant diagnostics and recommended practice paths.",
    ctaLabel: "Take Free Level Test",
    bullets: [
      "15 to 20 minute speaking-based placement flow",
      "CEFR-aligned breakdowns and progress recommendations",
      "Shareable results for learners, teachers, or recruiters",
    ],
  },
  {
    slug: "vocabulary-booster",
    title: "Vocabulary Booster",
    eyebrow: "Personalized Practice",
    summary: "Targeted speaking and recall exercises built around useful words and phrases.",
    heroDescription:
      "Strengthen active vocabulary through daily themed exercises, speaking tasks, spaced repetition, and contextual feedback.",
    ctaLabel: "Boost My Vocabulary",
    bullets: [
      "Personalized word sets tied to goals and interests",
      "Speaking prompts that force productive recall",
      "Progress tracking for accuracy, retention, and usage",
    ],
  },
  {
    slug: "about",
    title: "About English Talks",
    eyebrow: "Mission",
    summary: "A platform built to help learners speak English with more confidence in real situations.",
    heroDescription:
      "This starter positions the platform as an AI-first practice system for testing, coaching, and ongoing fluency growth across consumer, school, and enterprise use cases.",
    ctaLabel: "Explore the Platform",
    bullets: [
      "Marketing site plus authenticated learning application",
      "Assessment, practice, reporting, and enterprise workflows",
      "Architecture designed for scale, privacy, and product iteration",
    ],
  },
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Current CEFR", value: "B2", trend: "+1 level in 9 weeks" },
  { label: "Weekly Streak", value: "6 days", trend: "On pace for new badge" },
  { label: "Speaking Score", value: "7.0", trend: "+0.5 vs last month" },
  { label: "Practice Minutes", value: "124", trend: "18 minutes above goal" },
];

export const courseTracks: CourseTrack[] = [
  {
    title: "Conversational English Challenge",
    targetLevel: "A2 to B1",
    pace: "21 days",
    focus: "Daily speaking confidence and everyday vocabulary",
  },
  {
    title: "Business English for Meetings",
    targetLevel: "B1 to C1",
    pace: "4 weeks",
    focus: "Meetings, presentations, and workplace fluency",
  },
  {
    title: "Advanced Speaking Accelerator",
    targetLevel: "B2 to C2",
    pace: "6 weeks",
    focus: "Nuance, persuasion, and high-level speaking control",
  },
];

export const enterpriseHighlights = [
  "Placement testing with CEFR-aligned reporting",
  "Role-based dashboards for HR, trainers, and teachers",
  "Cohort analytics covering fluency, grammar, and vocabulary trends",
  "API-ready architecture for LMS and enterprise integrations",
];

export const vocabularyTopics: VocabularyTopic[] = [
  { slug: "art-culture", title: "Art & Culture", emoji: "🎨", description: "Museums, design, books, music, and creative expression.", category: "Culture" },
  { slug: "news-media", title: "News & Media", emoji: "📰", description: "Current events, journalism, and public communication.", category: "Academic" },
  { slug: "society-politics", title: "Society & Politics", emoji: "💼", description: "Communities, policy, citizenship, and debate.", category: "Academic" },
  { slug: "business-finance", title: "Business & Finance", emoji: "📈", description: "Meetings, markets, budgeting, and workplace language.", category: "Career" },
  { slug: "food-cooking", title: "Food & Cooking", emoji: "🥪", description: "Recipes, ingredients, kitchen habits, and dining.", category: "Lifestyle" },
  { slug: "sport", title: "Sport", emoji: "🏓", description: "Training, teamwork, competition, and healthy routines.", category: "Lifestyle" },
  { slug: "home", title: "Home", emoji: "🏠", description: "Daily routines, chores, comfort, and home improvement.", category: "Lifestyle" },
  { slug: "tech-internet", title: "Tech & Internet", emoji: "📡", description: "Digital life, apps, devices, and online communication.", category: "Career" },
  { slug: "hobby", title: "Hobby", emoji: "🎤", description: "Free-time interests, crafts, gaming, and personal projects.", category: "Lifestyle" },
  { slug: "fashion-clothing", title: "Fashion & Clothing", emoji: "👗", description: "Style, shopping, outfits, and self-expression.", category: "Lifestyle" },
  { slug: "nature-environment", title: "Nature & Environment", emoji: "🌍", description: "Climate, wildlife, sustainability, and ecosystems.", category: "Academic" },
  { slug: "travel-talk", title: "Travel Talk", emoji: "🗺️", description: "Airports, directions, culture exchange, and tourism.", category: "Lifestyle" },
  { slug: "family-relationships", title: "Family & Relationships", emoji: "👨‍👩‍👧", description: "Support, habits, emotions, and social connections.", category: "Lifestyle" },
  { slug: "health-wellness", title: "Health & Wellness", emoji: "🧘", description: "Fitness, sleep, mental health, and self-care.", category: "Lifestyle" },
  { slug: "job-workplace", title: "Job & Workplace", emoji: "🧑‍💼", description: "Roles, interviews, collaboration, and career growth.", category: "Career" },
];

export const defaultVocabularyOptions: VocabularyAdvancedOptions = {
  level: "B1",
  targetMinutes: 8,
  wordCount: 3,
  timerSeconds: 60,
  feedbackMode: "detailed",
  accentFocus: "general",
  includeDefinitions: true,
  includeHints: true,
  includeTimer: true,
  exerciseTypes: ["READ_ALOUD", "KEYWORD_QA", "STORY"],
};

export const vocabularyKeywordBank: Record<string, VocabularyKeywordSeed[]> = {
  "art-culture": [
    { term: "exhibition", definition: "a public display of art or interesting objects", samplePrompt: "Describe an exhibition that stayed in your memory." },
    { term: "heritage", definition: "the traditions, achievements, and culture passed down over time", samplePrompt: "Why is cultural heritage important?" },
    { term: "masterpiece", definition: "an outstanding creative work", samplePrompt: "Talk about a masterpiece you admire." },
  ],
  "news-media": [
    { term: "headline", definition: "the title of a news story", samplePrompt: "What kinds of headlines catch your attention?" },
    { term: "broadcast", definition: "a program sent out on television, radio, or online", samplePrompt: "How do broadcasts shape public opinion?" },
    { term: "source", definition: "the person or place from which information comes", samplePrompt: "Why should we verify sources?" },
  ],
  "society-politics": [
    { term: "policy", definition: "a plan or course of action chosen by a government or organization", samplePrompt: "What makes a good public policy?" },
    { term: "debate", definition: "a formal discussion with different opinions", samplePrompt: "How can debate improve decisions?" },
    { term: "citizen", definition: "a legally recognized member of a country", samplePrompt: "What responsibilities do citizens have?" },
  ],
  "business-finance": [
    { term: "budget", definition: "a plan for spending and saving money", samplePrompt: "How do you manage a budget?" },
    { term: "revenue", definition: "income generated by a business", samplePrompt: "What can help a company increase revenue?" },
    { term: "investment", definition: "money put into something to gain future value", samplePrompt: "What makes an investment worthwhile?" },
  ],
  "food-cooking": [
    { term: "ingredient", definition: "one of the foods used to make a dish", samplePrompt: "What ingredients do you use often?" },
    { term: "flavorful", definition: "full of rich or interesting taste", samplePrompt: "What makes a meal flavorful?" },
    { term: "recipe", definition: "instructions explaining how to prepare a dish", samplePrompt: "Tell me about a recipe you can cook well." },
  ],
  sport: [
    { term: "endurance", definition: "the ability to continue doing something difficult for a long time", samplePrompt: "How can athletes build endurance?" },
    { term: "strategy", definition: "a plan used to achieve success", samplePrompt: "Why is strategy important in sport?" },
    { term: "teamwork", definition: "cooperation between people working together", samplePrompt: "When does teamwork matter most?" },
  ],
  home: [
    { term: "renovation", definition: "the act of improving or repairing a home", samplePrompt: "What kind of renovation would improve your home?" },
    { term: "cozy", definition: "comfortable, warm, and relaxing", samplePrompt: "What makes a room feel cozy?" },
    { term: "routine", definition: "a regular way of doing things", samplePrompt: "Describe your home routine on a weekday." },
  ],
  "tech-internet": [
    { term: "algorithm", definition: "a set of rules used by a computer to solve a problem", samplePrompt: "How do algorithms affect daily life?" },
    { term: "privacy", definition: "the ability to keep personal information protected", samplePrompt: "Why is online privacy important?" },
    { term: "platform", definition: "a digital service used for communication, work, or sharing content", samplePrompt: "Which online platform do you use most?" },
  ],
  hobby: [
    { term: "craft", definition: "an activity that involves making things skillfully by hand", samplePrompt: "What craft or hobby would you like to learn?" },
    { term: "passion", definition: "a strong feeling of enthusiasm for something", samplePrompt: "What hobby are you passionate about?" },
    { term: "collection", definition: "a group of similar things gathered over time", samplePrompt: "Do you collect anything?" },
  ],
  "fashion-clothing": [
    { term: "outfit", definition: "a set of clothes worn together", samplePrompt: "What makes an outfit practical and stylish?" },
    { term: "fabric", definition: "cloth used to make clothes", samplePrompt: "Which fabric is most comfortable for you?" },
    { term: "trend", definition: "a general direction in which something is developing", samplePrompt: "Do you follow fashion trends?" },
  ],
  "nature-environment": [
    { term: "clear-cut", definition: "to remove all the trees from an area", samplePrompt: "What are the effects of clear-cut logging?" },
    { term: "global warming", definition: "the rise in Earth’s temperature caused partly by greenhouse gases", samplePrompt: "How does global warming affect daily life?" },
    { term: "sustainability", definition: "meeting present needs without harming future generations", samplePrompt: "What habits support sustainability?" },
  ],
  "travel-talk": [
    { term: "itinerary", definition: "a plan showing the route and schedule of a trip", samplePrompt: "How do you build a travel itinerary?" },
    { term: "landmark", definition: "a well-known place or building", samplePrompt: "Describe a landmark you want to visit." },
    { term: "journey", definition: "the act of traveling from one place to another", samplePrompt: "Tell me about a memorable journey." },
  ],
  "family-relationships": [
    { term: "supportive", definition: "providing encouragement or help", samplePrompt: "What makes a relationship supportive?" },
    { term: "conflict", definition: "a serious disagreement or argument", samplePrompt: "How should families handle conflict?" },
    { term: "tradition", definition: "a custom or belief passed from one generation to another", samplePrompt: "What family tradition matters to you?" },
  ],
  "health-wellness": [
    { term: "balance", definition: "a healthy state where different parts of life are in harmony", samplePrompt: "How do you keep balance in life?" },
    { term: "nutrition", definition: "the food and substances needed for health", samplePrompt: "What does good nutrition look like?" },
    { term: "recovery", definition: "the process of becoming healthy or strong again", samplePrompt: "Why is recovery important after stress?" },
  ],
  "job-workplace": [
    { term: "deadline", definition: "the time by which something must be finished", samplePrompt: "How do you handle deadlines?" },
    { term: "collaboration", definition: "working together with others", samplePrompt: "Why does collaboration matter at work?" },
    { term: "initiative", definition: "the ability to act independently and take the lead", samplePrompt: "When have you shown initiative?" },
  ],
};
