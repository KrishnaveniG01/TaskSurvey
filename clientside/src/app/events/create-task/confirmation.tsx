'use client';

import React from 'react';
import { Task } from '../slices/taskSlice';
import { Upload, FileText } from 'lucide-react';

interface ReviewTaskDetailsProps {
  formData: Partial<Task>;
  files: File[];
  goToStep: (step: number) => void;
  handleSubmit: () => void;
  onBack: () => void;
  onSaveAndExit: () => void;
}

const ReviewTaskDetails: React.FC<ReviewTaskDetailsProps> = ({ 
  formData, 
  files, 
  goToStep, 
  handleSubmit, 
  onBack, 
  onSaveAndExit,
}) => {
  const assignedEmployees = formData.assignedTo || [];

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Confirm</h2>

      {/* Task Information Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">Task Information</h3>
          <button type="button" onClick={() => goToStep(1)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
        </div>
        <table className="min-w-full text-left text-sm text-gray-700">
          <tbody>
            <tr className="border-b"><td className="py-3 px-4 font-semibold w-1/3">Task Title:</td><td className="py-3 px-4">{formData.taskTitle || 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Description:</td><td className="py-3 px-4">{formData.taskDescription || 'No description'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Task Reviewer:</td><td className="py-3 px-4">{formData.taskReviewer || 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Start Date & Time:</td><td className="py-3 px-4">{formData.startDate ? new Date(`${formData.startDate}T${formData.startTime || '00:00'}`).toLocaleString() : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Due On Date & Time:</td><td className="py-3 px-4">{formData.endDate ? new Date(`${formData.endDate}T${formData.endTime || '23:59'}`).toLocaleString() : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Mandatory:</td><td className="py-3 px-4">{formData.isMandatory ? 'Yes' : 'No'}</td></tr>
            <tr className="border-b"><td className="py-3 px-4 font-semibold">Proof Required:</td><td className="py-3 px-4">{formData.isRequiresProof ? 'Yes' : 'No'}</td></tr>
            <tr><td className="py-3 px-4 font-semibold">Important:</td><td className="py-3 px-4">{formData.isImportant ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Attached Documents Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-700">Attached Documents</h3>
            <button type="button" onClick={() => goToStep(1)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
        </div>
        {files.length === 0 && (!formData.additionalDocuments || formData.additionalDocuments.length === 0) && <p className="text-gray-500">No documents attached.</p>}
        <ul className="space-y-2">
            {formData.additionalDocuments?.map((doc, index) => (
                <li key={`existing-${index}`} className="flex items-center gap-2 text-gray-600"><FileText size={16} />{doc.fileName} (existing)</li>
            ))}
            {files.map((file, index) => (
                <li key={`new-${index}`} className="flex items-center gap-2 text-gray-600"><Upload size={16} />{file.name} (new)</li>
            ))}
        </ul>
      </div>

      {/* Assigned To Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">Assigned To ({assignedEmployees.length})</h3>
          <button type="button" onClick={() => goToStep(2)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
        </div>
        {assignedEmployees.length > 0 ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-gray-700 max-h-40 overflow-y-auto">
            {assignedEmployees.map((employee, index) => (
              <li key={index} className="bg-white p-2 text-sm rounded-md shadow-sm border">{employee.userName || employee.userId}</li>
            ))}
          </ul>
        ) : <p className="text-gray-500">No employees selected.</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button 
          type="button" 
          onClick={onBack} 
          className="bg-gray-200 px-6 py-2 rounded-md hover:bg-gray-300 transition font-semibold"
        >
          Back
        </button>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={onSaveAndExit} 
            className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 transition font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save & Exit
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewTaskDetails;
