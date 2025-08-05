import React from 'react';
import Timeline, {
  CustomMarker,
  DateHeader,
  ReactCalendarTimelineProps,
  SidebarHeader,
  TimelineHeaders,
} from 'react-calendar-timeline';

// Type-safe wrapper to fix React 18 compatibility issues
const TimelineWrapper: React.FC<ReactCalendarTimelineProps> = (props) => {
  return <Timeline {...props} />;
};

export default TimelineWrapper;
export { CustomMarker, DateHeader, SidebarHeader, TimelineHeaders };
export type { ReactCalendarTimelineProps };
