/*
 * Built-in training levels.
 *
 * Each level is a plain object — add, remove or reorder entries to change the
 * training camp. Fields:
 *   id        unique string (used to store progress)
 *   name      short title shown on the level card
 *   subtitle  optional one-liner shown under the title
 *   tip       optional coaching tip shown before the level starts
 *   mode      'keys'  -> random groups built from `keys` (letters in `focus` appear more often)
 *             'words' -> random words from `list`
 *             'lines' -> random sentences from `list`
 *   groups    how many key groups / words per shot (keys + words modes)
 *   minLen, maxLen  length of each random key group (keys mode)
 *   shots     saves needed to finish the level
 *   wpm       shot speed: the puck gives you time to type at this many words per minute
 *   da        Danish overrides for name / subtitle / tip / list
 *
 * {PINKY} is replaced by the right pinky's home key of the chosen keyboard
 * layout: ";" on a US keyboard, "æ" on a Danish keyboard.
 */
window.SPORTTYPER_LEVELS = [
  {
    id: 'l01', name: 'F & J', subtitle: 'Home base',
    tip: 'Rest your index fingers on F and J — feel the little bumps? That is home base. Left index presses F, right index presses J.',
    mode: 'keys', keys: 'fj', minLen: 2, maxLen: 3, shots: 6, wpm: 8,
    da: {
      subtitle: 'Udgangspunktet',
      tip: 'Hvil pegefingrene på F og J — kan du mærke de små knopper? Det er udgangspunktet. Venstre pegefinger trykker F, højre pegefinger trykker J.',
    },
  },
  {
    id: 'l02', name: 'D & K', subtitle: 'Middle fingers join in',
    tip: 'Keep your index fingers on F and J. Your middle fingers rest on D and K.',
    mode: 'keys', keys: 'fjdk', focus: 'dk', shots: 8, wpm: 9,
    da: {
      subtitle: 'Langfingrene er med',
      tip: 'Hold pegefingrene på F og J. Langfingrene hviler på D og K.',
    },
  },
  {
    id: 'l03', name: 'S & L', subtitle: 'Ring fingers',
    tip: 'Ring fingers rest on S and L. Only move the finger that types — the others stay home.',
    mode: 'keys', keys: 'fjdksl', focus: 'sl', shots: 8, wpm: 10,
    da: {
      subtitle: 'Ringfingrene',
      tip: 'Ringfingrene hviler på S og L. Flyt kun den finger, der skriver — de andre bliver hjemme.',
    },
  },
  {
    id: 'l04', name: 'A & {PINKY}', subtitle: 'The full home row',
    tip: 'Pinkies on A and {PINKY}. All eight fingers are now on the home row: A S D F   J K L {PINKY}',
    mode: 'keys', keys: 'asdfjkl{PINKY}', focus: 'a{PINKY}', shots: 8, wpm: 10,
    da: {
      subtitle: 'Hele grundrækken',
      tip: 'Lillefingrene på A og {PINKY}. Alle otte fingre er nu på grundrækken: A S D F   J K L {PINKY}',
    },
  },
  {
    id: 'l05', name: 'G & H', subtitle: 'Reach to the middle',
    tip: 'Stretch your left index from F to G, and your right index from J to H. Then slide straight back home. Your thumbs press the space bar.',
    mode: 'keys', keys: 'asdfghjkl', focus: 'gh', groups: 2, shots: 8, wpm: 11,
    da: {
      subtitle: 'Stræk ind mod midten',
      tip: 'Stræk venstre pegefinger fra F til G og højre pegefinger fra J til H. Glid så lige hjem igen. Tommelfingrene trykker på mellemrumstasten.',
    },
  },
  {
    id: 'l06', name: 'Home row words', subtitle: 'Real words, home row only',
    tip: 'Every word here uses only home row keys. Keep your eyes on the screen, not your fingers!',
    mode: 'words', shots: 10, wpm: 12,
    list: ['ask', 'dad', 'sad', 'lad', 'add', 'all', 'fall', 'hall', 'gas', 'has', 'had', 'half', 'glad', 'flask', 'salad', 'lash', 'dash', 'flash', 'shall', 'alas', 'jag', 'hag', 'gag', 'lass', 'flag', 'slag'],
    da: {
      name: 'Ord på grundrækken', subtitle: 'Rigtige ord, kun grundrækken',
      tip: 'Alle ordene bruger kun tasterne på grundrækken. Kig på skærmen, ikke på fingrene!',
      list: ['dal', 'sal', 'fald', 'hals', 'glad', 'flag', 'skal', 'lad', 'hak', 'gas', 'sjal', 'lak', 'hal', 'falsk', 'slag', 'skjald', 'sjask', 'flad', 'klask', 'kalk', 'dask'],
    },
  },
  {
    id: 'l07', name: 'E & I', subtitle: 'Up to the top row',
    tip: 'Reach up from D to E with your left middle finger, and from K to I with your right middle finger.',
    mode: 'keys', keys: 'asdfghjklei', focus: 'ei', groups: 2, shots: 10, wpm: 12,
    da: {
      subtitle: 'Op til øverste række',
      tip: 'Stræk venstre langfinger op fra D til E og højre langfinger fra K til I.',
    },
  },
  {
    id: 'l08', name: 'R & U', subtitle: 'Index fingers reach up',
    tip: 'R is typed by the left index finger (from F), U by the right index finger (from J).',
    mode: 'keys', keys: 'asdfghjkleiru', focus: 'ru', groups: 2, shots: 10, wpm: 12,
    da: {
      subtitle: 'Pegefingrene strækker sig op',
      tip: 'R skrives med venstre pegefinger (fra F), U med højre pegefinger (fra J).',
    },
  },
  {
    id: 'l09', name: 'T & Y', subtitle: 'The long index reach',
    tip: 'T and Y are diagonal stretches for your index fingers: F to T, J to Y.',
    mode: 'keys', keys: 'asdfghjkleiruty', focus: 'ty', groups: 2, shots: 10, wpm: 13,
    da: {
      subtitle: 'Det lange stræk',
      tip: 'T og Y er skrå stræk for pegefingrene: F til T, J til Y.',
    },
  },
  {
    id: 'l10', name: 'W, O, Q & P', subtitle: 'Finish the top row',
    tip: 'Ring fingers reach up to W and O. Pinkies reach up to Q and P.',
    mode: 'keys', keys: 'asdfghjkleirutywoqp', focus: 'woqp', groups: 2, shots: 10, wpm: 13,
    da: {
      subtitle: 'Gør øverste række færdig',
      tip: 'Ringfingrene strækker sig op til W og O. Lillefingrene strækker sig op til Q og P.',
    },
  },
  {
    id: 'l11', name: 'Top row words', subtitle: 'Home + top row',
    tip: 'Words built from the home row and the top row. Return to home base after every reach.',
    mode: 'words', shots: 10, wpm: 14,
    list: ['the', 'she', 'here', 'your', 'type', 'water', 'power', 'tree', 'fire', 'three', 'quite', 'route', 'pretty', 'great', 'goal', 'goalie', 'shot', 'slap', 'skate', 'player', 'shoot', 'forward', 'stop', 'sweater', 'period', 'faster', 'glide', 'highlight', 'trophy', 'ref'],
    da: {
      name: 'Ord på øverste række', subtitle: 'Grundrækken + øverste række',
      tip: 'Ord fra grundrækken og øverste række. Vend tilbage til udgangspunktet efter hvert stræk.',
      list: ['tre', 'fire', 'hej', 'far', 'fart', 'top', 'stop', 'spil', 'spiller', 'hold', 'holdet', 'is', 'hurtig', 'skud', 'skuddet', 'sport', 'sejr', 'glide', 'otte', 'tiger', 'tilskuer', 'fisk', 'luft', 'porte', 'karate', 'hoppe', 'dygtig', 'gris', 'papir'],
    },
  },
  {
    id: 'l12', name: 'V, B, N & M', subtitle: 'Down to the bottom row',
    tip: 'Index fingers curl down: F to V and B, J to N and M.',
    mode: 'keys', keys: 'asdfghjkleirutywoqpvbnm', focus: 'vbnm', groups: 2, shots: 10, wpm: 13,
    da: {
      subtitle: 'Ned til nederste række',
      tip: 'Pegefingrene bøjer ned: F til V og B, J til N og M.',
    },
  },
  {
    id: 'l13', name: 'C, X, Z , .', subtitle: 'Finish the bottom row',
    tip: 'C = left middle, X = left ring, Z = left pinky. Comma = right middle, period = right ring.',
    mode: 'keys', keys: 'asdfghjkleirutywoqpvbnmcxz,.', focus: 'cxz,.', groups: 2, shots: 10, wpm: 13,
    da: {
      subtitle: 'Gør nederste række færdig',
      tip: 'C = venstre langfinger, X = venstre ringfinger, Z = venstre lillefinger. Komma = højre langfinger, punktum = højre ringfinger.',
    },
  },
  {
    id: 'l14', name: 'Hockey words', subtitle: 'Every letter in play',
    tip: 'All the letters are in play now. Accuracy first — speed comes by itself.',
    mode: 'words', shots: 12, wpm: 16,
    list: ['puck', 'hockey', 'zamboni', 'blocker', 'glove', 'crease', 'penalty', 'referee', 'captain', 'victory', 'jersey', 'helmet', 'overtime', 'backhand', 'wrist', 'check', 'zone', 'mask', 'boards', 'breakaway', 'rebound', 'icing', 'offside', 'faceoff', 'shutout', 'hat', 'trick', 'winger', 'center', 'defense', 'blue', 'line', 'crossbar', 'post', 'pads', 'butterfly', 'dump', 'deke', 'snipe'],
    da: {
      name: 'Hockeyord', subtitle: 'Alle bogstaver er i spil',
      tip: 'Nu er alle bogstaverne i spil — også Æ, Ø og Å. Præcision først, farten kommer af sig selv.',
      list: ['ishockey', 'puck', 'målmand', 'blocker', 'handske', 'kølle', 'skøjte', 'udvisning', 'dommer', 'anfører', 'sejr', 'trøje', 'hjelm', 'forlænget', 'backhand', 'håndled', 'tackling', 'zone', 'maske', 'bande', 'friløber', 'returskud', 'offside', 'icing', 'straffeslag', 'nulspil', 'wing', 'center', 'forsvar', 'blå', 'linje', 'overligger', 'stolpe', 'benskinner', 'målfelt', 'tæt', 'tøj', 'går'],
    },
  },
  {
    id: 'l15', name: 'Shift & capitals', subtitle: 'The opposite pinky holds Shift',
    tip: 'For a capital letter, hold Shift with the pinky of the OTHER hand. Capital F? Right pinky on Shift, left index on F.',
    mode: 'words', shots: 10, wpm: 13,
    list: ['Canada', 'Sweden', 'Finland', 'Denmark', 'Norway', 'Toronto', 'Montreal', 'Boston', 'Detroit', 'Chicago', 'Oslo', 'Helsinki', 'Stockholm', 'Copenhagen', 'Riga', 'Prague', 'Zurich', 'Vancouver', 'Calgary', 'Edmonton', 'Winnipeg', 'Ottawa'],
    da: {
      name: 'Shift og store bogstaver', subtitle: 'Den modsatte lillefinger holder Shift',
      tip: 'Til et stort bogstav holder du Shift med lillefingeren på den ANDEN hånd. Stort F? Højre lillefinger på Shift, venstre pegefinger på F.',
      list: ['Danmark', 'Sverige', 'Norge', 'Finland', 'Canada', 'Tyskland', 'København', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Herning', 'Rødovre', 'Frederikshavn', 'Herlev', 'Gentofte', 'Rungsted', 'Oslo', 'Stockholm', 'Helsinki', 'Toronto', 'Montreal'],
    },
  },
  {
    id: 'l16', name: 'Number row', subtitle: '1 2 3 ... 0',
    tip: 'Numbers are a long reach. 1-5 are typed by the left hand, 6-0 by the right hand. Keep the rest of your fingers anchored.',
    mode: 'keys', keys: '1234567890', minLen: 2, maxLen: 3, groups: 2, shots: 10, wpm: 10,
    da: {
      name: 'Talrækken',
      tip: 'Tallene er et langt stræk. 1-5 skrives med venstre hånd, 6-0 med højre hånd. Hold de andre fingre forankret.',
    },
  },
  {
    id: 'l17', name: 'Rink talk', subtitle: 'Short sentences',
    tip: 'Now for whole sentences. Tap space with your thumb between words — do not stop to look.',
    mode: 'lines', shots: 8, wpm: 16,
    list: ['he shoots he scores', 'the goalie makes a save', 'pass the puck', 'skate to the net', 'keep your stick on the ice', 'what a glove save', 'the crowd goes wild', 'top shelf', 'five hole', 'head up and skate', 'win the faceoff', 'clear the crease'],
    da: {
      name: 'Snak på isen', subtitle: 'Korte sætninger',
      tip: 'Nu kommer hele sætninger. Tryk mellemrum med tommelfingeren mellem ordene — stop ikke op for at kigge.',
      list: ['han skyder han scorer', 'målmanden redder', 'spil pucken', 'skøjt mod målet', 'hold køllen på isen', 'sikke en redning', 'publikum jubler', 'lige i krydset', 'mellem benene', 'hovedet op og skøjt', 'vind tacklingen', 'ryd målfeltet'],
    },
  },
  {
    id: 'l18', name: 'Breakaway', subtitle: 'Capitals and punctuation',
    tip: 'Capitals, commas and exclamation marks. Remember: Shift with the opposite pinky!',
    mode: 'lines', shots: 8, wpm: 20,
    list: ['What a save!', 'He shoots, he scores!', 'Keep your eyes on the puck.', 'It is overtime, folks.', 'The goalie stops 42 shots.', 'Shutout number 7!', 'Two minutes for tripping.', 'Final score: 3 to 2.', 'Get back on defense!', 'Stop that puck, Goalie!'],
    da: {
      name: 'Friløber', subtitle: 'Store bogstaver og tegn',
      tip: 'Store bogstaver, kommaer og udråbstegn. Husk: Shift med den modsatte lillefinger!',
      list: ['Sikke en redning!', 'Han skyder, han scorer!', 'Hold øjnene på pucken.', 'Det er forlænget spilletid.', 'Målmanden tager 42 skud.', 'Nulspil nummer 7!', 'To minutter for at spænde ben.', 'Slutresultat: 3 mod 2.', 'Tilbage i forsvaret!', 'Stop den puck, Målmand!'],
    },
  },
  {
    id: 'l19', name: 'Overtime', subtitle: 'Fast shots, three words at a time',
    tip: 'Sudden death! Three words per shot at game speed. Stay relaxed and keep your rhythm.',
    mode: 'words', groups: 3, shots: 12, wpm: 28,
    list: ['the', 'and', 'puck', 'goal', 'save', 'fast', 'shot', 'ice', 'net', 'stick', 'skate', 'team', 'win', 'play', 'pass', 'glove', 'pad', 'mask', 'rink', 'fans', 'cheer', 'score', 'block', 'quick', 'jump', 'zone', 'power', 'over', 'time', 'first', 'line', 'coach', 'bench', 'horn', 'final'],
    da: {
      name: 'Forlænget spilletid', subtitle: 'Hurtige skud, tre ord ad gangen',
      tip: 'Sudden death! Tre ord pr. skud i kampfart. Slap af og hold rytmen.',
      list: ['og', 'en', 'puck', 'mål', 'red', 'hurtig', 'skud', 'is', 'net', 'kølle', 'skøjte', 'hold', 'vind', 'spil', 'aflevér', 'handske', 'maske', 'bane', 'fans', 'jubel', 'score', 'blok', 'kvik', 'hop', 'zone', 'over', 'tid', 'første', 'kæde', 'træner', 'bænk', 'horn', 'finale', 'sejr', 'tæt', 'løb'],
    },
  },
];
