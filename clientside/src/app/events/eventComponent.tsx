'use client';

import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from "./slices/store";
import { eventComponentMap } from '@/components/eventMaps';

interface EventItem {
  eventId: number;
  eventName: string;
  processId: number;
  processName: string;
}

interface Props {
  event: EventItem | null;
}

export default function EventComponent({ event }: Props) {
  const userId = useSelector((state: RootState) => state.auth.userId)?? undefined;

  if (!event || event.eventId == null) {
    return (
      <Typography color="textSecondary">
        Please select an event from the sidebar.
      </Typography>
    );
  }

  const Component = eventComponentMap[event.eventId];

  return (
    <div>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      {event.eventName}
    </Typography>

    {Component ? (
      <Component userId={userId} event={event} /> 
    ) : (
      <Typography color="error">
        No UI mapped for event ID "{event.eventId}"
      </Typography>
    )}
  </div>
  );
}
