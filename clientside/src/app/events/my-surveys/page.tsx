import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSurveysCreatedByUser } from '../slices/surveySlice';
import { RootState, AppDispatch} from '../slices/store'

const MySurveys: React.FC<{ userId: string }> = ({ userId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { createdSurveys, loading, error } = useSelector((state: RootState) => state.survey);
  console.log("created surveys are ;", createdSurveys)
  const now = new Date();

  // Pagination state

  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const limit = 5;

  console.log("created surveys:", createdSurveys)
  const surveysFlat = Array.isArray(createdSurveys[0]) ? createdSurveys[0] : createdSurveys;


  const totalPages = Math.ceil(createdSurveys.length / itemsPerPage);

  //  Fetch surveys
  useEffect(() => {
    if (userId) {
      dispatch(fetchSurveysCreatedByUser({ userId, page, limit }));
    }
  }, [userId, page,dispatch]);

  // Handlers for page change
  const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

  if (loading) return <p>Loading surveys...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">My Created Surveys</h2>

      {createdSurveys.length === 0 ? (
        <p>No surveys created yet.</p>
      ) : (
        <>
          <table className="w-full table-auto border-collapse shadow-md rounded-3xl mb-4">
            <thead className="bg-indigo-100">
              <tr>
                <th className="border p-3 text-left">Title</th>
                <th className="border p-3 text-left">Start Date</th>
                <th className="border p-3 text-left">End Date</th>
                <th className="border p-3 text-center">Assignees</th>
                <th className="border p-3 text-center">Status</th>
                <th className="border p-3 text-center">Created On</th>
              </tr>
            </thead>
            <tbody>
              {surveysFlat.map((survey: any) => (
                <tr key={survey.surveyId} className="hover:bg-indigo-50">
                  <td className="border p-3">{survey.surveyTitle}</td>
                  <td className="border p-3">
                    {new Date(survey.startDate).toLocaleString()}
                  </td>
                  <td className="border p-3">
                    {new Date(survey.endDate).toLocaleString()}
                  </td>
                  <td className="border p-3 text-center">{survey.numAssignees || 0}</td>
                  <td className="border p-3 text-center">
                    {survey.status === 'A' ? 'Active' : 'Inactive'}
                  </td>
                  <td className="border p-3 text-center">
                    {(survey.createdOn).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Pagination Controls */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MySurveys;
