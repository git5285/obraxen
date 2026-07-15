export type NavigationItemCopy = {
  label: string;
  section?: "process" | "services" | "company" | "faq";
};

export type LegalSectionCopy = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly { label: string; text: string }[];
};

export type LegalDocumentCopy = {
  title: string;
  description: string;
  intro: string;
  alertTitle: string;
  alertText: string;
  relatedRoute: "legalNotice" | "privacy" | "cookies";
  relatedLabel: string;
  sections: readonly LegalSectionCopy[];
};

export type Dictionary = {
  meta: {
    homeDescription: string;
    heroImageAlt: string;
    projectsTitle: string;
    projectsDescription: string;
    projectTitleSuffix: string;
    contactTitle: string;
    contactDescription: string;
  };
  common: {
    skipToContent: string;
    home: string;
    projects: string;
    noData: string;
    menuOpen: string;
    menuClose: string;
    mainNavigation: string;
    mobileMenu: string;
    breadcrumbs: string;
  };
  navigation: {
    items: readonly NavigationItemCopy[];
  };
  languageSwitcher: {
    label: string;
    changeTo: string;
  };
  hero: {
    kicker: string;
    title: string;
    body: string;
    crackBefore: string;
    crackAfter: string;
  };
  intro: {
    fallbackKicker: string;
    whyFallbackKicker: string;
    title: string;
    experienceLabel: string;
    responseLabel: string;
    phasesLabel: string;
    methodAria: string;
    methodWords: readonly [string, string, string];
    methodBody: string;
  };
  process: {
    kicker: string;
    title: string;
    steps: readonly { title: string; description: string }[];
    sectorsAria: string;
    sectors: readonly string[];
  };
  services: {
    kicker: string;
    title: string;
    intro: string;
    items: readonly { title: string; description: string }[];
    otherTitle: string;
    otherWorks: readonly string[];
  };
  projectsSection: {
    kicker: string;
    title: string;
    intro: string;
    galleryAria: string;
    magnitudesAria: string;
    situation: string;
    openCase: string;
    openCaseAria: string;
  };
  company: {
    title: string;
    intro: string;
    diagnosisTitle: string;
    diagnosisBody: string;
    teamsTitle: string;
    teamsBody: string;
    operationsTitle: string;
    operationsBody: string;
    europeTitle: string;
    europeBody: string;
  };
  faq: {
    kicker: string;
    title: string;
    intro: string;
    items: readonly { question: string; answer: string }[];
  };
  cta: {
    assessment: string;
    projects: string;
    services: string;
  };
  projectHub: {
    navigationAria: string;
    backToSite: string;
    kicker: string;
    title: string;
    intro: string;
    archiveNote: string;
    archiveAria: string;
    projectReference: string;
    client: string;
    sector: string;
    location: string;
    documentedSituation: string;
    executedIntervention: string;
    confirmedClose: string;
    confirmedCloseBody: string;
    openDossier: string;
    openDossierAria: string;
    galleryAria: string;
    evidenceAria: string;
  };
  projectCase: {
    navigationAria: string;
    allProjects: string;
    kicker: string;
    confirmedScope: string;
    photoKicker: string;
    photoTitle: string;
    photoBody: string;
    dossier: string;
    reference: string;
    status: string;
    executedStatus: string;
    result: string;
    photoDocumented: string;
    execution: string;
    duration: string;
    facilityArea: string;
    team: string;
    workers: string;
    operation: string;
    continuity: Record<"total" | "parcial" | "detenida" | "sin_actividad", string>;
    technicalReading: string;
    storyTitle: string;
    initialSituation: string;
    executedIntervention: string;
    documentedResult: string;
    confirmedResources: string;
    machinery: string;
    materials: string;
    otherCases: string;
    previousCase: string;
    nextCase: string;
  };
  footer: {
    fallbackCopyright: string;
    rights: string;
    industrialRepair: string;
    primaryMarkets: string;
    legalName: string;
    taxId: string;
    address: string;
    activity: string;
    activityBody: string;
    general: string;
    services: string;
    contact: string;
    hours: string;
    legalNotice: string;
    privacy: string;
    cookies: string;
  };
  consent: {
    privacy: string;
    bannerTitle: string;
    bannerBody: string;
    cookieInfo: string;
    reject: string;
    configure: string;
    accept: string;
    reopen: string;
    closeAria: string;
    settingsKicker: string;
    settingsTitle: string;
    settingsBody: string;
    essentialTitle: string;
    essentialBody: string;
    alwaysActive: string;
    analyticsTitle: string;
    analyticsBody: string;
    save: string;
  };
  contact: {
    kicker: string;
    title: string;
    intro: string;
    unavailableTitle: string;
    unavailableBody: string;
    projectsLink: string;
    name: string;
    email: string;
    company: string;
    country: string;
    phone: string;
    message: string;
    privacyConsent: string;
    privacyLink: string;
    submit: string;
    sending: string;
    successTitle: string;
    successBody: string;
    error: string;
    validationError: string;
    honeypot: string;
  };
  legal: {
    navigationAria: string;
    backToSite: string;
    draftStatus: string;
    lastReview: string;
    notice: LegalDocumentCopy;
    privacy: LegalDocumentCopy;
    cookies: LegalDocumentCopy;
    factLabels: {
      owner: string;
      taxId: string;
      address: string;
      email: string;
      domain: string;
      register: string;
      controller: string;
      privacyContact: string;
      key: string;
      origin: string;
      firstParty: string;
      duration: string;
      purpose: string;
      preferencePurpose: string;
      days: string;
    };
  };
};
