'use client';

import React, { useEffect, useState, useCallback, DragEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTaskData, updateTaskField, type StoredTaskDocument } from '../slices/taskSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import { RootState } from '../slices/store';
import { Task } from '../slices/taskSlice';

// --- Interfaces ---
interface TaskFormData {
  taskTitle: string;
  taskDescription: string;
  taskReviewer: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isRequiresProof: boolean;
  isImportant: boolean;
  isMandatory: boolean;
}

interface FormErrors {
  taskTitle?: string;
  taskDescription?: string;
  taskReviewer?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

// --- 1. Update the Props Interface ---
interface TaskSetupStepProps {
  handleNext: () => void;
  setStep: (step: number) => void;
  draftId?: string;
  onFilesChange: (files: File[]) => void;
  initialFiles: File[];
  onSaveAndExit: () => void;

}

interface Manager {
  userId: string;
  userName: string;
  email: string;
}

// --- 2. Destructure the New Props ---
const TaskSetupStep: React.FC<TaskSetupStepProps> = ({ 
  handleNext, 
  setStep, 
  draftId, 
  onFilesChange, 
  initialFiles, 
  onSaveAndExit,
 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const dispatch = useDispatch();
  const formDataFromRedux = useSelector((state: RootState) => state.task);
  const token = useSelector((state: RootState) => state.auth.token);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [formState, setFormState] = useState<TaskFormData>({
    taskTitle: '',
    taskDescription: '',
    taskReviewer: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isRequiresProof: false,
    isImportant: false,
    isMandatory: false,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);

  useEffect(() => {
    onFilesChange(selectedFiles);
  }, [selectedFiles, onFilesChange]);

  useEffect(() => {
    if (formDataFromRedux.currentTask?.taskId || formDataFromRedux.taskTitle) {
      setFormState({
        taskTitle: formDataFromRedux.taskTitle || '',
        taskDescription: formDataFromRedux.taskDescription || '',
        taskReviewer: formDataFromRedux.taskReviewer || '',
        startDate: formDataFromRedux.startDate || '',
        startTime: formDataFromRedux.startTime || '',
        endDate: formDataFromRedux.endDate || '',
        endTime: formDataFromRedux.endTime || '',
        isRequiresProof: formDataFromRedux.isRequiresProof ?? false,
        isImportant: formDataFromRedux.isImportant ?? false,
        isMandatory: formDataFromRedux.isMandatory ?? false,
      });
    }
  }, [formDataFromRedux]);

  useEffect(() => {
    const fetchManagers = async () => {
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/auth/managers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setManagers(res.data);
        }
      } catch (err) {
        console.error('Error fetching managers:', err);
        toast.error('Failed to fetch managers.');
      }
    };
    fetchManagers();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' && e.target instanceof HTMLInputElement ? e.target.checked : value;
    setFormState(prevState => ({ ...prevState, [name]: fieldValue }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formState.taskTitle.trim()) newErrors.taskTitle = 'Task name is mandatory';
    if (!formState.startDate.trim()) newErrors.startDate = 'Start Date is required';
    if (!formState.startTime.trim()) newErrors.startTime = 'Start Time is required';
    if (!formState.endDate.trim()) newErrors.endDate = 'Due On Date is required';
    if (!formState.endTime.trim()) newErrors.endTime = 'Due On Time is required';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    toast.info(`${newFiles.length} file(s) are ready for upload.`);
  }, []);

  const removeNewFile = useCallback((indexToRemove: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  const removeExistingDocument = useCallback((indexToRemove: number) => {
    dispatch(updateTaskField({
      field: 'additionalDocuments',
      value: (formDataFromRedux.additionalDocuments || []).filter((_, index) => index !== indexToRemove)
    }));
  }, [dispatch, formDataFromRedux.additionalDocuments]);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const transformFormStateToTaskPayload = (): Partial<Task> => ({
    taskTitle: formState.taskTitle,
    taskDescription: formState.taskDescription || null,
    taskReviewer: formState.taskReviewer || null,
    startDate: formState.startDate,
    startTime: formState.startTime,
    endDate: formState.endDate,
    endTime: formState.endTime,
    isRequiresProof: formState.isRequiresProof,
    isImportant: formState.isImportant,
    isMandatory: formState.isMandatory,
  });

  const handleGoToNextStep = () => {
    if (!validateForm()) {
      toast.error('Please correct the form errors.');
      return;
    }
    dispatch(setTaskData(transformFormStateToTaskPayload()));
    handleNext();
  };

  const handleSaveAndExitClick = () => {
    dispatch(setTaskData(transformFormStateToTaskPayload()));
    onSaveAndExit();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg">
        {/* ... form content remains the same ... */}
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Task Setup</h2>
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-semibold text-gray-800 mb-2">Task Title</label>
            <input
              type="text"
              id="taskTitle"
              name="taskTitle"
              value={formState.taskTitle}
              onChange={handleInputChange}
              placeholder="Enter Task Name"
              className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition ${formErrors.taskTitle ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
            />
            {formErrors.taskTitle && <p className="text-red-600 text-sm mt-1">{formErrors.taskTitle}</p>}
          </div>
          <div>
            <label htmlFor="taskReviewer" className="block text-sm font-semibold text-gray-800 mb-2">Task Reviewer (Optional)</label>
            <select
              id="taskReviewer"
              name="taskReviewer"
              value={formState.taskReviewer}
              onChange={handleInputChange}
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-indigo-500"
            >
              <option value="">Select a reviewer</option>
              {managers.map((manager) => (
                <option key={manager.userId} value={manager.userId}>{manager.userName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="taskDescription" className="block text-sm font-semibold text-gray-800 mb-2">Description (Optional)</label>
          <textarea
            id="taskDescription"
            name="taskDescription"
            value={formState.taskDescription}
            onChange={handleInputChange}
            placeholder="Enter Task Description or Guidelines"
            className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition border-gray-300 focus:ring-indigo-500 min-h-[80px]"
          />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-800 mb-2">Start Date</label>
            <input type="date" id="startDate" name="startDate" min={today} value={formState.startDate} onChange={handleInputChange} className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition ${formErrors.startDate ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
            {formErrors.startDate && <p className="text-red-600 text-sm mt-1">{formErrors.startDate}</p>}
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-semibold text-gray-800 mb-2">Start Time</label>
            <input type="time" id="startTime" name="startTime" value={formState.startTime} onChange={handleInputChange} className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition ${formErrors.startTime ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
            {formErrors.startTime && <p className="text-red-600 text-sm mt-1">{formErrors.startTime}</p>}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-800 mb-2">Due On Date</label>
            <input type="date" id="endDate" name="endDate" min={formState.startDate || today} value={formState.endDate} onChange={handleInputChange} className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition ${formErrors.endDate ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
            {formErrors.endDate && <p className="text-red-600 text-sm mt-1">{formErrors.endDate}</p>}
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-semibold text-gray-800 mb-2">Due On Time</label>
            <input type="time" id="endTime" name="endTime" value={formState.endTime} onChange={handleInputChange} className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 transition ${formErrors.endTime ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500'}`} />
            {formErrors.endTime && <p className="text-red-600 text-sm mt-1">{formErrors.endTime}</p>}
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-3"><input type="checkbox" id="isMandatory" name="isMandatory" checked={formState.isMandatory} onChange={handleInputChange} className="h-5 w-5 mt-1 accent-indigo-600" /><div><label htmlFor="isMandatory" className="font-semibold text-gray-800">Mark task as mandatory</label><p className="text-gray-500 text-sm">Mandatory tasks may prevent employees from navigating the app until completed.</p></div></div>
          <div className="flex items-start gap-3"><input type="checkbox" id="isRequiresProof" name="isRequiresProof" checked={formState.isRequiresProof} onChange={handleInputChange} className="h-5 w-5 mt-1 accent-indigo-600" /><div><label htmlFor="isRequiresProof" className="font-semibold text-gray-800">Mandate proof of completion</label><p className="text-gray-500 text-sm">Assignees will be required to upload proof before marking the task as complete.</p></div></div>
          <div className="flex items-start gap-3"><input type="checkbox" id="isImportant" name="isImportant" checked={formState.isImportant} onChange={handleInputChange} className="h-5 w-5 mt-1 accent-indigo-600" /><div><label htmlFor="isImportant" className="font-semibold text-gray-800">Mark task as important</label><p className="text-gray-500 text-sm">This task will be highlighted and prioritized on the assignee's dashboard.</p></div></div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Task Documents (Optional)</label>
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop files here, or click to select</p>
            <input type="file" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="fileUpload" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif" />
            <label htmlFor="fileUpload" className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm cursor-pointer hover:bg-blue-600 transition-colors inline-block">Select Files</label>
          </div>

          {formDataFromRedux.additionalDocuments.length > 0 && (
            <div className="mt-4 space-y-2"><h4 className="font-semibold text-gray-600">Existing Documents:</h4>{formDataFromRedux.additionalDocuments.map((doc: StoredTaskDocument, index: number) => (<div key={doc.attachmentId || index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md"><p className="text-sm font-medium text-gray-800">{doc.fileName}</p><button onClick={() => removeExistingDocument(index)} className="text-red-500 hover:text-red-700 p-1 rounded"><X className="w-4 h-4" /></button></div>))}</div>
          )}

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2"><h4 className="font-semibold text-gray-600">New Files to Upload:</h4>{selectedFiles.map((file, index) => (<div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md"><p className="text-sm font-medium text-gray-800">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p><button onClick={() => removeNewFile(index)} className="text-red-500 hover:text-red-700 p-1 rounded"><X className="w-4 h-4" /></button></div>))}</div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          {/* --- 3. Apply the Props to the Button --- */}
          <button 
            type="button" 
            onClick={handleSaveAndExitClick} 
          
            className="bg-gray-300 px-6 py-2 rounded-md hover:bg-gray-400 transition font-semibold disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Save & Exit
          </button>
          <button 
            type="button" 
            onClick={handleGoToNextStep} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition font-semibold"
          > 
            Next 
          </button>
        </div>
       
    </div>
  );
};

export default TaskSetupStep;
