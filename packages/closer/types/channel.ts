export type ChannelType = 'season' | 'ground' | 'topic' | null;
export type JoinPolicy = 'auto' | 'invitation' | null;

export interface Channel {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  photo?: string;
  visibility?: 'public' | 'private';
  channelType: ChannelType;
  presenceRequired: number;
  joinPolicy: JoinPolicy;
  eventId?: string | null;
  eventName?: string;
  createdBy: string;
  visibleBy?: string[];
  pendingUserIds?: string[];
  created: string;
  updated?: string;
}

export type SubscribeResponse =
  | { message: 'Successfully subscribed to channel.' }
  | { message: 'Your request has been sent to an admin for approval.' }
  | { message: string; presenceRequired?: number; userPresence?: number };
