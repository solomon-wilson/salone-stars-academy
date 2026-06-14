// Persistence schema matching ERD
export interface Question {
  questionText: string
  options: string[]
  correctOption: string
  explanation: string
  krioInstruction: string
}

export interface Quest {
  id: string
  title: string
  subject: string
  class_level: string
  points_award: number
  difficulty: string
  questions: Question[]
  source: "default" | "generated" | "bank" | "parent-pack"
  teacherId?: string
  alignedMbsseOutcome?: string
}

export interface SholaMessage {
  role: "shola" | "pupil"
  content: string
  timestamp: string
  xpAwarded?: number
}

export interface SyncedPupil {
  id: string
  name: string
  class_level: string
  points: number
  streak_count: number
  last_active_date: string
  badges_earned: string[]
  synced_at: number
  teacherId?: string
  parentId?: string
  subject_stats?: Record<string, { correct: number; total: number }>
}

export interface PupilInvite {
  code: string
  pupilId: string
  teacherId: string
  createdAt: number
}

export interface SyncLog {
  id: string
  timestamp: number
  pupil_name: string
  delta_points: number
  event_type: string
}

export type SyncedStudent = SyncedPupil

export const INITIAL_QUESTS: Quest[] = [
  // ─── CLASS 1 ───────────────────────────────────────────────────────────────
  {
    id: "m1-1-counting-mangoes",
    title: "Counting Mangoes at Lumley Beach",
    subject: "Mathematics",
    class_level: "Class 1",
    points_award: 50,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P1-MA: Counting and simple addition to 20",
    questions: [
      {
        questionText: "Amie has 3 mangoes in her basket. Fatima gives her 2 more mangoes. How many mangoes does Amie have now?",
        options: ["5 mangoes", "4 mangoes", "6 mangoes", "3 mangoes"],
        correctOption: "5 mangoes",
        explanation: "3 + 2 = 5 mangoes. When we add, we put numbers together to find the total.",
        krioInstruction: "Amie gɛt 3 mango. Fatima gi am 2 mɔ. Wetin i gɛt naw? 3 + 2 = 5 mango!"
      },
      {
        questionText: "There are 8 children playing on Lumley Beach. 3 children go home. How many children are still playing?",
        options: ["5 children", "4 children", "6 children", "11 children"],
        correctOption: "5 children",
        explanation: "8 - 3 = 5 children. When we subtract, we take away from the group to find what is left.",
        krioInstruction: "8 pikin de play. 3 pikin go ose. Aw mɛni pikin lɛf? 8 - 3 = 5 pikin!"
      }
    ]
  },
  {
    id: "s1-1-plants-salone",
    title: "Plants Around Our Home",
    subject: "General Science",
    class_level: "Class 1",
    points_award: 50,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P1-SC: Basic plant parts and their functions",
    questions: [
      {
        questionText: "Which part of a plant takes in water from the soil underground?",
        options: ["The roots", "The leaves", "The flowers", "The stem"],
        correctOption: "The roots",
        explanation: "Roots grow underground and absorb water and nutrients from the soil to feed the plant.",
        krioInstruction: "Wetin pɔl di wata fɔ di graɔn foh di plant? Na di ruts dem! Dem de ondaneet di graɔn."
      },
      {
        questionText: "What do green leaves need from the sun to make food for the plant?",
        options: ["Sunlight", "Rain water only", "Dark shade", "Cold wind"],
        correctOption: "Sunlight",
        explanation: "Leaves use sunlight, water, and air to make food through a process called photosynthesis.",
        krioInstruction: "Di lif dem nyam sunlait foh mek fud foh di plant. Dat na kɔl fotosintesis!"
      }
    ]
  },
  {
    id: "ss1-1-my-family",
    title: "My Family and Community",
    subject: "Social Studies & Civics",
    class_level: "Class 1",
    points_award: 50,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P1-SS: Family roles and community belonging",
    questions: [
      {
        questionText: "Who is the person in your family who gives birth to you and takes care of you?",
        options: ["Your mother", "Your teacher", "Your neighbour", "Your friend"],
        correctOption: "Your mother",
        explanation: "A mother is the woman who gives birth to her children and cares for the family with love.",
        krioInstruction: "Na yu mama de bɔn yu and tek ker foh yu. I de lov yu plɛnti!"
      },
      {
        questionText: "What do we call a group of people living and helping each other in the same area?",
        options: ["A community", "A forest", "A market", "A school"],
        correctOption: "A community",
        explanation: "A community is a group of people living and working together in the same area, helping one another.",
        krioInstruction: "We plɛnti pipul de liv togɛda an elp ɔda, wi kɔl dat wan 'community'. Na wi town!"
      }
    ]
  },
  {
    id: "el1-1-vowels",
    title: "Vowels: A, E, I, O, U",
    subject: "English Language",
    class_level: "Class 1",
    points_award: 50,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P1-EL: Recognising vowels and consonants",
    questions: [
      {
        questionText: "Which of these letters is a VOWEL?",
        options: ["A", "B", "C", "D"],
        correctOption: "A",
        explanation: "The five vowels in the English alphabet are A, E, I, O, and U. All other letters are consonants.",
        krioInstruction: "Di vɔl dɛm na A, E, I, O, U. Ɔl di ɔda lɛta dɛm na kɔnsɔnant!"
      },
      {
        questionText: "The word 'OPEN' starts with which vowel?",
        options: ["O", "A", "E", "I"],
        correctOption: "O",
        explanation: "The word OPEN starts with the letter O, which is one of the five vowels: A, E, I, O, U.",
        krioInstruction: "Di wɔd OPEN stat wit 'O'. O na wan vɔl. Kɛn yu sɛ ɔl faiv vɔl dɛm?"
      }
    ]
  },
  {
    id: "m1-2-sharing",
    title: "Sharing Sweet Potatoes Equally",
    subject: "Mathematics",
    class_level: "Class 1",
    points_award: 60,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P1-MA: Equal sharing as introduction to division",
    questions: [
      {
        questionText: "Ibrahim has 6 sweet potatoes. He shares them equally between himself and his sister. How many does each person get?",
        options: ["3 potatoes", "2 potatoes", "4 potatoes", "6 potatoes"],
        correctOption: "3 potatoes",
        explanation: "6 sweet potatoes shared equally between 2 people: 6 ÷ 2 = 3 potatoes each.",
        krioInstruction: "Ibrahim gɛt 6 sɔt pateto. I mek tu pat foh im an in sista. Aw mɛni ɛch wan gɛt? 6 ÷ 2 = 3!"
      },
      {
        questionText: "Mama has 10 groundnuts. She puts them into 2 equal groups. How many groundnuts are in each group?",
        options: ["5 groundnuts", "4 groundnuts", "8 groundnuts", "10 groundnuts"],
        correctOption: "5 groundnuts",
        explanation: "10 groundnuts divided into 2 equal groups = 5 groundnuts in each group. 10 ÷ 2 = 5.",
        krioInstruction: "10 graɔnnat divaid bai 2 = 5 foh ɛch gruf. Mama glad sey i mek am ɛkwɔl!"
      }
    ]
  },

  // ─── CLASS 2 ───────────────────────────────────────────────────────────────
  {
    id: "m2-1-addition-market",
    title: "Adding Peppers at Kenema Market",
    subject: "Mathematics",
    class_level: "Class 2",
    points_award: 70,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P2-MA: Two-digit addition without regrouping",
    questions: [
      {
        questionText: "A market seller has 23 peppers in one tray and 14 peppers in another tray. How many peppers does she have in total?",
        options: ["37 peppers", "27 peppers", "34 peppers", "47 peppers"],
        correctOption: "37 peppers",
        explanation: "23 + 14 = 37 peppers. Add the units first: 3+4=7, then the tens: 2+1=3, giving 37.",
        krioInstruction: "23 papɛ plos 14 papɛ = 37 papɛ. Fɔst yus di wan dɛm, dɛn di tɛn dɛm. 3+4=7, 2+1=3 = 37!"
      },
      {
        questionText: "A Class 2 school has 15 boys and 22 girls. How many pupils are there altogether?",
        options: ["37 pupils", "30 pupils", "33 pupils", "40 pupils"],
        correctOption: "37 pupils",
        explanation: "15 + 22 = 37 pupils. Units: 5+2=7, Tens: 1+2=3, Total = 37.",
        krioInstruction: "15 bɔyz plos 22 gɔlz = 37 pikin. 5+2=7 fɔ di wan, 1+2=3 fɔ di tɛn. Wi gɛt 37!"
      }
    ]
  },
  {
    id: "s2-1-animals-salone",
    title: "Wild Animals of Sierra Leone",
    subject: "General Science",
    class_level: "Class 2",
    points_award: 80,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P2-SC: Classifying animals by features",
    questions: [
      {
        questionText: "The chimpanzee lives in Sierra Leone's rainforests. Is the chimpanzee a mammal or a fish?",
        options: ["A mammal", "A fish", "An insect", "A reptile"],
        correctOption: "A mammal",
        explanation: "Chimpanzees are mammals — they have hair, give birth to live young, and feed their babies milk.",
        krioInstruction: "Chimpanzee na mɛmɔl. I gɛt yɛ, bɔn im pikin alayv, an i gi dem mɔlk. Nɔ fish am!"
      },
      {
        questionText: "Which animal lives in water and uses gills to breathe?",
        options: ["A fish", "A dog", "A monkey", "A bat"],
        correctOption: "A fish",
        explanation: "Fish live in water and breathe using gills, which absorb oxygen directly from the water.",
        krioInstruction: "Fish de liv na wata an i yus gil foh brɛt. Di gil tek oksijin fɔh di wata. Dat na aw fish sɔvaiv!"
      }
    ]
  },
  {
    id: "ss2-1-community-helpers",
    title: "People Who Help Our Town",
    subject: "Social Studies & Civics",
    class_level: "Class 2",
    points_award: 70,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P2-SS: Community helpers and their roles",
    questions: [
      {
        questionText: "Who do you visit when you are sick and need medicine?",
        options: ["A doctor or nurse", "A teacher", "A farmer", "A fisherman"],
        correctOption: "A doctor or nurse",
        explanation: "Doctors and nurses work in hospitals and clinics to help sick people get better.",
        krioInstruction: "Wen yu sik, go si di dɔkta ɔ nos. Dem de wok na aspital foh mek yu bɛta. Dem elp wi!"
      },
      {
        questionText: "Who teaches children to read, write, and count at school?",
        options: ["A teacher", "A soldier", "A driver", "A carpenter"],
        correctOption: "A teacher",
        explanation: "Teachers are important community helpers who educate children in schools every day.",
        krioInstruction: "Di ticha na wan impɔtant pɔsin na wi kɔmyuniti. I lɛn wi rid, rait, an kaɔnt. Tɛnki ticha!"
      }
    ]
  },
  {
    id: "el2-1-sentences",
    title: "Building Simple Sentences",
    subject: "English Language",
    class_level: "Class 2",
    points_award: 70,
    difficulty: "Easy",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P2-EL: Sentence structure and punctuation",
    questions: [
      {
        questionText: "Which of these is a complete sentence?",
        options: ["The dog runs fast.", "Running fast dog.", "Fast the dog.", "Dog fast runs."],
        correctOption: "The dog runs fast.",
        explanation: "A sentence needs a subject (the dog) and a verb (runs). It starts with a capital letter and ends with a full stop.",
        krioInstruction: "Wan gɔd sɛntɛns nid wan sabdʒekt (di dɔg) an wan vɛb (runs). I stat bɪg lɛta an ɛnd wit fɔl stɔp."
      },
      {
        questionText: "What punctuation mark goes at the END of a question?",
        options: ["A question mark ?", "A full stop .", "A comma ,", "An exclamation mark !"],
        correctOption: "A question mark ?",
        explanation: "Questions always end with a question mark (?). For example: What is your name?",
        krioInstruction: "Ɔltem wen yu aks kwɛschɔn, put kwɛschɔn mak (?) na di ɛnd. Lɛk: Wetin na yu nem?"
      }
    ]
  },
  {
    id: "m2-2-telling-time",
    title: "Telling the Time at School",
    subject: "Mathematics",
    class_level: "Class 2",
    points_award: 80,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P2-MA: Reading analogue clocks to the hour and half hour",
    questions: [
      {
        questionText: "School starts at 8 o'clock. On a clock showing exactly 8 o'clock, where does the SHORT hand (hour hand) point?",
        options: ["To the 8", "To the 12", "To the 6", "To the 3"],
        correctOption: "To the 8",
        explanation: "The short hand (hour hand) points to the hour number. At 8 o'clock, it points to the 8. The long minute hand points to 12.",
        krioInstruction: "Di shɔt an (yɛ an) de pɔint to di yɛ nɔmba. Foh 8 ɔkɔlɔk, i pɔint to 8. Di lɔng minit an de pɔint to 12!"
      },
      {
        questionText: "If it is half past 3 (3:30), where does the LONG hand (minute hand) point?",
        options: ["To the 6", "To the 12", "To the 3", "To the 9"],
        correctOption: "To the 6",
        explanation: "At half past any hour, the minute hand always points to the 6, because 30 minutes is half of 60 minutes.",
        krioInstruction: "Na haf pɛs, di minit an de pɔint to di 6. 30 minit na haf ɔwa. 3:30 na 'haf pɛs tri'!"
      }
    ]
  },

  // ─── CLASS 3 ───────────────────────────────────────────────────────────────
  {
    id: "m1-trading-kru-town",
    title: "Kru Town Market Commerce",
    subject: "Mathematics",
    class_level: "Class 3",
    points_award: 120,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P3-MA: Multiplication and money problems in local context",
    questions: [
      {
        questionText: "Mariama sells cassava bread in Kru Town Market. She starts with 15 fresh loaves and sells 9. How many loaves are left in her tray?",
        options: ["6 loaves", "9 loaves", "24 loaves", "5 loaves"],
        correctOption: "6 loaves",
        explanation: "15 loaves minus 9 sold leaves Mariama with 6 loaves to sell later.",
        krioInstruction: "Mariama bin gɛt 15 bray; i səl 9. Wetin lɛf na di tray? 15 minus 9 na 6. Prɛs '6' foh win!"
      },
      {
        questionText: "If each loaf of cassava bread sells for 20 Leones, how many Leones does Mariama earn by selling 3 loaves?",
        options: ["40 Leones", "60 Leones", "20 Leones", "50 Leones"],
        correctOption: "60 Leones",
        explanation: "Selling 3 loaves at 20 Leones each equals 3 x 20 = 60 Leones.",
        krioInstruction: "Ɛvry loaf na 20 Leone. If i səl 3 foh di fambul dɛm, wetin i gɛt? 3 x 20 Leone na 60 Leone."
      }
    ]
  },
  {
    id: "s3-1-water-cycle",
    title: "The Water Cycle by Rokel River",
    subject: "General Science",
    class_level: "Class 3",
    points_award: 100,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P3-SC: The water cycle — evaporation, condensation, precipitation",
    questions: [
      {
        questionText: "When the sun heats water in the Rokel River, the water turns into vapour and rises into the air. What is this process called?",
        options: ["Evaporation", "Precipitation", "Condensation", "Filtration"],
        correctOption: "Evaporation",
        explanation: "Evaporation is when liquid water is heated by the sun and turns into water vapour (gas) that rises into the atmosphere.",
        krioInstruction: "Wen di sɔn it di wata an di wata tɔn to vapɔ an go op, dat na evapɔreshɔn. Di wata de kom pɔ fɔ di Rokel!"
      },
      {
        questionText: "Water vapour in the atmosphere cools and turns back into tiny water droplets, forming clouds. What is this called?",
        options: ["Condensation", "Evaporation", "Absorption", "Transpiration"],
        correctOption: "Condensation",
        explanation: "Condensation is when water vapour cools and turns back into liquid water droplets, forming clouds in the sky.",
        krioInstruction: "Wen di vapɔ kul dong an tɔn bɛk to wata drɔplɛts an fɔm klɔd, dat na kondɛnseshɔn. Dat na aw wi gɛt klɔd!"
      }
    ]
  },
  {
    id: "ss3-1-provinces",
    title: "Regions of Sierra Leone",
    subject: "Social Studies & Civics",
    class_level: "Class 3",
    points_award: 110,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P3-SS: Administrative divisions of Sierra Leone",
    questions: [
      {
        questionText: "Sierra Leone is divided into how many main provinces plus the Western Area?",
        options: ["3 provinces plus Western Area", "5 provinces", "2 provinces", "4 provinces only"],
        correctOption: "3 provinces plus Western Area",
        explanation: "Sierra Leone has three provinces (Northern, Southern, Eastern) plus the Western Area where the capital Freetown is located.",
        krioInstruction: "Salone gɛt 3 provins (Nɔtɛn, Sɔtɛn, Istɛn) plos di Wɛstɛn Eria we Fritɔn de. Dat fɔ pɔlis in ɔl!"
      },
      {
        questionText: "In which province is the city of Kenema located?",
        options: ["Eastern Province", "Northern Province", "Southern Province", "Western Area"],
        correctOption: "Eastern Province",
        explanation: "Kenema is one of the major cities in Sierra Leone's Eastern Province, known for its diamond mining industry.",
        krioInstruction: "Kenema de na di Istɛn Provins. I na wan impɔtant siti fɔ dayamɔn mayning na Salone!"
      }
    ]
  },
  {
    id: "el3-1-nouns-verbs",
    title: "Nouns and Verbs in Sentences",
    subject: "English Language",
    class_level: "Class 3",
    points_award: 100,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P3-EL: Identifying nouns and verbs in sentences",
    questions: [
      {
        questionText: "In the sentence 'The girl READS a book', which word is the VERB (action word)?",
        options: ["reads", "girl", "book", "the"],
        correctOption: "reads",
        explanation: "A verb is an action word. 'Reads' is what the girl is doing — it describes the action, making it the verb.",
        krioInstruction: "Di vɛb na di akshɔn wɔd. Na 'reads' di gɔl de du. So 'reads' na di vɛb na di sɛntɛns!"
      },
      {
        questionText: "Which of these words is a NOUN (naming word for a place)?",
        options: ["Freetown", "jump", "run", "quickly"],
        correctOption: "Freetown",
        explanation: "A noun names a person, place, or thing. Freetown is the capital city of Sierra Leone — it is a place, so it is a noun.",
        krioInstruction: "Fritɔn na wan pɛs (naɔn). Di ɔda wɔd dɛm (jump, run) na vɛb dɛm. Fritɔn na naɔn bikos i na wan siti!"
      }
    ]
  },
  {
    id: "m3-2-shapes",
    title: "Shapes at Makeni Junction",
    subject: "Mathematics",
    class_level: "Class 3",
    points_award: 110,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P3-MA: Properties of 2D shapes",
    questions: [
      {
        questionText: "A traffic sign near Makeni Junction is shaped like a triangle. How many sides does a triangle have?",
        options: ["3 sides", "4 sides", "5 sides", "6 sides"],
        correctOption: "3 sides",
        explanation: "A triangle has 3 sides and 3 angles. The word 'tri' means three, which is why we call it a triangle.",
        krioInstruction: "Di traiangl gɛt 3 said an 3 kɔna. 'Tri' min tɛri. Na dat mek wi kɔl am tri-angl!"
      },
      {
        questionText: "Which shape has 4 equal sides and 4 right-angle corners?",
        options: ["A square", "A triangle", "A circle", "A rectangle"],
        correctOption: "A square",
        explanation: "A square has 4 equal sides and 4 right angles (90° corners). It differs from a rectangle which has 2 long and 2 short sides.",
        krioInstruction: "Di skwɛ gɛt fɔ ɛkwɔl said an fɔ rait-angl kɔna. Rɛktangl gɛt 2 lɔng said an 2 shɔt said. Skwɛ ɔltem ɛkwɔl!"
      }
    ]
  },

  // ─── CLASS 4 ───────────────────────────────────────────────────────────────
  {
    id: "m4-1-fractions",
    title: "Fractions at Bonthe Fishing Village",
    subject: "Mathematics",
    class_level: "Class 4",
    points_award: 130,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P4-MA: Understanding fractions — halves, quarters, thirds",
    questions: [
      {
        questionText: "A fisherman at Bonthe catches 12 fish and divides them into 4 equal groups. What fraction represents one group?",
        options: ["One quarter (1/4)", "One half (1/2)", "One third (1/3)", "Two thirds (2/3)"],
        correctOption: "One quarter (1/4)",
        explanation: "When something is divided into 4 equal parts, each part is one quarter (1/4). 12 ÷ 4 = 3 fish per group.",
        krioInstruction: "12 fis divaid ɛkwɔl bai 4 = 3 fis foh ɛch pɔt. Wan pɔt aɔt ɔv 4 na wan kwɔta (1/4)!"
      },
      {
        questionText: "A rice bag is divided in half. If one half weighs 25 kg, how heavy is the full rice bag?",
        options: ["50 kg", "25 kg", "75 kg", "100 kg"],
        correctOption: "50 kg",
        explanation: "If one half (1/2) weighs 25 kg, then the whole bag = 2 × 25 = 50 kg. Double the half to get the whole.",
        krioInstruction: "Wan haf (1/2) na 25 kilogram. Di wol bɛg = 2 × 25 = 50 kilogram. Tubul di haf tu gɛt di hol!"
      }
    ]
  },
  {
    id: "s1-gola",
    title: "Gola Rain Forest Giants",
    subject: "General Science",
    class_level: "Class 4",
    points_award: 150,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P4-SC: Wildlife conservation and endangered species",
    questions: [
      {
        questionText: "The rare Western Pygmy Hippo lives in Sierra Leone's Gola Rainforest. Is the Pygmy Hippo considered an endangered species or a common household pet?",
        options: ["Endangered Species", "Household Pet", "Extinct Specimen", "Oceanic Predator"],
        correctOption: "Endangered Species",
        explanation: "Pygmy Hippos are endangered, meaning very few are left in the wild and we must preserve their rainforest home.",
        krioInstruction: "Di tinap-tinap Pygmy Hippo rɛb na bush dɛm! Wi foh mɛnj am foh ya bikos i de foh dɔn. I na endangered spɛshis."
      },
      {
        questionText: "What key resource do chimpanzees and rare monkeys find on Tiwai Island in the Moa River?",
        options: ["A protected rainforest sanctuary", "A salt water marsh", "A desert sand dune", "An industrial logging mill"],
        correctOption: "A protected rainforest sanctuary",
        explanation: "Tiwai Island is a world-renowned wildlife sanctuary offering a protected natural rainforest habitat.",
        krioInstruction: "Tiwai Island na di Moa Riva na rich bush we de protɛkt di bɔbɔ chimpanzee dɛm fɔh hɔntin. Na sanctuary."
      }
    ]
  },
  {
    id: "ss4-1-independence",
    title: "Sierra Leone's Independence 1961",
    subject: "Social Studies & Civics",
    class_level: "Class 4",
    points_award: 140,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P4-SS: Sierra Leone's path to independence",
    questions: [
      {
        questionText: "On which date did Sierra Leone gain independence from British colonial rule?",
        options: ["April 27, 1961", "March 11, 1991", "January 1, 1960", "June 12, 1957"],
        correctOption: "April 27, 1961",
        explanation: "Sierra Leone became an independent nation on April 27, 1961. This date is celebrated each year as Independence Day.",
        krioInstruction: "Salone gɛt independence pan April 27, 1961. Ɛvry yɛ wi sɛlɛbreit dis speshɔl dei! Fri Salone!"
      },
      {
        questionText: "Who was Sierra Leone's first Prime Minister when the country gained independence in 1961?",
        options: ["Sir Milton Margai", "Siaka Stevens", "Ahmad Tejan Kabbah", "Julius Bio"],
        correctOption: "Sir Milton Margai",
        explanation: "Sir Milton Margai became Sierra Leone's first Prime Minister when the country gained independence from Britain on April 27, 1961.",
        krioInstruction: "Sɛ Milton Margai bin na Salone fɔs Praym Minista wen wi gɛt independence. I fɔt foh fridom!"
      }
    ]
  },
  {
    id: "el4-1-adjectives",
    title: "Adjectives Describe Our World",
    subject: "English Language",
    class_level: "Class 4",
    points_award: 130,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P4-EL: Adjectives and descriptive language",
    questions: [
      {
        questionText: "In the sentence 'The TALL mango tree grows near the river', which word is the ADJECTIVE?",
        options: ["tall", "mango", "grows", "river"],
        correctOption: "tall",
        explanation: "An adjective is a describing word. 'Tall' describes the mango tree, telling us what kind of tree it is.",
        krioInstruction: "Adjektiv na di wɔd we dɛskraib wan naɔn. 'Tall' dɛskraib di mango tri. I tel wi wetin kayn tri am na!"
      },
      {
        questionText: "Which of these words is an ADJECTIVE that describes colour?",
        options: ["green", "eat", "quickly", "run"],
        correctOption: "green",
        explanation: "'Green' is an adjective that describes colour. It is a describing word that tells us what colour something is, like 'the green banana'.",
        krioInstruction: "Di wɔd 'green' na adjektiv kɔlɔ. I tel wi wetin kɔlɔ wan ting na. Lɛk 'di grɛn grɛs' ɔ 'di grɛn bananɛ'!"
      }
    ]
  },
  {
    id: "s4-1-seasons",
    title: "Rainy Season and Dry Season in Salone",
    subject: "General Science",
    class_level: "Class 4",
    points_award: 140,
    difficulty: "Medium",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P4-SC: Tropical climate and seasonal patterns",
    questions: [
      {
        questionText: "Which months are typically part of the Rainy Season in Sierra Leone?",
        options: ["May to November", "December to April", "January to March", "All year round"],
        correctOption: "May to November",
        explanation: "Sierra Leone's rainy season usually runs from May to November, with the heaviest rains in July and August.",
        krioInstruction: "Salone Rɛni Sizɔn de kɔm fɔm Mɛi go to Novɛmba. Di ren ɛvi foh Julai an Ɔgɔst. Wi gɛt plɛnti wata!"
      },
      {
        questionText: "What type of climate does Sierra Leone have, with warm temperatures and two distinct seasons?",
        options: ["Tropical climate", "Arctic climate", "Desert climate", "Temperate climate"],
        correctOption: "Tropical climate",
        explanation: "Sierra Leone has a tropical climate with warm temperatures throughout the year and two seasons — wet (rainy) and dry.",
        krioInstruction: "Salone gɛt trɔpikɔl klaymat. I wɔm ɔltaim wit tu sizɔn: di wɛt (rɛni) sizɔn an di dray sizɔn!"
      }
    ]
  },

  // ─── CLASS 5 ───────────────────────────────────────────────────────────────
  {
    id: "st1-cotton-tree",
    title: "Historic Cotton Tree & Bai Bureh",
    subject: "Social Studies & Civics",
    class_level: "Class 5",
    points_award: 180,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P5-SS: Sierra Leonean resistance heroes and symbols of freedom",
    questions: [
      {
        questionText: "Which brave Sierra Leonean ruler and strategist led the 1898 Hut Tax Rebellion against British administration?",
        options: ["Bai Bureh", "Sengbe Pieh", "Madam Yoko", "Wallace Johnson"],
        correctOption: "Bai Bureh",
        explanation: "Bai Bureh was from Kasseh and successfully defended his territory during the British Hut Tax War.",
        krioInstruction: "Di brayv lida we fɛt di britis dɛm foh di hut tɔks na bin Bai Bureh!"
      },
      {
        questionText: "Under which majestic national symbol in Freetown did early settlers and freed slaves gather to pray for freedom?",
        options: ["The historic Cotton Tree", "The Bailey Bridge", "The Bintumani Peak", "The Outamba Swamp"],
        correctOption: "The historic Cotton Tree",
        explanation: "The historic Freetown Cotton Tree stood for centuries in Central Freetown, representing liberty, resilience, and community.",
        krioInstruction: "Wi fambul dɛm we friman sɔt dɔn de wɔship and pre fɔh fridom na di rɔyal Kɔtin Tri dɔn Fritɔn."
      }
    ]
  },
  {
    id: "m5-1-percentages",
    title: "Percentages at Port Loko Market",
    subject: "Mathematics",
    class_level: "Class 5",
    points_award: 160,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P5-MA: Calculating percentages in everyday contexts",
    questions: [
      {
        questionText: "A trader sells rice bags for Le 1000 each and offers a 10% discount. How much does a customer SAVE?",
        options: ["Le 100", "Le 200", "Le 50", "Le 150"],
        correctOption: "Le 100",
        explanation: "10% of Le 1000 = 10 ÷ 100 × 1000 = Le 100. The customer saves Le 100 and pays Le 900.",
        krioInstruction: "10% ɔv Le 1000 = 10 ÷ 100 × 1000 = Le 100. Di kastaɔ sev Le 100 an pɛ Le 900. Gɔd dil!"
      },
      {
        questionText: "In a class of 40 pupils, 25 passed the NPSE exam. What PERCENTAGE of pupils passed?",
        options: ["62.5%", "50%", "75%", "40%"],
        correctOption: "62.5%",
        explanation: "Percentage passed = (25 ÷ 40) × 100 = 62.5%. Always divide the part by the whole, then multiply by 100.",
        krioInstruction: "Pɛsɛntij = (25 ÷ 40) × 100 = 62.5%. 62.5% ɔv di klas pɔs di ekzam. Kɔngrachuleshɔn!"
      }
    ]
  },
  {
    id: "s5-1-digestion",
    title: "The Human Digestive System",
    subject: "General Science",
    class_level: "Class 5",
    points_award: 170,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P5-SC: Organs and functions of the human digestive system",
    questions: [
      {
        questionText: "After we chew food in the mouth and swallow, it travels down the oesophagus to reach which organ where acid breaks it down?",
        options: ["The stomach", "The liver", "The lungs", "The kidney"],
        correctOption: "The stomach",
        explanation: "When we swallow, food travels down the oesophagus (food pipe) to the stomach where acid helps break it down further.",
        krioInstruction: "Wen wi swalow di fud, i go dong di ɔsɔfagɔs go reach di stɔmak. Di stɔmak yus asid foh brek dong di fud mɔ!"
      },
      {
        questionText: "Which part of the digestive system absorbs nutrients from digested food into the bloodstream?",
        options: ["Small intestine", "Large intestine", "Stomach", "Liver"],
        correctOption: "Small intestine",
        explanation: "The small intestine absorbs nutrients from food after the stomach has broken it down. These nutrients enter the bloodstream to feed the body.",
        krioInstruction: "Di smɔl intɛstin nyam di nyutrɪnt dɛm fɔh di fud afta di stɔmak brek am dong. Di nyutrɪnt dɛm go na di blɔd foh fid di bɔdi!"
      }
    ]
  },
  {
    id: "el5-1-heroes-reading",
    title: "Reading About Sierra Leonean Heroes",
    subject: "English Language",
    class_level: "Class 5",
    points_award: 160,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P5-EL: Reading comprehension and main idea identification",
    questions: [
      {
        questionText: "Madam Yoko was a powerful Mende queen. What was she primarily known for achieving?",
        options: ["Uniting Mende chiefdoms through diplomacy", "Building the first school in Freetown", "Discovering diamonds in Koidu", "Being Sierra Leone's first doctor"],
        correctOption: "Uniting Mende chiefdoms through diplomacy",
        explanation: "Madam Yoko was a skilled political leader who united Mende chiefdoms in the late 1800s through alliances and became Paramount Chief of Senehun.",
        krioInstruction: "Madam Yoko bin wan pawaful kwin we yunayt Mɛnde chifdɔm dem tru dipɔmasi. I bin Paramɔnt Chif ɔv Senehun!"
      },
      {
        questionText: "In reading comprehension, what is the MAIN IDEA of a passage?",
        options: ["The most important point the writer is making", "The title of the book", "Every single detail in the story", "The last sentence only"],
        correctOption: "The most important point the writer is making",
        explanation: "The main idea is the central message or the most important point that the author wants to communicate in a passage.",
        krioInstruction: "Di mɛn aydiya na di mɔs impɔtant pɔint di raya de trɛ tel yu. Ɔltem luk foh am na di fɔs ɔ las pɛragraf!"
      }
    ]
  },
  {
    id: "m5-2-area-perimeter",
    title: "Area and Perimeter of Our School",
    subject: "Mathematics",
    class_level: "Class 5",
    points_award: 170,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P5-MA: Calculating area and perimeter of rectangles",
    questions: [
      {
        questionText: "A rectangular school garden is 8 metres long and 5 metres wide. What is the PERIMETER of the garden?",
        options: ["26 metres", "40 metres", "13 metres", "16 metres"],
        correctOption: "26 metres",
        explanation: "Perimeter = 2 × (length + width) = 2 × (8 + 5) = 2 × 13 = 26 metres. Perimeter is the total distance around the edge.",
        krioInstruction: "Perimeter = 2 × (lɛngt + wit) = 2 × (8 + 5) = 2 × 13 = 26 mita. Di Pɛrimita na di tɔtɔl ɔrɔn di ɛj!"
      },
      {
        questionText: "A classroom floor is 10 metres long and 6 metres wide. What is the AREA of the classroom floor?",
        options: ["60 square metres", "32 square metres", "16 square metres", "60 metres"],
        correctOption: "60 square metres",
        explanation: "Area = length × width = 10 × 6 = 60 square metres. Area is measured in square units and tells us the space inside a shape.",
        krioInstruction: "Eria = lɛngt × wit = 10 × 6 = 60 skwɛ mita. Eria tel wi aw mɛni skwɛ unit fit insayd wan shɛp!"
      }
    ]
  },

  // ─── CLASS 6 ───────────────────────────────────────────────────────────────
  {
    id: "m6-1-ratios",
    title: "Ratios at Port Loko Salt Flats",
    subject: "Mathematics",
    class_level: "Class 6",
    points_award: 190,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P6-MA: Ratios and proportional reasoning",
    questions: [
      {
        questionText: "At Port Loko salt flats, for every 3 bags produced, 2 are exported and 1 is kept for local sale. What is the ratio of exported to local sale bags?",
        options: ["2:1", "1:2", "3:2", "2:3"],
        correctOption: "2:1",
        explanation: "The ratio of exported to local = 2 to 1, written as 2:1. For every 2 bags exported, 1 bag stays for local use.",
        krioInstruction: "2 bɛg foh ekspɔt tu 1 bɛg foh lɔkɔl = ratio 2:1. Foh ɛvri 2 bɛg we go abrɔd, 1 stɛ foh ous!"
      },
      {
        questionText: "A recipe needs sugar and flour in the ratio 1:3. If you use 200g of sugar, how much flour do you need?",
        options: ["600g", "200g", "400g", "100g"],
        correctOption: "600g",
        explanation: "Ratio 1:3 means for every 1 part sugar, use 3 parts flour. So 200g sugar × 3 = 600g flour.",
        krioInstruction: "Ratio 1:3 min foh ɛvri 1 pɔt shuga, yus 3 pɔt flaɔ. 200g shuga × 3 = 600g flaɔ. Rat!"
      }
    ]
  },
  {
    id: "s6-1-states-of-matter",
    title: "Solids, Liquids and Gases",
    subject: "General Science",
    class_level: "Class 6",
    points_award: 200,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P6-SC: States of matter and changes of state",
    questions: [
      {
        questionText: "When water is frozen at 0°C it becomes ice. What STATE OF MATTER is ice?",
        options: ["Solid", "Liquid", "Gas", "Plasma"],
        correctOption: "Solid",
        explanation: "Ice is a solid — it has a fixed shape and fixed volume. Water becomes a solid when its temperature drops to 0°C (freezing point).",
        krioInstruction: "Aas na sɔlid. I gɛt fiks shep an fiks volum. Wata tɔn sɔlid wen i kul dong to 0°C (frizing pɔint)!"
      },
      {
        questionText: "When water is heated to 100°C, it turns into steam. What state of matter is steam?",
        options: ["Gas", "Liquid", "Solid", "Mineral"],
        correctOption: "Gas",
        explanation: "Steam is water in its gas state (water vapour). Water becomes a gas when heated to its boiling point of 100°C.",
        krioInstruction: "Stim na wata na di gas steit. Wen wata it op to 100°C (boiling pɔint), i tɔn to stim. Gas nɔ gɛt fiks shep!"
      }
    ]
  },
  {
    id: "ss6-1-government",
    title: "Sierra Leone's Three Branches of Government",
    subject: "Social Studies & Civics",
    class_level: "Class 6",
    points_award: 190,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P6-SS: Structure and functions of Sierra Leone's government",
    questions: [
      {
        questionText: "Sierra Leone's government has three branches. Which branch makes the laws of the country?",
        options: ["The Legislature (Parliament)", "The Executive (President)", "The Judiciary (Courts)", "The Military (Army)"],
        correctOption: "The Legislature (Parliament)",
        explanation: "The Legislature (Parliament) is the branch that makes and passes laws. Sierra Leone's Parliament is located in Freetown.",
        krioInstruction: "Di Lejilechɔ (Pɔliament) na di branch we mek di lɔ dɛm foh di kantri. Salone Pɔliament de na Fritɔn!"
      },
      {
        questionText: "Which branch of government interprets and applies the laws of Sierra Leone?",
        options: ["The Judiciary (Courts)", "The Legislature (Parliament)", "The Executive (President)", "The Police Force"],
        correctOption: "The Judiciary (Courts)",
        explanation: "The Judiciary (courts and judges) interprets and applies the laws. The Supreme Court is Sierra Leone's highest court.",
        krioInstruction: "Di Judishɛri (kɔt dɛm) na di branch we ɛsplɛn an aplai di lɔ dɛm. Di Suprɛm Kɔt na di ayɛs kɔt na Salone!"
      }
    ]
  },
  {
    id: "el6-1-poetry",
    title: "Analysing a Poem About Sierra Leone",
    subject: "English Language",
    class_level: "Class 6",
    points_award: 200,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P6-EL: Poetry analysis — stanzas, rhyme, theme",
    questions: [
      {
        questionText: "When analysing a poem, what do we call the groups of lines separated by spaces (similar to paragraphs in prose)?",
        options: ["Stanzas", "Syllables", "Rhymes", "Clauses"],
        correctOption: "Stanzas",
        explanation: "A stanza is a group of lines in a poem, separated from other groups by blank spaces — similar to a paragraph in prose writing.",
        krioInstruction: "Wan stanza na wan gruf ɔv layns na wan pɔm. I sep fɔm di ɔda gruf bai wan blɛnk speis. Lɛk pɛragraf fɔ proz!"
      },
      {
        questionText: "In the poem lines 'Sierra Leone, sweet homeland / Your mountains stand so grand', which two words RHYME?",
        options: ["homeland and grand", "Sierra and Leone", "mountains and stand", "Your and so"],
        correctOption: "homeland and grand",
        explanation: "'Homeland' and 'grand' rhyme because both end with the same sound (-and). Rhyme is when the ending sounds of words match.",
        krioInstruction: "'Homeland' an 'grand' raym bikos dem ɛnd wit di sem saond (-and, -and). Raym na wen di ɛndin saond ɔv wɔds mɛch!"
      }
    ]
  },
  {
    id: "m6-2-data-graphs",
    title: "Reading School Data and Graphs",
    subject: "Mathematics",
    class_level: "Class 6",
    points_award: 210,
    difficulty: "Hard",
    source: "bank",
    alignedMbsseOutcome: "MBSSE P6-MA: Interpreting bar graphs and using percentages with data",
    questions: [
      {
        questionText: "A bar graph shows: Class 4 has 45 pupils, Class 5 has 38 pupils, Class 6 has 42 pupils. How many pupils are there in total?",
        options: ["125 pupils", "120 pupils", "115 pupils", "130 pupils"],
        correctOption: "125 pupils",
        explanation: "45 + 38 + 42 = 125 pupils in total. Reading and adding data from a bar graph is a key mathematical skill.",
        krioInstruction: "45 + 38 + 42 = 125 pikin in tɔtɔl. We wi rid data fɔm wan bɛ graf, wi ad ɔp ɔl di nɔmba dɛm foh gɛt di tɔtɔl!"
      },
      {
        questionText: "A survey shows 60% of 200 pupils prefer Mathematics. How many pupils prefer Mathematics?",
        options: ["120 pupils", "60 pupils", "80 pupils", "100 pupils"],
        correctOption: "120 pupils",
        explanation: "60% of 200 = 60 ÷ 100 × 200 = 120 pupils prefer Mathematics. Using percentages with real data helps us understand information.",
        krioInstruction: "60% ɔv 200 = 60 ÷ 100 × 200 = 120 pikin layk Mɛtimɛtiks. Pɛsɛntij elp wi ɔndastand real data!"
      }
    ]
  }
]

export const INITIAL_PUPILS: SyncedPupil[] = [
  {
    id: "pupil-1",
    name: "Alimamy Kamara",
    class_level: "Class 4",
    points: 420,
    streak_count: 6,
    last_active_date: "2026-06-12",
    badges_earned: ["Cotton Tree Scholar", "Gola Forest Guardian"],
    synced_at: Date.now() - 3600000
  },
  {
    id: "pupil-2",
    name: "Fatmata Sesay",
    class_level: "Class 3",
    points: 380,
    streak_count: 5,
    last_active_date: "2026-06-13",
    badges_earned: ["Bintumani Climber"],
    synced_at: Date.now() - 1200000
  },
  {
    id: "pupil-3",
    name: "Joseph Kargbo",
    class_level: "Class 5",
    points: 510,
    streak_count: 8,
    last_active_date: "2026-06-13",
    badges_earned: ["Cotton Tree Scholar", "Bintumani Climber"],
    synced_at: Date.now() - 60000
  }
]

export const INITIAL_LOGS: SyncLog[] = [
  {
    id: "log-1",
    timestamp: Date.now() - 3600000,
    pupil_name: "Alimamy Kamara",
    delta_points: 120,
    event_type: "Class 4 Science Sync"
  },
  {
    id: "log-2",
    timestamp: Date.now() - 1200000,
    pupil_name: "Fatmata Sesay",
    delta_points: 60,
    event_type: "Class 3 Commerce Sync"
  },
  {
    id: "log-3",
    timestamp: Date.now() - 60000,
    pupil_name: "Joseph Kargbo",
    delta_points: 180,
    event_type: "Class 5 Civics Sync"
  }
]
