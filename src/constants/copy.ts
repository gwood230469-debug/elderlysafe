export const copy = {
  auth: {
    google: 'Continue with Google',
  },
  onboarding: {
    name: { prompt: 'What should we call you?', placeholder: 'Your first name', continue: 'Continue' },
    circle: { title: 'Create your family circle' },
    addMembers: {
      title: 'Add family members',
      subtitle: "Add each person one at a time, then send them an invite link however you'd normally message them.",
      namePlaceholder: 'Name',
      phonePlaceholder: 'Phone number (optional)',
      addAnother: 'Add another',
      continue: 'Continue',
    },
    invite: { button: 'Send invite' },
    safeword: {
      waitingTitle: 'Waiting for your family to join',
      waitingBody: "Once someone accepts your invite, you'll set your shared safe word together.",
      continueHome: 'Continue to home',
    },
  },
  home: {
    greeting: (firstName: string) => `Good afternoon, ${firstName}`,
    cta: { title: 'Verify a call', subtitle: 'Someone asking for money or help right now? Check here first.' },
    verifyScriptLink: 'What to do if a call feels wrong',
    circle: { label: 'Your family circle' },
  },
  safeword: {
    instruction: 'Choose a word or short phrase only your family would know.',
    guidance: 'Avoid pet names, birthdays, or anything public on social media.',
    save: 'Save safe word',
    changedNotification: 'Your family safe word was updated.',
    exportCard: 'Print a card for your family',
    exportCardError: "Could not create the card. Please try again.",
  },
  circle: {
    add: 'Add family member',
    addAnother: 'Add another',
    status: { invited: 'Invited — waiting', confirmed: 'Protected' },
    resend: 'Resend invite',
    call: (name: string) => `Call ${name}`,
  },
  loopin: {
    button: 'Loop in someone else',
    notification: (name: string) => `${name} thinks they might be on a scam call. Can you help?`,
  },
  verifyScript: {
    title: 'If a call feels wrong, do this',
    subtitle: "You don't need to figure this out live on the phone. Just work down this list.",
    steps: [
      'Hang up. A genuine emergency can always wait two minutes for you to call back safely — a scammer pressuring you to stay on the line is itself a warning sign.',
      "Call them back yourself, using the number you already have saved for them — never the number that just called you, even if the caller ID looked right.",
      'Ask them your family safe word. Real family always knows it. A scammer never will.',
      "Don't send money, gift cards, wire transfers, or cryptocurrency to anyone while you're still unsure — no genuine emergency requires that from you over the phone.",
      'Still unsure? Loop in another family member before doing anything else.',
    ],
    stillNeedHelp: 'If you believe someone is in immediate danger, use your phone\'s own emergency call feature — see the numbers below.',
  },
  emergencyNumbers: {
    title: 'Emergency numbers',
    subtitle: (countryName: string) => `Showing numbers for ${countryName}, based on your phone's language and region.`,
    emergencyLabel: 'Emergency — fire, police, ambulance',
    emergencySosNote:
      "For an active emergency, your phone's own Emergency SOS feature is often faster than dialling — it works even from the lock screen.",
    nonEmergencyLabel: 'Non-emergency police',
    nonEmergencyMissing: 'No single national number — see the note below.',
    embassyLabel: "Outside your home country?",
    detectLocationButton: 'Use my current location instead',
    detecting: 'Finding your location…',
    locationDeniedError: "Couldn't access your location. Showing numbers based on your phone's language/region setting instead.",
    sourceNote: (date: string) => `Numbers last checked ${date}. Always confirm locally if in doubt.`,
  },
  settings: {
    changeSafeWord: 'Change safe word',
    manageCircle: 'Manage circle',
    notifications: 'Notification preferences',
    callProtection: 'Call protection',
    signOut: 'Sign out',
  },
  notificationPreferences: {
    title: 'Notification preferences',
    callRisk: {
      label: 'Call risk alerts',
      detail: 'When a family member flags a call as possible scam risk.',
    },
    familyRequests: {
      label: 'Family requests',
      detail: 'Loop-in requests and safeword check prompts from your circle.',
    },
    loadError: 'Could not load your notification preferences.',
    saveError: 'Could not save that change. Please try again.',
  },

  // --- Elderly-side call screens (handoff screens 1-3) ---
  incomingCall: {
    riskTag: (percent: number) => `Scam risk: ${percent}%`,
    unknownCaller: 'Unknown Caller',
    caution: 'Spoofed area code · never called before',
    decline: 'Decline',
    answer: 'Answer',
    alertButton: 'Say the safeword to alert family',
    endCall: 'End call',
    alertedTitle: 'Family alerted, silently.',
    alertedBody: 'Help is joining →',
  },
  askSafeword: {
    prompt: "Ask them: what's our safeword?",
    supporting: 'Real family always knows it. A scammer never will.',
    correct: 'They said it correctly',
    wrong: 'Wrong, or no answer',
    verifiedTitle: 'Verified — safe to keep talking.',
    footer: "If they can't say the word, hang up. That's okay — it doesn't need an explanation.",
  },
  guidedCall: {
    // The handoff's "family joining" screen described the app silently
    // adding a family member as a live audio participant — not possible via
    // any public Android/iOS API against a real carrier call. This is the
    // honest, guided version: the app coaches the elderly user to do it
    // themselves via their phone's own native 3-way calling.
    title: (name: string) => `Add ${name} to this call`,
    body: (name: string) =>
      `${name} has been alerted and is standing by. On your phone, tap "Add call", dial ${name}, then "Merge calls" to bring everyone onto the line together.`,
    statusPill: (name: string) => `${name} is standing by`,
    continueButton: 'Continue the call together',
  },

  // --- Family-side screens (handoff screens 4-6) ---
  callAlert: {
    appLabel: 'SAFEWORD',
    body: (name: string, percent: number) => `${name}'s call just flagged ${percent}% scam risk. They may need you.`,
    dismiss: 'Dismiss',
    join: 'Join call',
    joinedNotice: 'Joined — see it in the call screen →',
  },
  familyGuiding: {
    title: (name: string) => `Guiding ${name}`,
    body: (name: string) => `${name} is adding you to the call now. Stay by your phone — it'll ring any moment.`,
    callNowFallback: (name: string) => `Call ${name} now`,
    askSafewordAction: 'Ask them for the safeword',
  },
  dashboard: {
    title: 'SafeWord',
    familyCircleLabel: 'Family circle',
    recentCallsLabel: 'Recent calls',
    recentCallsEmpty: "No calls have needed checking yet — that's a good thing.",
    safewordLabel: 'Shared safeword',
    safewordMasked: '• • • • • •',
    safewordChange: 'Change',
    safewordKnownBy: (names: string) => `Known by ${names}`,
    outcome: {
      declined: 'Declined',
      verified_safe: 'Verified safe',
      safeword_failed: 'Family joined',
      ignored: 'No action taken',
    } as Record<string, string>,
  },
} as const;
