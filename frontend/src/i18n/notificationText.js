import { translate } from "./translate";

const TITLES = {
  "New join request": "አዲስ የመቀላቀል ጥያቄ",
  "New member joined": "አዲስ አባል ተቀላቅሏል",
  "Join request approved": "የመቀላቀል ጥያቄ ተፈቅዷል",
  "Join request declined": "የመቀላቀል ጥያቄ ውድቅ ተደርጓል",
  "Removed from group": "ከእቁብ ተወግደዋል",
  "Member left": "አባል ወጥቷል",
  "Contribution received": "መዋጮ ደርሷል",
  "Contribution waived": "መዋጮ ተሰርዟል",
  "Cycle fully collected": "ዙሩ ሙሉ በሙሉ ተሰብስቧል",
  "Draw completed": "ዕጣ ወጥቷል",
  "You won the draw": "ዕጣውን አሸንፈዋል",
  "Payout recorded": "ክፍያ ተመዝግቧል",
  "Equb completed": "እቁቡ ተጠናቅቋል",
  "Contribution reminder": "የመዋጮ ማስታወሻ",
  "Contribution overdue": "መዋጮ ዘግይቷል",
  "Overdue contributions": "የዘገዩ መዋጮዎች",
  "Draw is waiting": "ዕጣ እየጠበቀ ነው",
  "Payout is pending": "ክፍያ በመጠባበቅ ላይ ነው",
  "New dispute reported": "አዲስ ቅሬታ ቀርቧል",
  "Dispute updated": "ቅሬታ ተሻሽሏል",
  "Dispute under review": "ቅሬታ በግምገማ ላይ ነው",
  "Dispute resolved": "ቅሬታ ተፈቷል",
  "Dispute dismissed": "ቅሬታ ውድቅ ተደርጓል",
};

const TITLE_RULES = [
  [/^(.+) has started$/, (m) => `${m[1]} ተጀምሯል`],
  [/^(.+) was cancelled$/, (m) => `${m[1]} ተሰርዟል`],
  [/^Cycle (\d+) contributions open$/, (m) => `የዙር ${m[1]} መዋጮዎች ተከፍተዋል`],
];

const DUE_RULES = [
  [
    /^is due in (\d+) days \((.+)\)$/,
    (m) => `በ${m[1]} ቀናት ውስጥ (${m[2]}) ይከፈላል`,
  ],
  [/^is due tomorrow \((.+)\)$/, (m) => `ነገ (${m[1]}) ይከፈላል`],
  [/^is due today$/, () => "ዛሬ ይከፈላል"],
  [/^was due on (.+)$/, (m) => `በ${m[1]} መከፈል ነበረበት`],
];

const CONSEQUENCE_RULES = [
  [/^Please pay on time\.$/, () => "እባክዎ በጊዜ ይክፈሉ።"],
  [
    /^A late penalty of (.+) applies from (.+)\.$/,
    (m) => `ከ${m[2]} ጀምሮ የ${m[1]} የመዘግየት ቅጣት ይተገበራል።`,
  ],
  [/^Please pay as soon as possible\.$/, () => "እባክዎ በተቻለ ፍጥነት ይክፈሉ።"],
];

const applyRules = (rules, text, language) => {
  for (const [pattern, build] of rules) {
    const match = text.match(pattern);

    if (match) return build(match, language);
  }

  return null;
};

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const MESSAGE_RULES = [
  [
    /^(.+?) reported a problem in (.+?): (.+)\.$/,
    (m) => `${m[1]} በ${m[2]} ችግር አሳውቋል፦ ${m[3]}።`,
  ],
  [
    /^(.+?) added a comment to the dispute "(.+)" in (.+)\.$/,
    (m) => `${m[1]} በ${m[3]} "${m[2]}" ቅሬታ ላይ አስተያየት ጨምሯል።`,
  ],
  [
    /^Your dispute "(.+)" in (.+) is now under review\.$/,
    (m) => `በ${m[2]} ያቀረቡት "${m[1]}" ቅሬታ አሁን በግምገማ ላይ ነው።`,
  ],
  [
    /^The dispute "(.+)" in (.+) was resolved\.$/,
    (m) => `በ${m[2]} የቀረበው "${m[1]}" ቅሬታ ተፈቷል።`,
  ],
  [
    /^The dispute "(.+)" in (.+) was dismissed\.$/,
    (m) => `በ${m[2]} የቀረበው "${m[1]}" ቅሬታ ውድቅ ተደርጓል።`,
  ],
  [
    /^Your first contribution of (.+?) is due on (.+)\.$/,
    (m) => `የመጀመሪያው መዋጮዎ ${m[1]} በ${m[2]} ይከፈላል።`,
  ],
  [
    /^The organizer cancelled (.+) before it started\.$/,
    (m) => `አደራጁ ${m[1]}ን ከመጀመሩ በፊት ሰርዞታል።`,
  ],
  [/^(.+) asked to join (.+)\.$/, (m) => `${m[1]} የ${m[2]} አባል ለመሆን ጠይቋል።`],
  [
    /^(.+) joined (.+) \((\d+) of (\d+) members\)\.$/,
    (m) => `${m[1]} ${m[2]}ን ተቀላቅሏል (${m[3]} ከ${m[4]} አባላት)።`,
  ],
  [/^You are now a member of (.+)\.$/, (m) => `አሁን የ${m[1]} አባል ሆነዋል።`],
  [
    /^Your request to join (.+) was declined\.$/,
    (m) => `የ${m[1]} አባልነት ጥያቄዎ ውድቅ ተደርጓል።`,
  ],
  [/^The organizer removed you from (.+)\.$/, (m) => `አደራጁ ከ${m[1]} አስወግዶዎታል።`],
  [
    /^Your contribution of (.+?) to (.+) \(cycle (\d+)\) was received\.$/,
    (m) => `ለ${m[2]} (ዙር ${m[3]}) ያዋጡት ${m[1]} ደርሶናል።`,
  ],
  [
    /^Your contribution to (.+) \(cycle (\d+)\) was waived\.$/,
    (m) => `ለ${m[1]} (ዙር ${m[2]}) የነበረብዎ መዋጮ ተሰርዟል።`,
  ],
  [
    /^All contributions for cycle (\d+) of (.+) are in \((.+)\)\. You can now perform the draw\.$/,
    (m) =>
      `የ${m[2]} የዙር ${m[1]} ሁሉም መዋጮዎች ገብተዋል (${m[3]})። አሁን ዕጣውን ማውጣት ይችላሉ።`,
  ],
  [
    /^(.+) won the draw for cycle (\d+) of (.+)\.$/,
    (m) => `${m[1]} የ${m[3]} የዙር ${m[2]} ዕጣ አሸንፏል።`,
  ],
  [
    /^You won the cycle (\d+) draw in (.+)\. The organizer will arrange your payout\.$/,
    (m) => `በ${m[2]} የዙር ${m[1]} ዕጣ አሸንፈዋል። አደራጁ ክፍያዎን ያመቻችልዎታል።`,
  ],
  [
    /^Your payout of (.+?) from (.+) \(cycle (\d+)\) was recorded as paid by (.+)\.$/,
    (m, language) =>
      `ከ${m[2]} (ዙር ${m[3]}) የ${m[1]} ክፍያዎ በ${translate(
        language,
        capitalize(m[4]),
      ).replace(/^የ/, "")} እንደተከፈለ ተመዝግቧል።`,
  ],
  [
    /^(.+) is complete\. Every member has received a payout\.$/,
    (m) => `${m[1]} ተጠናቋል። እያንዳንዱ አባል ክፍያውን ተቀብሏል።`,
  ],
  [
    /^Your contribution of (.+?) to (.+) is due on (.+)\.$/,
    (m) => `ለ${m[2]} የሚያዋጡት ${m[1]} በ${m[3]} ይከፈላል።`,
  ],
  [
    /^Your contribution of (.+?) to (.+?) (is due in \d+ days \(.+?\)|is due tomorrow \(.+?\)|is due today|was due on .+?)\. (Please pay on time\.|A late penalty of .+? applies from .+?\.|Please pay as soon as possible\.)$/,
    (m, language) => {
      const due = applyRules(DUE_RULES, m[3], language);
      const consequence = applyRules(CONSEQUENCE_RULES, m[4], language);

      return due && consequence
        ? `ለ${m[2]} የሚያዋጡት ${m[1]} ${due}። ${consequence}`
        : null;
    },
  ],
  [
    /^Your contribution to (.+) is overdue\. A late penalty of (.+) was added, so you now owe (.+)\.$/,
    (m) =>
      `ለ${m[1]} የሚያዋጡት መዋጮ ዘግይቷል። የ${m[2]} የመዘግየት ቅጣት ተጨምሯል፤ አሁን ${m[3]} ይከፍላሉ።`,
  ],
  [
    /^Your contribution of (.+?) to (.+) is overdue\. Please pay as soon as possible\.$/,
    (m) => `ለ${m[2]} የሚያዋጡት ${m[1]} ዘግይቷል። እባክዎ በተቻለ ፍጥነት ይክፈሉ።`,
  ],
  [
    /^(\d+) (?:member has an overdue contribution|members have overdue contributions) for cycle (\d+) of (.+)\.$/,
    (m) =>
      m[1] === "1"
        ? `በ${m[3]} የዙር ${m[2]} 1 አባል የዘገየ መዋጮ አለበት።`
        : `በ${m[3]} የዙር ${m[2]} ${m[1]} አባላት የዘገየ መዋጮ አለባቸው።`,
  ],
  [
    /^Cycle (\d+) of (.+) is fully collected\. Perform the draw so the payout can be arranged\.$/,
    (m) => `የ${m[2]} ዙር ${m[1]} ሙሉ በሙሉ ተሰብስቧል። ክፍያው እንዲመቻች ዕጣውን ያውጡ።`,
  ],
  [
    /^The payout of (.+?) to (.+) for cycle (\d+) of (.+) is still pending\.$/,
    (m, language) =>
      `የ${m[4]} የዙር ${m[3]} የ${m[1]} ክፍያ ለ${
        m[2] === "the winner" ? translate(language, "the winner") : m[2]
      } አሁንም በመጠባበቅ ላይ ነው።`,
  ],
  [/^(.+) left (.+)\.$/, (m) => `${m[1]} ከ${m[2]} ወጥቷል።`],
];

const localizeMoney = (text) => text.replace(/\bETB\b/g, "ብር");

const convert = (language, text, exact, rules) => {
  if (language !== "am" || !text) return text;

  const found =
    exact[text] ??
    applyRules(rules, text, language) ??
    translate(language, text);

  return localizeMoney(found);
};

export const translateNotification = (language, notification) => ({
  title: convert(language, notification.title, TITLES, TITLE_RULES),
  message: convert(language, notification.message, {}, MESSAGE_RULES),
});
