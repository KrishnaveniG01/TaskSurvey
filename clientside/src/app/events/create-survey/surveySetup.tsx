import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { RootState } from '../slices/store';
import { setSurveyData } from '../slices/surveySlice';
import { handleSaveAndExit } from '@/app/utils/survey.utils';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// ✅ Yup validation schema
const validationSchema = Yup.object().shape({
  surveyTitle: Yup.string().required('Survey title is mandatory'),
  surveyType: Yup.string().required('Survey Type is mandatory'),
  description: Yup.string().required('Description is mandatory'),
  startDate: Yup.string().required('Start Date is required'),
  startTime: Yup.string().required('Start Time is required'),
  endDate: Yup.string().required('End Date is required'),
  endTime: Yup.string().required('End Time is required'),
  // ✅ Optional boolean fields
  isMandatory: Yup.boolean(),
  isAnonymous: Yup.boolean(),
  publishToLibrary: Yup.boolean(),
});

const SurveySetupStep: React.FC<{ handleNext: () => void }> = ({ handleNext }) => {
  const today =new Date().toISOString().split('T')[0];
  const dispatch = useDispatch();
 const router = useRouter();
  const formData = useSelector((state: RootState) => state.survey);
  const token = useSelector((state: RootState) => state.auth.token);
  const [surveyTypes, setSurveyTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/survey/types');
        setSurveyTypes(res.data); // assuming it's a simple array
      } catch (err) {
        console.error('Error fetching survey types:', err);
      }
    };
    fetchTypes();
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: formData,
    resolver: yupResolver(validationSchema),
    mode: 'onTouched',
  });

  // ✅ Sync form with Redux when survey is reset
  useEffect(() => {
    if (
      formData.surveyTitle === '' &&
      formData.description === '' &&
      formData.startDate === ''
    ) {
      // hard reset if cleared
      reset({
        surveyTitle: '',
        surveyType: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        isMandatory: false,
        isAnonymous: false,
        publishToLibrary: false,
      });
    } else {
      // use existing redux values
      reset(formData);
    }
  }, [formData, reset]);

  // ✅ Save and go to next step
  const onSubmit = (data: any) => {
    dispatch(setSurveyData(data));
    handleNext();
  };

  // ✅ Save & Exit button logic
  const onSaveExit = async () => {
    if (!token) {
      toast.error('You are not authenticated!');
      return;
    }
    const data = getValues();
    await handleSaveAndExit(data, token, router.push, dispatch); // ✅ correct

  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">

        <div className="mb-8 grid grid-cols-2 gap-6">
          {/* Survey Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Survey Title</label>
            <input
              type="text"
              {...register('surveyTitle')}
              placeholder="Enter Survey Title"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            />
            {errors.surveyTitle && (
              <p className="text-red-600 text-sm mt-1">{errors.surveyTitle.message}</p>
            )}
          </div>

          {/* Survey Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Survey Type</label>
            <select
              {...register('surveyType')}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            >
              <option value="">Select a type</option>
              {surveyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.surveyType && (
              <p className="text-red-600 text-sm mt-1">{errors.surveyType.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
          <textarea
            {...register('description')}
            placeholder="Enter Survey Description"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition min-h-[80px]"
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Start Date & Time */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
            <input
              type="date"
              min={today}
              {...register('startDate')}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            />
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Start Time</label>
            <input
              type="time"
              {...register('startTime')}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            />
            {errors.startTime && (
              <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>
        </div>

        {/* End Date & Time */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">End Date</label>
            <input
              type="date"
              min={today||formData.startDate}
              {...register('endDate')}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            />
            {errors.endDate && (
              <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">End Time</label>
            <input
              type="time"
              {...register('endTime')}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 transition"
            />
            {errors.endTime && (
              <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="mandatory"
              checked={formData.isMandatory}
              onChange={e => dispatch(setSurveyData({ isMandatory: e.target.checked }))}
              className="h-5 w-5 mt-1 accent-blue-600 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="mandatory" className="font-semibold text-gray-800">Mandatory survey</label>
              <p className="text-gray-500 text-sm">
                Surveys marked as mandatory will mandate the participant to complete the survey when they sign-in on the due date.
                Please note that they will be unable to navigate through the app until the survey is completed.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={e => dispatch(setSurveyData({ isAnonymous: e.target.checked }))}
              className="h-5 w-5 mt-1 accent-blue-600 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="anonymous" className="font-semibold text-gray-800">Anonymous survey</label>
              <p className="text-gray-500 text-sm">
                Surveys marked as anonymous will hide the participant details when they respond to the survey.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="publish"
              checked={formData.publishToLibrary}
              onChange={e => dispatch(setSurveyData({ publishToLibrary: e.target.checked }))}
              className="h-5 w-5 mt-1 accent-blue-600 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="publish" className="font-semibold text-gray-800">Publish survey to library</label>
              <p className="text-gray-500 text-sm">
                Published surveys are accessible to all employees, allowing them to duplicate the survey for personal use.
                Surveys not published to the library will be treated as confidential.
              </p>
            </div>
          </div>
        </div>
        

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            className="bg-gray-300 px-6 py-2 rounded-md hover:bg-gray-400 transition font-semibold"
            onClick={onSaveExit}
          >
            Save & Exit
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
          >
            Next
          </button>
        </div>
      </div>
    </form>
  );
};

export default SurveySetupStep;
