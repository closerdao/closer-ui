import VolunteerApplicationDetail from 'closer/components/VolunteerApplicationDetail';

const project = {
  _id: '6a16c00a169f414b172a0596',
  name: 'Costume organizer & repair',
  slug: 'seed-project',
  status: 'open',
  photo: '6a7ec98db9f647b3ffa146b2',
  start: '2026-09-01T10:00:00.000Z',
  end: '2026-11-30T11:00:00.000Z',
} as any;

const volunteerInfo = {
  bookingType: 'residence',
  skills: ['carpentry', 'sewing'],
  diet: ['vegetarian'],
  suggestions: '',
  projectId: [project._id],
  application: {
    about: {
      fullName: 'Ada Lovelace',
      nationality: 'British',
      ageRange: '25-34',
      phone: '+351 900 000 000',
      emergencyContactName: 'Charles',
      emergencyContactPhone: '+44 700 000 000',
      emergencyContactRelationship: 'Friend',
      hasInsurance: 'yes',
      hearAboutUs: 'friend',
    },
    experience: {
      hasVolunteeredBefore: 'yes',
      previousStay: 'Summer 2025',
      hopingToGain: 'Hands on building experience.',
      anticipatedChallenges: 'Early mornings.',
      selfCarePractices: 'Running and reading.',
    },
    health: {
      hasPhysicalConditions: 'no',
      takesMedication: 'no',
      allergies: 'None',
      consentedAt: '2026-08-01T10:00:00.000Z',
    },
    agreement: { acceptedAt: '2026-08-01T10:05:00.000Z', version: '2026-08-06' },
    review: { status: 'submitted' },
  },
} as any;

const PreviewPage = () => (
  <main className="main-content booking mx-auto flex w-full max-w-2xl flex-col gap-6 pb-10 md:gap-8 md:pb-16">
    <VolunteerApplicationDetail
      volunteerInfo={volunteerInfo}
      projects={[project]}
      canViewHealth
      applicantEmail="ada@example.com"
      applicantName="Ada Lovelace"
    />
  </main>
);

export default PreviewPage;
