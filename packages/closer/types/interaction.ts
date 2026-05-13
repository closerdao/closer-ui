export type InteractionInitApiResponse = {
  results: { sessionkey: string };
};

export type InteractionUserRef =
  | string
  | {
      _id?: string;
      screenname?: string;
      email?: string;
      photo?: string;
      slug?: string;
      timezone?: string;
      lastactive?: string;
    };

export type InteractionDocument = {
  _id: string;
  user?: InteractionUserRef;
  subscriber?: string | { _id?: string };
  linkedAt?: string;
  ip?: string;
  userAgent?: string;
  acceptLanguage?: string;
  timezone?: string;
  screen?: string;
  viewport?: string;
  referrer?: string;
  utm?: Record<string, unknown>;
  browser?: string;
  os?: string;
  device?: string;
  geo?: Record<string, unknown>;
  lastSeenAt?: string;
  lastactive?: string;
  endedAt?: string;
  signals?: Record<string, unknown>;
  createdBy?: string;
  sessionkey?: string;
  path?: string;
  url?: string;
  page?: string;
};

export type InteractionLiveRow = InteractionDocument;
