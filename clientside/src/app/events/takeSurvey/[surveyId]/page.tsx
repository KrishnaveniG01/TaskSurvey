"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../../slices/store';

interface Option {
  optionText?: string;
}

interface Question {
  questionId: string;
  questionText: string;
  answerType?: string;
  options?: Option[];
}

interface Survey {
  surveyId: string;
  surveyTitle: string;
  description: string;
  questions: Question[];
}

const TakeSurvey: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const surveyId = params?.surveyId as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);

  useEffect(() => {
  const parseOptions = (opt: any) => {
    try {
      if (opt?.type === 'Buffer') {
        const text = new TextDecoder().decode(new Uint8Array(opt.data));
        return JSON.parse(text);
      }
      return opt;
    } catch (e) {
      console.error('Failed to parse options:', e);
      return [];
    }
  };

  const fetchSurvey = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/survey/${surveyId}`);
      const parsedQuestions = res.data.questions.map((q: Question) => ({
        ...q,
        options: parseOptions(q.options),
      }));

      setSurvey({
        ...res.data,
        questions: parsedQuestions,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setError('Failed to load survey.');
      setLoading(false);
    }
  };

  if (surveyId) fetchSurvey();
}, [surveyId]);


  const handleAnswerChange = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, optionText: string, checked: boolean) => {
    setResponses((prev) => {
      const prevArr = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const newArr = checked
        ? [...prevArr, optionText]
        : prevArr.filter((opt: string) => opt !== optionText);
      return { ...prev, [questionId]: newArr };
    });
  };

  const handleSubmit = async () => {
    if (!survey) return;

    const unanswered = survey.questions.filter((q) => {
      const ans = responses[q.questionId];
      return (
        ans === undefined ||
        ans === null ||
        (typeof ans === 'string' && ans.trim() === '') ||
        (Array.isArray(ans) && ans.length === 0)
      );
    });

    if (unanswered.length > 0) {
      toast.error('Please answer all questions before submitting!');
      return;
    }

    const answers = Object.entries(responses).map(([questionId, answerValue]) => ({
      questionId,
      answerText: Array.isArray(answerValue)
        ? JSON.stringify(answerValue)
        : answerValue?.toString() || '',
    }));

    const payload = {
      surveyId: survey.surveyId,
      userId,
      answers,
    };

    try {
      await axios.post('http://localhost:5000/survey/submit', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Survey submitted successfully!');
      router.push('/events');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Submission failed. Please try again.');
    }
  };
  console.log("survey questions :", survey?.questions)

  if (loading) return <p className="p-4 text-gray-500">Loading survey...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!survey) return <p className="p-4 text-gray-500">Survey not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
      <div className="p-4">
        <button className="mb-4 text-blue-600 hover:underline" onClick={() => router.back()}>
          Back
        </button>
      </div>

      <h2 className="text-2xl font-bold">{survey.surveyTitle}</h2>
      <p className="text-gray-600">{survey.description}</p>

      {survey.questions.map((q, idx) => (
        <div key={q.questionId} className="border p-4 rounded space-y-2">
          <p className="font-semibold">
            {idx + 1}. {q.questionText}
          </p>

          {(() => {
            const type = q.answerType?.toLowerCase?.() || 'unknown';

            switch (type) {
              case 'radio':
                return q.options?.map((opt, i) => (
                  <label key={`${q.questionId}-radio-${i}`} className="block">
                    <input
                      type="radio"
                      name={q.questionId}
                      value={opt.optionText}
                      onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                      className="mr-2"
                    />
                    {opt.optionText || 'Option'}
                  </label>
                ));
              case 'checkbox':
                return q.options?.map((opt, i) => (
                  <label key={`${q.questionId}-checkbox-${i}`} className="block">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        handleCheckboxChange(q.questionId, opt.optionText || '', e.target.checked)
                      }
                      className="mr-2"
                    />
                    {opt.optionText || 'Option'}
                  </label>
                ));
              case 'dropdown':
                return (
                  <select
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                    className="p-2 border rounded"
                    defaultValue=""
                  >
                    <option value="" disabled>Select...</option>
                    {q.options?.map((opt, i) => (
                      <option key={`${q.questionId}-dropdown-${i}`} value={opt.optionText}>
                        {opt.optionText || 'Option'}
                      </option>
                    ))}
                  </select>
                );
              case 'textbox':
                return (
                  <input
                    type="text"
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                    className="w-full border p-2 rounded"
                  />
                );
              case 'datetime':
                return (
                  <input
                    type="datetime-local"
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                    className="border p-2 rounded"
                  />
                );
              case 'file':
                return (
                  <input
                    type="file"
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.files?.[0])}
                    className="border p-2 rounded"
                  />
                );
              case 'rating':
                return (
                  <input
                    type="range"
                    min="1"
                    max="5"
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                  />
                );
              case 'nps':
                return (
                  <div className="flex gap-2">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <label key={`${q.questionId}-nps-${i}`}>
                        <input
                          type="radio"
                          name={q.questionId}
                          value={i}
                          onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                        />{' '}
                        {i}
                      </label>
                    ))}
                  </div>
                );
              default:
                return (
                  <p className="text-sm text-gray-500 italic">
                    Unsupported or missing question type.
                  </p>
                );
            }
          })()}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Survey
      </button>
    </div>
  );
};

export default TakeSurvey;
