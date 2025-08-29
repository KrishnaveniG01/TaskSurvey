// components/eventViews/eventMap.tsx

import MyAllTasksPage from "@/app/events/all-tasks/page";
import CreateSurvey from "@/app/events/create-survey/page";
import CreateTaskPage from "@/app/events/create-task/page";
import MyDraftsTasksPage from "@/app/events/draft-tasks/page";
import MySurveys from "@/app/events/my-surveys/page";
import MyTasksPage from "@/app/events/my-tasks/page";
import ManagerReviewPage from "@/app/events/review-task/page"
import RespondSurveys from "@/app/events/respond-surveys/page";
import RespondTask from "@/app/events/respond-task/page";
import React, { JSX } from "react";

// Props that might be passed to any component
interface EventItem {
  eventId: number;
  eventName: string;
  processId: number;
  processName: string;
}

type CommonProps = {
  userId?: string;
  event: EventItem;
};

// Unified function-returning map
export const eventComponentMap: Record<number, (props: CommonProps) => JSX.Element> = {
  // Components that don't need props - just return the component
  110: (props) => React.createElement(CreateSurvey),
  106: (props) => React.createElement(CreateTaskPage),
  102: (props) => React.createElement(MyTasksPage),
  103: (props) => React.createElement(MyDraftsTasksPage),
  104: (props) => React.createElement(MyAllTasksPage),
  
  
  108: ({ userId }) => {
    if (!userId) {
      return React.createElement("div", {}, "User ID is required to display surveys");
    }
    return React.createElement(MySurveys, { userId });
  },
  109: (props) => React.createElement(RespondSurveys), 

  114: (props) => React.createElement(RespondTask),
  113: (props) => React.createElement(ManagerReviewPage)
};