import React from 'react';
import { Pencil } from 'lucide-react';

interface ReviewSurveyProps {
  formData: {
    setup: {
      surveyTitle: string;
      surveyType: string;
      surveyDescription: string;
      startDate: string;
      startTime: string;
      endTime: string;
      endDate: string;
    };
    audience: {
      id: string
      username: string
    }[];
    questions: {
      questionText: string;
      answerType: string;
      options?: { optionText: string }[];
    }[];
  };
  goToStep: (step: number) => void;
  handleSubmit: () => void;
}


const ReviewSurvey: React.FC<ReviewSurveyProps> = ({ formData, goToStep, handleSubmit }) => {
  return (
    <div className="p-6 space-y-6 bg-white rounded-xl shadow-md">
      {/* Survey Setup Review */}
      <div className="relative">
        <h2 className="text-xl font-semibold">Survey Setup</h2>
        <button className="absolute top-0 right-0" onClick={() => goToStep(0)}>
          <Pencil className="w-5 h-5 text-blue-500 hover:text-blue-700" />
        </button>
        <p><strong>Title:</strong> {formData.setup.surveyTitle}</p>
        <p><strong>Type:</strong> {formData.setup.surveyType}</p>
        <p><strong>Description:</strong> {formData.setup.surveyDescription}</p>
        <p><strong>Start:</strong> {formData.setup.startDate} {formData.setup.startTime}</p>
        <p><strong>End:</strong> {formData.setup.endDate} {formData.setup.endTime}</p>
      </div>

      {/* Audience Review */}
      <div className="relative">
        <h2 className="text-xl font-semibold">Audience</h2>
        <button className="absolute top-0 right-0" onClick={() => goToStep(1)}>
          <Pencil className="w-5 h-5 text-blue-500 hover:text-blue-700" />
        </button>
        <ul className="list-disc ml-5">
          {formData.audience.map(user => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      </div>

      {/* Questions Review */}
      <div className="relative">
        <h2 className="text-xl font-semibold">Questions</h2>
        <button className="absolute top-0 right-0" onClick={() => goToStep(2)}>
          <Pencil className="w-5 h-5 text-blue-500 hover:text-blue-700" />
        </button>
        <ol className="list-decimal ml-5 space-y-2">
          {formData.questions.map((q, index) => (
            <li key={index}>
              <p><strong>Q{index + 1}:</strong> {q.questionText}</p>
              <p><strong>Type:</strong> {q.answerType}</p>
              {Array.isArray(q.options) && q.options.length > 0 && (

                <ul className="list-disc ml-5">
                  {q.options?.map((opt, i) => (
                    <li key={i}>{opt.optionText}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Submit Button */}
      <div className="text-right">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Survey
        </button>
      </div>
    </div>
  );
};

export default ReviewSurvey;
