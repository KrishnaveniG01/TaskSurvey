import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../slices/store';
import { addQuestion, setQuestions } from '../slices/questionSlice';
import { handleSaveAndExit } from '@/app/utils/survey.utils';// ✅ Import utility
// ✅ Import router
import {toast} from 'react-toastify'
import { useRouter } from 'next/navigation';

interface Option {
  optionText: string;
}

interface Question {
  questionText: string;
  answerType: string;
  options?: Option[];
  required?: boolean;
}

const answerTypes = [
  'Radio Button',
  'Drop Down',
  'Check Box',
  'Text Box',
  'Rating Scale',
  'Date & Time',
  'File Upload',
  'Net Promoter Score',
];

interface SurveyQuestionStepProps {
  onBack: () => void;
  onNext: () => void;
  setStep:(step:number)=>void;
}

const SurveyQuestionStep: React.FC<SurveyQuestionStepProps> = ({ onBack, onNext ,setStep}) => {
  const dispatch = useDispatch();
  const router = useRouter(); // ✅
  const token=useSelector((state:RootState)=>state.auth.token);
  const setupData = useSelector((state: RootState) => state.survey);
  const audience = useSelector((state: RootState) => state.audience.audience);
  const questions = useSelector((state: RootState) => state.question.questions);

  React.useEffect(() => {
    if (questions.length === 0) {
      dispatch(
        addQuestion({
          questionText: '',
          answerType: '',
          options: [{ optionText: '' }],
          required: false,
        })
      );
    }
  }, [dispatch, questions.length]);

  const updateQuestionField = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    const question = { ...updatedQuestions[index] };
    if (field === 'options') {
      question.options = value;
    } else {
      (question as any)[field] = value;
    }
    updatedQuestions[index] = question;
    dispatch(setQuestions(updatedQuestions));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updatedQuestions = questions.map((q, index) => {
      if (index !== qIndex) return q;
      const updatedOptions = q.options?.map((opt, i) =>
        i === optIndex ? { ...opt, optionText: value } : opt
      );
      return { ...q, options: updatedOptions };
    });
    dispatch(setQuestions(updatedQuestions));
  };

  const addOption = (index: number) => {
    const updatedQuestions = [...questions];
    const q = { ...updatedQuestions[index] };
    const newOptions = q.options ? [...q.options, { optionText: '' }] : [{ optionText: '' }];
    updatedQuestions[index] = { ...q, options: newOptions };
    dispatch(setQuestions(updatedQuestions));
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updatedQuestions = [...questions];
    const q = { ...updatedQuestions[qIndex] };
    if (q.options && q.options.length > 1) {
      const newOptions = q.options.filter((_, idx) => idx !== optIndex);
      updatedQuestions[qIndex] = { ...q, options: newOptions };
      dispatch(setQuestions(updatedQuestions));
    }
  };

  const handleAddQuestion = () => {
    dispatch(
      addQuestion({
        questionText: '',
        answerType: '',
        options: [{ optionText: '' }],
        required: false,
      })
    );
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length === 1) return;
    const updatedQuestions = questions.filter((_, idx) => idx !== index);
    dispatch(setQuestions(updatedQuestions));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    dispatch(setQuestions(updated));
  };

  const moveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    dispatch(setQuestions(updated));
  };

  const validateQuestion = (q: Question) => {
    if (!q.questionText.trim() || !q.answerType) return false;
    if (['Radio Button', 'Drop Down', 'Check Box'].includes(q.answerType)) {
      return q.options?.every(opt => opt.optionText.trim()) ?? false;
    }
    return true;
  };

  const allValid = questions.length > 0 && questions.every(validateQuestion);

  // ✅ Save & Exit Handler
  const handleSaveExitClick = async () => {
    if (!token) {
    toast.error('You are not authenticated!');
    return;
  }
    console.log('token passesd:',token)
    await handleSaveAndExit(
      {
        ...setupData,
        audience,
        questions,
        
      },
      token,
      router.push,
      dispatch,
      ()=>setStep(1)
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-8">
      <h2 className="text-2xl font-semibold mb-4">Create Questions</h2>
      {questions.map((q, idx) => (
        <div key={idx} className="border p-6 bg-gray-50 rounded-lg space-y-4 relative">
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className="text-gray-500 hover:text-blue-600 disabled:opacity-40"
              title="Move up"
            >↑</button>
            <button
              type="button"
              onClick={() => moveDown(idx)}
              disabled={idx === questions.length - 1}
              className="text-gray-500 hover:text-blue-600 disabled:opacity-40"
              title="Move down"
            >↓</button>
            <button
              type="button"
              onClick={() => handleDeleteQuestion(idx)}
              disabled={questions.length === 1}
              className="text-red-500 hover:text-red-700 font-bold disabled:opacity-40"
              title="Delete question"
            >✕</button>
          </div>
          <div>
            <label className="block">Question</label>
            <input
              type="text"
              value={q.questionText}
              placeholder='enter question text'
              onChange={e => updateQuestionField(idx, 'questionText', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Answer Type</label>
            <select
              value={q.answerType}
              onChange={e => updateQuestionField(idx, 'answerType', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select type</option>
              {answerTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {['Radio Button', 'Drop Down', 'Check Box'].includes(q.answerType) && (
            <div>
              <label className="block mb-2">Options</label>
              {q.options?.map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={opt.optionText}
                    placeholder='enter option text'
                    onChange={e => updateOption(idx, optIdx, e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx, optIdx)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addOption(idx)}
                className="text-blue-600 text-sm"
              >
                + Add Option
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={q.required || false}
              onChange={e => updateQuestionField(idx, 'required', e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <label className="text-sm text-gray-700">Mandatory question</label>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddQuestion}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Question
      </button>
      <div className="flex justify-between mt-6">
        <button onClick={handleSaveExitClick} className="border px-4 py-2 rounded">
          Save & Exit
        </button>
        <div className="flex gap-2">
          <button onClick={onBack} className="border px-4 py-2 rounded">
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!allValid}
            className={`px-4 py-2 rounded text-white ${allValid ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyQuestionStep;
