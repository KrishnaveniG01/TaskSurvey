'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation'; // ✅ Next.js App Router
import { toast } from 'react-toastify';
import axios from 'axios';

import { RootState } from '../slices/store';
import { setAudience } from '../slices/audienceSlice';
import { handleSaveAndExit } from '@/app/utils/survey.utils';

interface Props {
  onBack: () => void;
  onNext: () => void;
  setStep: (step: number) => void;
}

interface Employee {
  id: string;
  username: string;
}

const SelectAudienceStep: React.FC<Props> = ({ onBack, onNext, setStep }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const storedAudience = useSelector((state: RootState) => state.audience.audience);
  const setupData = useSelector((state: RootState) => state.survey);
  const token = useSelector((state: RootState) => state.auth.token);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Employee[]>(storedAudience);
  const [allSelected, setAllSelected] = useState(false);

  const filteredEmployees = employees.filter(employee =>
    (employee.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/auth/employees');
      console.log('📦 Raw employee response:', response.data);

      // ✅ Flatten nested array structure
      const flattened = response.data;

      // ✅ Map to expected structure
      const cleaned = flattened.map((emp: any) => ({
        id: emp.userId,
        username: emp.userName,
      }));

      setEmployees(cleaned);
    } catch (error) {
      setError('Failed to fetch employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  fetchEmployees();
}, []);

  useEffect(() => {
    setAllSelected(
      filteredEmployees.length > 0 &&
      filteredEmployees.every(emp => selected.find(sel => sel.id === emp.id))
    );
  }, [selected, filteredEmployees]);

  const handleToggle = (employee: Employee) => {
    setSelected(prev =>
      prev.find(sel => sel.id === employee.id)
        ? prev.filter(sel => sel.id !== employee.id)
        : [...prev, employee]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredEmployees.map(emp => emp.id);
    if (allSelected) {
      setSelected(prev => prev.filter(emp => !filteredIds.includes(emp.id)));
    } else {
      const merged = [...selected, ...filteredEmployees];
      const deduped = merged.filter(
        (emp, index, self) => index === self.findIndex(e => e.id === emp.id)
      );
      setSelected(deduped);
    }
  };

  const handleClearSelection = () => {
    setSelected([]);
    setAllSelected(false);
  };

  const handleContinue = () => {
    dispatch(setAudience(selected));
    onNext();
  };

  const handleSaveExitClick = async () => {
    if (!token) {
      toast.error('You are not authenticated!');
      return;
    }
    dispatch(setAudience(selected));
    await handleSaveAndExit(
      {
        ...setupData,
        audience: selected,
      },
      token,
      (path: string) => router.push(path),
      dispatch,
      () => setStep(1)
    );
  };

  const selectedCount = selected.length;
  const totalCount = employees.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Select Audience</h2>
        <div className="text-sm text-gray-600">
          {selectedCount} of {totalCount} employees selected
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-md mb-4"
      />

      {/* Select All / Clear */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:underline"
        >
          {allSelected ? 'Unselect All' : 'Select All'}
        </button>
        <button
          onClick={handleClearSelection}
          className="text-sm text-red-600 hover:underline"
        >
          Clear Selection
        </button>
      </div>

      {/* Employee List */}
      <div className="space-y-3 max-h-[250px] overflow-y-auto border p-4 rounded-md bg-white shadow-inner">
        {loading ? (
          <p>Loading employees...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-gray-500">No employees found.</p>
        ) : (
          filteredEmployees.map((employee) => (
            <label
              key={employee.id || employee.username}
              className="flex items-center gap-3 text-gray-800"
            >
              <input
                type="checkbox"
                checked={selected.some(sel => sel.id === employee.id)}
                onChange={() => handleToggle(employee)}
                className="w-4 h-4"
              />
              {employee.username}
            </label>
          ))
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center mt-8 gap-4">
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-medium border border-blue-600 text-blue-600 bg-white transition hover:bg-blue-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSaveExitClick}
            className="px-6 py-3 rounded-lg font-medium border border-gray-500 text-gray-700 bg-white transition hover:bg-gray-100"
          >
            Save & Exit
          </button>
        </div>
        <button
          onClick={handleContinue}
          disabled={selectedCount === 0}
          className={`px-8 py-3 rounded-lg font-medium shadow-md transition ${selectedCount === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Continue ({selectedCount})
        </button>
      </div>
    </div>
  );
};

export default SelectAudienceStep;
