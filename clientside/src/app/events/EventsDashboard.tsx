'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import EventComponent from './eventComponent';
import CreateTaskPage from './create-task/page';
import RespondTask from './respond-task/page';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper, CircularProgress, Container, Alert, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { logout } from '../events/slices/authSlice';
import { RootState } from '../events/slices/store';
import { MyTasksPage } from './my-tasks/page';


// Define types
type AccessResult = { eventId: string; access: boolean; reason: string };
interface EventItem { 
  eventId: number; 
  processId: number; 
  eventName: string; 
  processName: string;
  
}

// Styled Components
const SidebarContainer = styled(Paper)({ 
  width: 280,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
 });
const MainContent = styled(Paper)({ 
  flex: 1,
  margin: '16px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
 });
const EventListItem = styled(ListItemButton)(({ theme }) => ({
  margin: '4px 0',
  borderRadius: '8px',
  '&.Mui-disabled': { opacity: 0.5, backgroundColor: theme.palette.action.disabledBackground },
}));

// Helper to get location
const getCurrentLocation = (): Promise<GeolocationPosition> => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));

export default function EventsDashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { role: userRole, token } = useSelector((state: RootState) => state.auth);
  
  const processIdParam = searchParams.get('process');
  const eventIdParam = searchParams.get('event');
  const processName = searchParams.get('name');
  const [hasMounted, setHasMounted] = useState(false);
  const processId = useMemo(() => (processIdParam ? parseInt(processIdParam) : null), [processIdParam]);
  const selectedEventId = useMemo(() => (eventIdParam ? parseInt(eventIdParam) : null), [eventIdParam]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Map<string, AccessResult>>(new Map());

  const handleLogOut = () => {
    localStorage.removeItem('token'); 
    dispatch(logout());
    router.push('/Auth');
  };
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!token || !processId) {
      setLoading(false);
      return;
    }

    const runChecks = async () => {
      setLoading(true);
      setError(null);
      let userLocation: GeolocationPosition | null = null;

      try {
        userLocation = await getCurrentLocation();
      } catch (locationError) {
        setError("Location access is required. Please enable location services in your browser and refresh the page.");
        setLoading(false);
        return;
      }

      let fetchedEvents: EventItem[] = [];
      try {
        const res = await fetch('http://localhost:5000/events/getEvents', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        fetchedEvents = data.filter((event: EventItem) => event.processId === processId);
        setEvents(fetchedEvents);
      } catch (fetchError) {
        setError("Failed to load events.");
        setLoading(false);
        return;
      }

      if (fetchedEvents.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const eventIds = fetchedEvents.map(e => e.eventId.toString());
        const res = await fetch('http://localhost:5000/events/bulk-verify-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            eventIds,
            userLatitude: userLocation.coords.latitude,
            userLongitude: userLocation.coords.longitude,
          }),
        });
        
        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const accessResults: AccessResult[] = await res.json();
        const permsMap = new Map<string, AccessResult>();
        accessResults.forEach(result => permsMap.set(result.eventId, result));
        setPermissions(permsMap);

      } catch (permsError: any) {
        console.error("Error during permission verification:", permsError);
        setError(`Failed to verify event permissions: ${permsError.message}`);
      } finally {
        setLoading(false);
      }
    };

    runChecks();
  }, [hasMounted,token, processId]);

  const handleEventClick = useCallback((event: EventItem) => {
    router.replace(`?process=${event.processId}&name=${processName}&event=${event.eventId}`);
  }, [router, processName]);

  const renderMainComponent = () => {
    if (!selectedEventId) {
      if (userRole === 'admin') return <MyTasksPage />;
      if (userRole === 'employee') return <RespondTask />;
      return <Typography sx={{ p: 4, textAlign: 'center' }}>Please select an event.</Typography>;
    }
    const event = events.find(e => e.eventId === selectedEventId);
    if (!event) return null;

    const eventName = event.eventName.toLowerCase().trim();
   
    if (eventName === 'create task') return <CreateTaskPage />;
    return <EventComponent
     event={event} />;
  };
   if (!hasMounted) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <SidebarContainer elevation={3}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">{processName || 'Events'}</Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : (
              <List disablePadding>
                {events.map((event) => {
                  const perm = permissions.get(event.eventId.toString());
                  const isAllowed = perm ? perm.access : true;
                  const reason = perm ? perm.reason : '';

                  return (
                    <Tooltip key={event.eventId} title={!isAllowed ? reason : ''} placement="right" arrow>
                      <div>
                        <EventListItem
                          selected={selectedEventId === event.eventId}
                          disabled={!isAllowed}
                          onClick={() => isAllowed && handleEventClick(event)}
                        >
                          <ListItemText primary={event.eventName} />
                        </EventListItem>
                      </div>
                    </Tooltip>
                  );
                })}
              </List>
            )}
          </div>
          <Box sx={{ p: 2 }}>
            <Button
              className="w-full hover:text-black hover:bg-[#F87C63] bg-[#FF9272]"
              onClick={handleLogOut}
            >
              LOG OUT
            </Button>
          </Box>
        </Box>
      </SidebarContainer>
      <MainContent elevation={2}>
        <Container sx={{ flex: 1, py: 4, overflow: 'auto' }}>
          {renderMainComponent()}
        </Container>
      </MainContent>
    </Box>
  );
}
