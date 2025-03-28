import { ScheduleEvent } from '@/components/calendar/Calendar';

// Helper to create dates relative to today
const createDate = (dayOffset: number, hours: number, minutes: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Generate mock schedule events
export const getMockScheduleEvents = (): ScheduleEvent[] => {
  const today = new Date();
  
  return [
    // Today's events
    {
      id: '1',
      title: 'Team Meeting',
      start: createDate(0, 14, 0), // Today at 2:00 PM
      end: createDate(0, 15, 0),   // Today at 3:00 PM
      isAllDay: false,
      type: 'event',
      location: 'Conference Room A',
      description: 'Weekly team sync to discuss project progress'
    },
    {
      id: '2',
      title: 'Lunch with Client',
      start: createDate(0, 12, 0), // Today at 12:00 PM
      end: createDate(0, 13, 30),  // Today at 1:30 PM
      isAllDay: false,
      type: 'event',
      location: 'Downtown Cafe',
      description: 'Discuss new project requirements'
    },
    {
      id: '3',
      title: 'Dentist Appointment',
      start: createDate(0, 16, 30), // Today at 4:30 PM
      end: createDate(0, 17, 30),   // Today at 5:30 PM
      isAllDay: false,
      type: 'reminder',
      location: 'Dental Clinic',
      description: 'Regular checkup'
    },
    {
      id: '4',
      title: 'Review Project Proposal',
      start: createDate(0, 0, 0),
      end: createDate(0, 23, 59),
      isAllDay: true,
      type: 'all-day',
      description: 'Final review of the project proposal before submission'
    },
    
    // Tomorrow's events
    {
      id: '5',
      title: 'Project Review',
      start: createDate(1, 10, 0), // Tomorrow at 10:00 AM
      end: createDate(1, 11, 30),  // Tomorrow at 11:30 AM
      isAllDay: false,
      type: 'event',
      location: 'Virtual Meeting',
      description: 'Review project milestones and timelines'
    },
    {
      id: '6',
      title: 'Submit Expense Report',
      start: createDate(1, 15, 0), // Tomorrow at 3:00 PM
      end: createDate(1, 15, 30),  // Tomorrow at 3:30 PM
      isAllDay: false,
      type: 'reminder',
      description: 'Submit monthly expense report to finance'
    },
    
    // Later this week
    {
      id: '7',
      title: 'Client Call',
      start: createDate(4, 16, 0), // 4 days from now at 4:00 PM
      end: createDate(4, 16, 30),  // 4 days from now at 4:30 PM
      isAllDay: false,
      type: 'event',
      location: 'Phone Call',
      description: 'Follow-up call with client about project status'
    },
    {
      id: '8',
      title: 'Team Building Event',
      start: createDate(5, 0, 0),
      end: createDate(5, 23, 59),
      isAllDay: true,
      type: 'all-day',
      location: 'City Park',
      description: 'Annual team building event'
    },
    
    // Next week
    {
      id: '9',
      title: 'Quarterly Planning',
      start: createDate(8, 9, 0),  // 8 days from now at 9:00 AM
      end: createDate(8, 17, 0),   // 8 days from now at 5:00 PM
      isAllDay: true,
      type: 'event',
      location: 'Conference Center',
      description: 'Quarterly planning session for Q3'
    },
    {
      id: '10',
      title: 'Product Launch',
      start: createDate(10, 13, 0), // 10 days from now at 1:00 PM
      end: createDate(10, 16, 0),   // 10 days from now at 4:00 PM
      isAllDay: false,
      type: 'event',
      location: 'Main Auditorium',
      description: 'Launch of new product line'
    }
  ];
};
