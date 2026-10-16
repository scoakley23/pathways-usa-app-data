// Content for the "Talk to a lawyer first" page. Draft items — the app owner
// will finalize them after legal review. Shown as a plain list; nothing here
// is tracked, checked, or answered in the app.

export const LAWYER_CHECKLIST_ITEMS = [
  {
    id: 'arrested',
    text: 'You have ever been arrested, cited, or charged with anything, even if it was dismissed or happened in another country',
    explanation:
      'Even old, small, or dismissed cases can matter. A lawyer can check how your case affects your application.',
  },
  {
    id: 'taxes',
    text: "You owe taxes, didn't file taxes, or filed as a \"nonresident\"",
    explanation:
      'You can still apply if you owe money — but how you filed (or did not file) must be handled the right way first.',
  },
  {
    id: 'long-trip',
    text: 'You have been outside the U.S. for 6 months or more at one time',
    explanation:
      'A long trip can break your "continuous residence." A lawyer can tell you what it means for your case.',
  },
  {
    id: 'voted',
    text: 'You have ever voted, registered to vote, or said you were a U.S. citizen',
    explanation:
      'This is one of the most serious issues in immigration law. Always talk to a lawyer before you file.',
  },
  {
    id: 'removal',
    text: 'You have ever been in deportation/removal proceedings or had an immigration application denied',
    explanation:
      'Past immigration problems can change what USCIS looks for in your new application.',
  },
  {
    id: 'selective-service',
    text: 'You did not register for Selective Service when required',
    explanation:
      'Most men living in the U.S. between ages 18 and 26 had to register. A lawyer can help if you did not.',
  },
  {
    id: 'child-support',
    text: 'You owe child support',
    explanation:
      'USCIS asks whether you failed to support your dependents. A lawyer can help you answer this safely.',
  },
  {
    id: 'green-card',
    text: 'Questions about how you got your green card',
    explanation:
      'How you got your green card matters. If you are not sure it was proper, ask a lawyer first.',
  },
];

export const LEGAL_HELP_LINKS = [
  {
    label: 'ImmigrationLawHelp.org',
    url: 'https://www.immigrationlawhelp.org',
    description: 'Directory of nonprofit legal services, searchable by state and language.',
  },
  {
    label: 'DOJ — Recognized Organizations and Accredited Representatives',
    url: 'https://www.justice.gov/eoir/recognition-and-accreditation-program',
    description:
      'Official U.S. Department of Justice list of organizations and representatives accredited to give immigration legal help.',
  },
  {
    label: 'Citizenshipworks',
    url: 'https://www.citizenshipworks.org',
    description: 'Free online tool that helps you complete your application and connects you to legal help.',
  },
];