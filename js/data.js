/* =====================================================================
   AMA at VCU  |  site content
   Everything the site shows lives in this one file so the board can edit
   it without touching the layout. Dates are ISO (YYYY-MM-DD). Times are
   plain text. Anything marked DEMO is placeholder data to replace.
   ===================================================================== */
window.AMA = {

  org: {
    name: "American Marketing Association at VCU",
    short: "AMA at VCU",
    handle: "@amavcu",
    tagline: "Define your brand.",
    blurb: "The only marketing organization at Virginia Commonwealth University. Workshops, speakers, coffee chats, competitions and a crew of marketers who show up for each other.",
    founded: 1983,
    reinstated: 2008,
    email: "amavcuchapter@gmail.com",
    address: "907 Floyd Avenue, Richmond, VA 23284",
    advisor: { name: "Katie Gilstrap", title: "Faculty Advisor, VCU School of Business" },
    year: "2026-27"
  },

  links: {
    instagram: "https://www.instagram.com/amavcu/",
    facebook: "https://www.facebook.com/AMAVCU/",
    linkedin: "https://www.linkedin.com/company/amavcu",
    tiktok: "https://linktr.ee/AMAVCUChapter",            // TikTok handle not public yet; Linktree lists it
    linktree: "https://linktr.ee/AMAVCUChapter",
    groupme: "https://web.groupme.com/join_group/116731081/YzRrWt4Q",
    ramsconnect: "https://ramsconnect.vcu.edu/amavcu/",
    ramsconnectEvents: "https://ramsconnect.vcu.edu/amavcu/events-/",
    ramsconnectJoin: "https://vcu.campusgroups.com/amavcu/club_signup",
    memberResources: "https://vcu.campusgroups.com/amavcu/member-resources/",
    newsletterArchive: "https://ramsconnect.vcu.edu/amavcu/newsletter/",
    becomeMember: "https://forms.gle/NbaC8HRNUbNTxygN6",
    iccApplication: "https://forms.gle/GPcgMtEidWMMSVBe9",
    accomplishmentForm: "https://docs.google.com/forms/d/e/1FAIpQLSdTWdUe3E26Nu-ffnTGv-89E8BS9Kvpy1E__Non8R1-1hF81Q/viewform",
    googleCalendar: "https://calendar.google.com/calendar/u/0?cid=ZjQxYmRiNWZmYWFiYTZmNWNjZTRiOGVhZDhlZWRhZjFkYzZkMWUyODI4NzA0MDM3NThhM2U5NjE2MDdkOGFmY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t",
    amaRichmond: "https://amarichmond.org",
    amaNational: "https://www.ama.org",
    amaCollegiate: "https://www.ama.org/collegiate-events/",
    venmo: "https://venmo.com/u/kayla_joylee",
    cashapp: "https://cash.app/$candaceh13",
    vcuBlogCleanSweep: "https://blogs.vcu.edu/business/2024/07/23/clean-sweep-vcu-ama-chapter-students-make-history-take-top-three-at-international-conference/",
    icc2026Results: "https://www.ama.org/press-releases/2026-international-collegiate-conference-award-winners-announced-by-the-american-marketing-association/"
  },

  /* Home page background. Set `video` to a campus b-roll mp4 to use it instead of
     the photos. Photos come from Wikimedia Commons; keep the credits with them. */
  hero: {
    video: "",
    secondsPerSlide: 9,
    slides: [
      { src: "assets/img/campus/compass.webp", alt: "The Compass and Cabell Library", credit: "Jeff Auth", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:VCU_Cabell_Library_by_Jeff_Auth.jpg" },
      { src: "assets/img/campus/vcu-letters.webp", alt: "The VCU letters at Shafer Court", credit: "Jeff Auth", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:VCU_Shafer_Court_letters_by_Jeff_Auth.jpg" },
      { src: "assets/img/campus/snead-hall.webp", alt: "Snead Hall, home of the School of Business", credit: "Jeff Auth", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:VCU_Snead_Hall_by_Jeff_Auth.JPG" },
      { src: "assets/img/campus/linden-walk.webp", alt: "Linden Street walkway into the Commons plaza", credit: "Will Weaver", license: "CC BY-SA 2.0", url: "https://commons.wikimedia.org/wiki/File:VirginiaCommonwealthUniversity.jpg" }
    ]
  },

  /* Recruitment video on the home page. Fill ONE of these: a YouTube id, an
     Instagram reel URL, or an mp4 path. Leave all empty to show the poster. */
  video: {
    youtube: "",
    instagram: "",
    mp4: "",
    poster: "assets/img/board-group.webp",
    title: "Why AMA? Watch the recruitment video"
  },

  /* Idea drop box + feedback. Paste a Google Form "embed" URL to show the real
     form inline; otherwise the site opens a pre-filled email to the chapter. */
  forms: {
    ideaBoxEmbed: "",
    feedbackEmbed: "",
    surveys: [
      { title: "Become an Official Member", note: "Membership form", url: "https://forms.gle/NbaC8HRNUbNTxygN6" },
      { title: "AMA ICC 2027 Application", note: "Apply to travel with the chapter", url: "https://forms.gle/GPcgMtEidWMMSVBe9" },
      { title: "Student Accomplishment Form", note: "Tell us about your internship, offer or award", url: "https://docs.google.com/forms/d/e/1FAIpQLSdTWdUe3E26Nu-ffnTGv-89E8BS9Kvpy1E__Non8R1-1hF81Q/viewform" },
      { title: "Marketing Mixer at Saxbys", note: "Attendance form", url: "https://docs.google.com/forms/d/e/1FAIpQLSeJL4yGFpPD2nKMmWcYvDqvdoO7zf4Ai-Ue29J2ZNihGEqlsA/viewform" },
      { title: "Speaker Event #2, Nightingale", note: "Attendance form", url: "https://forms.gle/hmKXVkpMG3rx6NbE7" },
      { title: "Marketing YOU Headshots", note: "Attendance form", url: "https://forms.gle/djtyhgtSQqQFdof17" },
      { title: "Mocktails and Marketing Trivia", note: "Attendance form", url: "https://docs.google.com/forms/d/e/1FAIpQLSeoUV5HMFP0ezX6ONVOhuV9nbv52CcDdlC3N8e3Rf-yXtEOog/viewform" },
      { title: "AMA x Ad Club Competition", note: "Attendance form", url: "https://docs.google.com/forms/d/e/1FAIpQLSfplMknyWlCHafwnn7AJjBUrp8qAQQoMcyC8XyltwZGEkFoZQ/viewform" }
    ]
  },

  membership: {
    dues: 55, duesNational: 30, duesChapter: 25,
    duesDeadline: "October 1 (rolling, join any time)",
    activePoints: 200,
    pointsNote: "Point values for each event type live in the Membership Point System document under Member Resources on RamsConnect.",
    knownPoints: [
      { what: "Community service (Richmond SPCA volunteer shift)", pts: 15 },
      { what: "Reach Active Member status", pts: 200, isGoal: true }
    ],
    steps: [
      { t: "Join on RamsConnect", d: "Every event registration runs through RamsConnect, so this comes first." },
      { t: "Pay dues", d: "$55 for the year: $30 to AMA national, $25 to the chapter. Dues cover catering, supplies and event materials. Financial need? Email the board and we will work it out." },
      { t: "Hop in the GroupMe", d: "Reminders, polls, last-minute rides to coffee chats." },
      { t: "Show up", d: "Every event earns points. Hit 200 and you are an Active Member with a say in the chapter." }
    ]
  },

  pillars: [
    { key: "pro", name: "Professional Development", emoji: "🎤",
      img: "assets/img/gallery/mw-13.webp",
      short: "Speakers, workshops, headshots and competition prep.",
      body: "Guest speakers like former Four Seasons VP of Marketing David Crowl, study groups before exams, free professional headshots during Marketing YOU, and coaching for the Perfect Pitch and Sales competitions at ICC. This is the resume-building half of AMA." },
    { key: "community", name: "Community & Social Impact", emoji: "🐾",
      img: "assets/img/gallery/mw-14.webp",
      short: "Volunteering and collabs that give back to Richmond.",
      body: "Our first service event of the year is a volunteer shift at the Richmond SPCA. Expect more hands-on service days, partnerships with other VCU orgs like the Ad Club, and points for every hour you give." },
    { key: "fund", name: "Fundraising", emoji: "💛",
      img: "assets/img/gallery/mw-12.webp",
      short: "Raffles, mocktail nights and merch that send us to ICC.",
      body: "Raffles at interest meetings, merch drops and themed nights fund the trip to the International Collegiate Conference and keep events catered. Every dollar raised goes back into the chapter." },
    { key: "member", name: "Membership", emoji: "☕",
      img: "assets/img/gallery/mw-11.webp",
      short: "Coffee chats, interest meetings and a points system that rewards showing up.",
      body: "Biweekly coffee chats are the no-commitment way in. Interest meetings, GroupMe and the points leaderboard keep it going. 200 points makes you an Active Member." },
    { key: "comms", name: "Communications", emoji: "📣",
      img: "assets/img/gallery/mw-02.webp",
      short: "Instagram, the monthly newsletter and this site.",
      body: "Our Director of Social Media and Director of Communications run @amavcu, the monthly newsletter and chapter announcements. Want to build a content portfolio? This is where to volunteer." }
  ],

  board: [
    { slug: "kayla-lee", name: "Kayla Lee", role: "President", year: "Senior", major: "Marketing / Sales",
      goal: "To use creativity and passion in marketing.", fun: "I love pickle ball!", sticker: "stars", linkedin: "" },
    { slug: "bryce-langhorne", name: "Bryce Langhorne", role: "Vice President of Events & Operations", year: "Senior", major: "Marketing",
      goal: "Product marketing.", fun: "I'm really into bonsai trees!", sticker: "bang", linkedin: "" },
    { slug: "candace-heath", name: "Candace Heath", role: "Director of Finance", year: "Junior", major: "Finance",
      goal: "Financial analyst.", fun: "I am a self-taught hair stylist!", sticker: "sun", linkedin: "" },
    { slug: "heather-pham", name: "Heather Pham", role: "Director of Community Outreach", year: "Senior", major: "Marketing / Sales",
      goal: "Work within the corporate beauty industry or own my own business.", fun: "I love to cook and bake!", sticker: "sparkle", linkedin: "" },
    { slug: "ceddy-polk", name: "Ceddy Polk", role: "Director of Membership", year: "Junior", major: "Marketing / Management",
      goal: "Working in media and PR for high-level clients.", fun: "Mozzarella sticks are my favorite food!", sticker: "stars", linkedin: "" },
    { slug: "elizabeth-mccormack", name: "Elizabeth McCormack", role: "Director of Communications", year: "Senior", major: "Marketing / Sales",
      goal: "Entertainment or sports marketing.", fun: "My favorite hobby is skiing!", sticker: "bang", linkedin: "" },
    { slug: "grace-bradbury", name: "Grace Bradbury", role: "Director of Social Media", year: "Sophomore", major: "Marketing / Sales",
      goal: "Creative director at a marketing or advertising firm.", fun: "I write my own music.", sticker: "sun", linkedin: "" },
    { slug: "anisa-chowdhury", name: "Anisa Chowdhury", role: "Director of Fundraising", year: "Junior", major: "Finance",
      goal: "Financial underwriter.", fun: "I am trilingual!", sticker: "sparkle", linkedin: "" },
    { slug: "giulia-da-rocha", name: "Giulia da Rocha", role: "Senior Advisor", year: "Senior", major: "Marketing / Management & Entrepreneurship",
      goal: "Creative project manager.", fun: "I have a radio show on WVCW.org!", sticker: "stars", linkedin: "" }
  ],

  /* Events. Future events deliberately carry NO location or registration link:
     people register on RamsConnect to see where it is. Past events can keep
     their location for the record. `points` is optional. `img` is optional art. */
  events: [
    { id: "icc27", date: "2027-04-08", end: "2027-04-10", title: "AMA International Collegiate Conference", time: "3 days", type: "conference",
      blurb: "The big one. 1,600+ marketing students, competitions, keynotes and a chapter trip to New Orleans. Applications are open now.", img: "", cta: { label: "Apply for ICC 2027", url: "https://forms.gle/GPcgMtEidWMMSVBe9" } },
    { id: "spca", date: "2026-10-16", title: "Volunteer at the Richmond SPCA", time: "10:00 AM to 12:00 PM", type: "service", points: 15,
      blurb: "Our first community service event ever. Meet adorable furry friends and earn 15 membership points. Eight volunteer spots, so register soon.", img: "assets/img/flyers/spca.webp" },
    { id: "coffee-next", tba: true, date: "", title: "Next Coffee Chat", time: "Sundays, 12 to 2 PM", type: "coffee",
      blurb: "Coffee chats run every other Sunday at a different Richmond cafe. The next one is announced on Instagram and RamsConnect." },
    { id: "mw-fri", date: "2026-10-09", title: "Marketing Mixer Coffee Chat", time: "1:00 to 5:00 PM", place: "Saxbys", type: "coffee", series: "Marketing Week",
      blurb: "Marketing Week wrapped with an afternoon mixer at Saxbys." },
    { id: "mw-thu-pm", date: "2026-10-08", title: "Social Media Unfiltered: Lucas Lee", time: "6:00 to 7:30 PM", place: "Snead Hall, Room B1115", type: "speaker", series: "Marketing Week",
      blurb: "Guest speaker Lucas Lee, Social Media Manager and Graphic Designer at Nightingale Ice Cream Sandwiches." },
    { id: "mw-thu-am", date: "2026-10-08", title: "AMA Richmond: The Influencer Effect", time: "8:30 to 10:30 AM", place: "The Workshop by T&D", type: "speaker", series: "Marketing Week",
      blurb: "A morning session with the professional chapter, AMA Richmond." },
    { id: "mw-wed", date: "2026-10-07", title: "Marketing YOU: Headshots", time: "12:00 to 5:00 PM", place: "Snead Hall Courtyard", type: "pro", series: "Marketing Week",
      blurb: "Build your brand, one headshot at a time. Free professional headshots in the courtyard.", img: "assets/img/gallery/t/mw-13.webp" },
    { id: "mw-tue", date: "2026-10-06", title: "Mocktails & Marketing Trivia", time: "6:00 to 7:30 PM", place: "Snead Hall, Room B2165", type: "social", series: "Marketing Week",
      blurb: "Trivia, mocktails and a very competitive room.", img: "assets/img/gallery/t/mw-05.webp" },
    { id: "mw-mon", date: "2026-10-05", title: "AMA x Ad Club Marketing Competition", time: "7:00 to 9:00 PM", place: "Snead Hall, Room B2165", type: "competition", series: "Marketing Week",
      blurb: "Teams pitched briefs head to head with the Advertising Club at VCU. May the best brief win.", img: "assets/img/gallery/t/mw-04.webp" },
    { id: "mot-due", date: "2026-10-02", title: "Marketers of Tomorrow applications due", time: "End of day", type: "deadline",
      blurb: "Applications for our student agency closed for the fall cohort.", img: "assets/img/flyers/mot-apps.webp" },
    { id: "crowl", date: "2026-09-29", title: "Speaker Event with David Crowl", time: "6:00 to 8:00 PM", place: "Snead Hall, Room 3187-89", type: "speaker",
      blurb: "Former VP of Marketing at Four Seasons and VCU alumnus on marketing the golden rule. Food was provided.", img: "assets/img/flyers/speaker-crowl.webp" },
    { id: "coffee-blanchards", date: "2026-09-27", title: "Coffee Chat at Blanchard's", time: "12:00 to 2:00 PM", place: "26 N Morris St", type: "coffee",
      blurb: "Biweekly coffee chat, no commitment, just come hang.", img: "assets/img/flyers/coffee-blanchards.webp" },
    { id: "study", date: "2026-09-17", title: "Study Group", time: "6:00 to 8:00 PM", place: "Snead Hall, Room 3187", type: "pro",
      blurb: "Snacks, laptops and midterm prep with people in your classes.", img: "assets/img/flyers/study-group.webp" },
    { id: "coffee-pit", date: "2026-09-13", title: "Coffee Chat at The Pit and Peel", time: "12:00 to 2:00 PM", place: "1210 W Main St", type: "coffee",
      blurb: "First coffee chat of the year.", img: "assets/img/flyers/coffee-pit-and-peel.webp" },
    { id: "interest-virtual", date: "2026-09-11", title: "Virtual Interest Meeting", time: "Evening", place: "Zoom", type: "gbm",
      blurb: "Missed the first interest meeting? This one was online." },
    { id: "interest", date: "2026-09-08", title: "Interest Meeting", time: "Evening", place: "Snead Hall", type: "gbm",
      blurb: "So many new faces. Raffle winners went home with AMA merch.", img: "assets/img/gallery/t/im-01.webp" },
    { id: "donuts", date: "2026-09-03", title: "Donuts with the Dean and Directors", time: "Morning", place: "Snead Hall", type: "social",
      blurb: "Donuts, the Dean, the directors and a lot of new faces to kick off the year.", img: "assets/img/gallery/t/dn-04.webp" }
  ],

  eventTypes: {
    coffee: { label: "Coffee chat", color: "#F4B223" },
    speaker: { label: "Speaker", color: "#8FB6FF" },
    pro: { label: "Pro development", color: "#B6E3C6" },
    social: { label: "Social", color: "#FFB3C7" },
    competition: { label: "Competition", color: "#FFD468" },
    service: { label: "Service", color: "#C9B8FF" },
    gbm: { label: "Meeting", color: "#FFE9A8" },
    deadline: { label: "Deadline", color: "#FF8F7A" },
    conference: { label: "Conference", color: "#F4B223" }
  },

  icc: {
    name: "AMA International Collegiate Conference",
    short: "ICC 2027",
    start: "2027-04-08T09:00:00-05:00",
    end: "2027-04-10",
    city: "New Orleans, LA",
    dates: "April 8 to 10, 2027",
    about: "Every spring, more than 1,600 students from 150+ AMA collegiate chapters meet for three days of competitions, keynotes, recruiters and a lot of networking. VCU sends a delegation every year, and lately we have been coming home with hardware.",
    competitions: ["Perfect Pitch", "Sales Competition", "Case Competition", "Marketing Strategy", "Digital Marketing", "Marketing Business Simulation", "Design Lab Marketing"],
    results: [
      { year: 2026, city: "Chicago, IL", dates: "March 12 to 14, 2026", source: "https://www.ama.org/press-releases/2026-international-collegiate-conference-award-winners-announced-by-the-american-marketing-association/",
        wins: [
          { comp: "Perfect Pitch", place: 1, who: "Madison Silcox" },
          { comp: "Perfect Pitch", place: 2, who: "Mohamed Turay" },
          { comp: "Perfect Pitch", place: 3, who: "Kayla Lee" },
          { comp: "Perfect Pitch", place: 5, who: "Kaarthika Vinayak" },
          { comp: "Perfect Pitch", place: 9, who: "Russell Magpayo" },
          { comp: "Sales Competition", place: 2, who: "Adam Hvitfeldt-Matthews" },
          { comp: "Sales Competition", place: 3, who: "Victoria Adams" },
          { comp: "Design Lab Marketing Competition", place: 1, who: "Team VCU" }
        ] },
      { year: 2024, city: "New Orleans, LA", dates: "April 11 to 13, 2024", source: "https://blogs.vcu.edu/business/2024/07/23/clean-sweep-vcu-ama-chapter-students-make-history-take-top-three-at-international-conference/",
        note: "A clean sweep of the Insight Global Perfect Pitch podium, out of roughly 700 competitors from 300 chapters.",
        wins: [
          { comp: "Perfect Pitch", place: 1, who: "Adam Hvitfeldt-Matthews" },
          { comp: "Perfect Pitch", place: 2, who: "Mohamed Turay" },
          { comp: "Perfect Pitch", place: 3, who: "Jackson Craiker" },
          { comp: "Sherwin-Williams Role Play", place: 4, who: "Jianna John" },
          { comp: "Perfect Pitch top 60", place: 0, who: "Kate Blackwell and Liam Kavanagh" }
        ] }
    ]
  },

  /* Member accomplishments. Real ones first; the form link lets members add theirs. */
  accomplishments: [
    { cat: "award", who: "Madison Silcox", what: "1st place, Perfect Pitch", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Mohamed Turay", what: "2nd place, Perfect Pitch (two years running on the podium)", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Kayla Lee", what: "3rd place, Perfect Pitch", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Adam Hvitfeldt-Matthews", what: "2nd place, Sales Competition", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Victoria Adams", what: "3rd place, Sales Competition", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Team VCU", what: "1st place, Design Lab Marketing Competition", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Kaarthika Vinayak", what: "5th place, Perfect Pitch", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Russell Magpayo", what: "9th place, Perfect Pitch", where: "AMA ICC 2026, Chicago", when: "March 2026" },
    { cat: "award", who: "Jianna John", what: "4th of 300+ in the Sherwin-Williams Role Play", where: "AMA ICC 2024, New Orleans", when: "April 2024" },
    { cat: "internship", who: "Your name here", what: "Landed an internship? Tell us where and we will feature it.", where: "Submit with the form", when: "", placeholder: true },
    { cat: "job", who: "Your name here", what: "Signed an offer? Same deal. We love a brag.", where: "Submit with the form", when: "", placeholder: true }
  ],
  accomplishmentCats: { award: "Awards", internship: "Internships", job: "Job offers", other: "Other wins" },

  opportunities: [
    { title: "AMA Richmond", d: "Our professional chapter. Events, mentors and a job board a few blocks away.", url: "https://amarichmond.org" },
    { title: "AMA Collegiate events and scholarships", d: "National competitions, scholarships and the ICC schedule.", url: "https://www.ama.org/collegiate-events/" },
    { title: "VCU Career Services", d: "Resume reviews, Handshake postings and career fairs.", url: "https://careers.vcu.edu/" },
    { title: "Marketers of Tomorrow", d: "Our in-house agency. Real clients, real portfolio pieces.", route: "#/agency" }
  ],

  /* DEMO leaderboard. Replace with the real export from the points tracker.
     `seed` just picks a face for the avatar. */
  leaderboard: {
    demo: true,
    updated: "2026-10-12",
    members: [
      { name: "Jordan R.", pts: 165, seed: 3 },
      { name: "Priya S.", pts: 150, seed: 11 },
      { name: "Marcus T.", pts: 135, seed: 7 },
      { name: "Elena V.", pts: 120, seed: 5 },
      { name: "Sam K.", pts: 110, seed: 9 },
      { name: "Aaliyah M.", pts: 95, seed: 2 },
      { name: "Noah P.", pts: 80, seed: 13 },
      { name: "Chloe W.", pts: 75, seed: 6 },
      { name: "Diego L.", pts: 60, seed: 4 },
      { name: "Hana O.", pts: 45, seed: 12 }
    ]
  },

  agency: {
    name: "Marketers of Tomorrow",
    tagline: "AMA at VCU's student-run agency.",
    pitch: "Gain experience and work with real clients. Small teams, a real brief, a real deliverable, and a portfolio piece with your name on it.",
    status: "Fall 2026 applications closed October 2. The spring cohort opens on Instagram and the Linktree.",
    applyUrl: "https://linktr.ee/AMAVCUChapter",
    how: [
      { t: "Apply", d: "A short application each semester. No portfolio required, just interest and follow-through." },
      { t: "Get matched", d: "Teams of 3 to 5 are paired with a local business, nonprofit or campus org." },
      { t: "Do the work", d: "Research, strategy, content, design. Weekly check-ins with a board lead." },
      { t: "Present", d: "Pitch the final deliverable to the client. Add it to your resume and LinkedIn." }
    ],
    roles: ["Account lead", "Strategist", "Content creator", "Designer", "Analyst"]
  },

  newsletter: {
    current: {
      month: "October 2026",
      issue: "Issue 14",
      intro: "Marketing Week is in the books, our first-ever service event is next week, and ICC 2027 applications are open. Here is everything you need this month.",
      sections: [
        { h: "What happened", items: [
          "Marketing Week (Oct 5 to 9): the AMA x Ad Club Marketing Competition, Mocktails & Marketing Trivia, Marketing YOU headshots, Social Media Unfiltered with AMA Richmond and Nightingale's Lucas Lee, and a Saxbys mixer to close it out.",
          "David Crowl, former VP of Marketing at Four Seasons, spoke on marketing the golden rule on Sept 29.",
          "Coffee chats at The Pit and Peel and Blanchard's. Thank you to everyone who showed up on a Sunday."
        ] },
        { h: "Coming up", items: [
          "Volunteer at the Richmond SPCA on Friday, Oct 16, 10 AM to 12 PM. Eight spots, 15 points. Register on RamsConnect to see the meeting details.",
          "Coffee chats continue every other Sunday. Watch Instagram for the next cafe.",
          "ICC 2027 is April 8 to 10 in New Orleans. Applications are open now and the chapter travels together."
        ] },
        { h: "Reminders", items: [
          "Dues are $55 for the year ($30 national, $25 chapter). The Oct 1 deadline is rolling, so you can still join.",
          "Got an internship, offer or award? Submit it with the Student Accomplishment form and we will feature you.",
          "Marketers of Tomorrow applications closed Oct 2. Spring round coming."
        ] }
      ],
      spotlight: { h: "Spotlight: ICC 2026", p: "Five VCU names in the Perfect Pitch top ten, two on the Sales Competition podium, and first place in the Design Lab Marketing Competition. Chicago was good to us." }
    },
    archive: [
      { month: "March 2026", date: "2026-03-02" },
      { month: "February 2026", date: "2026-02-02" },
      { month: "January 2026", date: "2026-01-21" },
      { month: "December 2025", date: "2025-12-04" },
      { month: "November 2025", date: "2025-11-05" },
      { month: "October 2025", date: "2025-10-01" },
      { month: "September 2025", date: "2025-09-01" }
    ]
  },

  posts: [
    { slug: "marketing-week-2026", date: "2026-10-12", tag: "ICYMI", title: "Marketing Week, recapped",
      dek: "Five days, six events, one very competitive trivia night.",
      cover: "assets/img/gallery/mw-04.webp", thumb: "assets/img/gallery/t/mw-04.webp",
      body: [
        "Marketing Week kicked off Monday with the AMA x Ad Club Marketing Competition in Snead Hall. Teams got a brief, a clock and a room full of people who wanted to win. May the best brief win, and it did: certificates went home with the top team.",
        "Tuesday was Mocktails & Marketing Trivia. The mocktail bar was a hit, the trivia was harder than anyone expected, and a few tables are still disputing the final round.",
        "Wednesday, Marketing YOU turned the Snead Hall Courtyard into a photo studio. Build your brand, one headshot at a time. If you got one, update your LinkedIn.",
        "Thursday was Social Media Unfiltered: a morning with AMA Richmond on The Influencer Effect at The Workshop by T&D, then an evening talk from Lucas Lee, Social Media Manager and Graphic Designer at Nightingale Ice Cream Sandwiches.",
        "Friday closed it out with the Marketing Mixer Coffee Chat at Saxbys. Part 2 of the photo dump is coming to Instagram. Thank you to the Advertising Club at VCU for the collab."
      ], gallery: ["mw-02", "mw-03", "mw-04", "mw-05", "mw-06", "mw-08", "mw-10", "mw-13", "mw-14"] },
    { slug: "david-crowl-golden-rule", date: "2026-09-29", tag: "Speakers", title: "Marketing the golden rule with David Crowl",
      dek: "A former VP of Marketing at Four Seasons came back to Snead Hall.",
      cover: "assets/img/flyers/speaker-crowl.webp", thumb: "assets/img/flyers/speaker-crowl.webp",
      body: [
        "David Crowl, former VP of Marketing at Four Seasons and a VCU alumnus, joined us in Snead Hall for an evening on the significance of marketing the golden rule: treat the customer the way you would want to be treated, then build the brand around that.",
        "The room was full, the food was provided, and the Q&A ran long. If you missed it, the next speaker event is already in the works. Register on RamsConnect when it drops."
      ] },
    { slug: "interest-meeting-recap", date: "2026-09-09", tag: "ICYMI", title: "Interest meeting recap",
      dek: "So many new faces. Raffle winners went home with merch.",
      cover: "assets/img/gallery/im-03.webp", thumb: "assets/img/gallery/t/im-03.webp",
      body: [
        "We had a blast getting to see so many new faces at our first interest meeting of the year. The board walked through what AMA is, what the semester looks like, how dues and points work, and why coffee chats are the easiest way in.",
        "Congrats to our raffle winners, who left with AMA shirts and totes. Missed it? A virtual meeting ran that Friday, and coffee chats happen every other Sunday."
      ], gallery: ["im-02", "im-03", "im-04"] },
    { slug: "donuts-with-the-dean", date: "2026-09-04", tag: "ICYMI", title: "Donuts with the Dean and Directors",
      dek: "The sweetest way to start a semester.",
      cover: "assets/img/gallery/dn-04.webp", thumb: "assets/img/gallery/t/dn-04.webp",
      body: [
        "Donuts with the Dean and Directors was AMAzing. We loved getting to socialize with the School of Business leadership and meet students who had never heard of AMA before that morning.",
        "A few of them showed up to the interest meeting four days later, which is the whole point."
      ], gallery: ["dn-02", "dn-03", "dn-04"] },
    { slug: "icc-guide", date: "2026-09-20", tag: "Guide", title: "ICC 2027: what it is and how to get there",
      dek: "Three days in New Orleans with 1,600 marketing students. Here is how the trip works.",
      cover: "assets/img/gallery/mw-14.webp", thumb: "assets/img/gallery/t/mw-14.webp",
      body: [
        "The AMA International Collegiate Conference is the biggest event on the chapter calendar. ICC 2027 runs April 8 to 10 in New Orleans. Students compete in Perfect Pitch, the Sales Competition, case and strategy competitions, and more, and the exhibit hall is full of recruiters.",
        "VCU has a reputation there. In 2024 our chapter swept the Perfect Pitch podium. In 2026 in Chicago, five VCU students placed in the Perfect Pitch top ten, two placed in the Sales Competition, and VCU won the Design Lab Marketing Competition outright.",
        "How to go: fill out the ICC 2027 application on the Linktree, pay dues, keep your points up, and come to the prep sessions. Fundraising covers part of the trip, which is why the raffles and mocktail nights matter."
      ] }
  ],

  gallery: [
    { f: "mw-02", album: "Marketing Week", cap: "AMA x Ad Club night", w: 1600, h: 1067 },
    { f: "mw-04", album: "Marketing Week", cap: "May the best brief win: competition winners", w: 1600, h: 1067 },
    { f: "mw-03", album: "Marketing Week", cap: "A team at work", w: 1600, h: 1067 },
    { f: "mw-05", album: "Marketing Week", cap: "The mocktail bar", w: 1600, h: 1067 },
    { f: "mw-06", album: "Marketing Week", cap: "Trivia night", w: 1600, h: 1067 },
    { f: "mw-07", album: "Marketing Week", cap: "Mocktails & Marketing Trivia", w: 1600, h: 1067 },
    { f: "mw-08", album: "Marketing Week", cap: "Mocktails & Marketing Trivia", w: 1600, h: 1067 },
    { f: "mw-09", album: "Marketing Week", cap: "Trivia faces", w: 1600, h: 1067 },
    { f: "mw-10", album: "Marketing Week", cap: "Table talk", w: 1600, h: 1067 },
    { f: "mw-11", album: "Marketing Week", cap: "Full house", w: 1600, h: 1067 },
    { f: "mw-12", album: "Marketing Week", cap: "Raffle energy", w: 1600, h: 1067 },
    { f: "mw-13", album: "Marketing Week", cap: "Marketing YOU headshots", w: 1600, h: 1066 },
    { f: "mw-14", album: "Marketing Week", cap: "Marketing YOU crew", w: 1600, h: 1066 },
    { f: "im-01", album: "Interest Meeting", cap: "Interest meeting recap", w: 1080, h: 1080 },
    { f: "im-02", album: "Interest Meeting", cap: "First meeting of the year", w: 1080, h: 1080 },
    { f: "im-03", album: "Interest Meeting", cap: "New faces", w: 1080, h: 1080 },
    { f: "im-04", album: "Interest Meeting", cap: "Raffle winners", w: 1080, h: 1080 },
    { f: "dn-02", album: "Donuts with the Dean", cap: "Donuts with the Dean and Directors", w: 1080, h: 1080 },
    { f: "dn-03", album: "Donuts with the Dean", cap: "Morning crowd", w: 1080, h: 1080 },
    { f: "dn-04", album: "Donuts with the Dean", cap: "Until next time", w: 1080, h: 1080 }
  ],

  faq: [
    { q: "Do I have to be a marketing major?", a: "No. Membership is open to every major. Our ICC winners include psychology, philosophy and information systems majors." },
    { q: "What does it cost?", a: "$55 a year: $30 goes to AMA national (you become a national member too) and $25 to the chapter for catering and supplies. Financial need is never a reason not to join, email us." },
    { q: "Where are events?", a: "Mostly Snead Hall and Richmond cafes. Exact rooms and addresses are on RamsConnect, where you also register." },
    { q: "What is a coffee chat?", a: "A biweekly Sunday hangout at a local cafe, 12 to 2 PM. No agenda, no commitment, just marketers and caffeine." },
    { q: "How do points work?", a: "Every event earns points. Reach 200 and you are an Active Member. The full point sheet is on RamsConnect under Member Resources." },
    { q: "Can I go to ICC as a new member?", a: "Yes. Fill out the ICC application, keep up with dues and points, and come to the prep sessions." }
  ]
};
