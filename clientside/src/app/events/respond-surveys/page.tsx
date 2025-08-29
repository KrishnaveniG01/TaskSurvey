import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchUserSurveys } from '../slices/surveySlice';
import { RootState } from '../slices/store';
import { differenceInCalendarDays, isToday, isBefore, isAfter, parseISO } from 'date-fns';
import { AppDispatch } from '../slices/store';
// Mock data for demonstration - replace with your actual Redux slice
interface Survey {
  surveyId: string;
  surveyTitle: string;
  surveyDescription: string;
  mandatory?: boolean;
  startDate?: string;
  endDate?: string;
  status?: 'Due Today' | 'Ongoing' | 'Completed';
  isDraft?: boolean;
  inProgress?: boolean;
  completed?: boolean;
}

const RespondSurveys: React.FC = () => {
  const [activeView, setActiveView] = useState<'board' | 'table'>('board');
  const router = useRouter();
  // hooks.ts
  const useAppDispatch = () => useDispatch<AppDispatch>();

  const dispatch = useAppDispatch();
  const userId = useSelector((state: RootState) => state.auth.userId);
  // Mock data - replace with your actual Redux selectors
  const { rawSurveys, loading, error } = useSelector((state: RootState) => state.survey);
  const assignedSurveys = rawSurveys.map((s) => {
    const now = new Date();
    const start = parseISO(s.startDate || '');
    const end = parseISO(s.endDate || '');

    let status: 'Due Today' | 'Ongoing' | 'Completed' = 'Ongoing';
    if (isToday(end)) {
      status = 'Due Today';
    } else if (isAfter(now, end)) {
      status = 'Completed';
    }

    return { ...s, status };
  });
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserSurveys(userId));
    }
  }, [userId, dispatch]);
  console.log("assigned surveys are:", assignedSurveys)
  // const surveys: Survey[] = [
  //   {
  //     surveyId: '1',
  //     surveyTitle: 'Employee Satisfaction Survey',
  //     surveyDescription: 'Help us improve workplace culture',
  //     mandatory: true,
  //     status: 'Due Today',
  //     startDate: '2025-01-20T09:00:00Z',
  //     endDate: '2025-01-25T17:00:00Z'
  //   },
  //   {
  //     surveyId: '2',
  //     surveyTitle: 'Project Feedback',
  //     surveyDescription: 'Share your thoughts on the recent project',
  //     status: 'In Progress',
  //     startDate: '2025-01-15T09:00:00Z',
  //     endDate: '2025-01-30T17:00:00Z'
  //   },
  //   {
  //     surveyId: '3',
  //     surveyTitle: 'Training Evaluation',
  //     surveyDescription: 'Evaluate the effectiveness of recent training',
  //     status: 'Completed',
  //     startDate: '2025-01-10T09:00:00Z',
  //     endDate: '2025-01-20T17:00:00Z'
  //   }
  // ];

  const dueTodaySurveys = assignedSurveys.filter(s => s.status === 'Due Today');
  const inProgressSurveys = assignedSurveys.filter(s => s.status === 'Ongoing');
  const completedSurveys = assignedSurveys.filter(s => s.status === 'Completed');

  const StatusCard = ({ title, count, color, surveys }: {
    title: string;
    count: number;
    color: string;
    surveys: Survey[];
  }) => (
    <div className="bg-white rounded-lg border p-4 min-h-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className="font-semibold text-gray-800">{title} ({count})</h3>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No Data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => (
            <div
              key={survey.surveyId}
              className="bg-gray-50 rounded p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                router.push(`/events/takeSurvey/${survey.surveyId}`);
                console.log('Navigate to survey:', survey.surveyId);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm text-gray-800 flex-1">
                  {survey.surveyTitle}
                </h4>
                {survey.mandatory && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded ml-2">
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {survey.surveyDescription}
              </p>
              <p className="text-xs text-gray-500">
                Due: {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveView('board')}
          className={`flex items-center gap-2 px-3 py-2 rounded ${activeView === 'board'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Board view
        </button>
        <button
          onClick={() => setActiveView('table')}
          className={`flex items-center gap-2 px-3 py-2 rounded ${activeView === 'table'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Table view
        </button>
      </div>

      {/* Board View */}
      {activeView === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title="Due Today"
            count={dueTodaySurveys.length}
            color="bg-orange-500"
            surveys={dueTodaySurveys}
          />
          <StatusCard
            title="In Progress"
            count={inProgressSurveys.length}
            color="bg-blue-500"
            surveys={inProgressSurveys}
          />
          <StatusCard
            title="Completed"
            count={completedSurveys.length}
            color="bg-green-500"
            surveys={completedSurveys}
          />
        </div>
      )}

      {/* Table View */}
      {activeView === 'table' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Survey
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedSurveys.map((survey) => (
                  <tr
                    key={survey.surveyId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/events/takeSurvey/${survey.surveyId}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {survey.surveyTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          {survey.surveyDescription}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.status === 'Due Today'
                          ? 'bg-orange-100 text-orange-800'
                          : survey.status === 'Ongoing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {survey.mandatory ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Mandatory
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          Optional
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RespondSurveys;