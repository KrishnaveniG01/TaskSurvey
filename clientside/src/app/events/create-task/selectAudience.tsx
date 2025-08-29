'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';

import { RootState } from '../slices/store';
import { setAssignedEmployees } from '../slices/taskSlice';

// --- 1. Update the Props Interface ---
interface Props {
  onBack: () => void;
  onNext: () => void;
  setStep: (step: number) => void;
  onSaveAndExit: () => void;
  
}

interface Employee {
  id: string;
  username: string;
}

// --- 2. Destructure the New Props ---
const SelectAudienceStep: React.FC<Props> = ({ 
  onBack, 
  onNext, 
  setStep, 
  onSaveAndExit,
  
}) => {
  const dispatch = useDispatch();

  const storedAssignees = useSelector((state: RootState) => state.task.assignedTo);
  const token = useSelector((state: RootState) => state.auth.token);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Employee[]>(
    storedAssignees.map(a => ({ id: a.userId, username: a.userName || '' }))
  );
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('http://localhost:5000/auth/employees', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const cleanedData = response.data.map((emp: any) => ({
          id: emp.userId,
          username: emp.userName,
        }));
        setEmployees(cleanedData);
      } catch (err) {
        setError('Failed to fetch employees. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [token]);

  const filteredEmployees = employees.filter(employee =>
    employee.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setAllSelected(
      filteredEmployees.length > 0 &&
      filteredEmployees.every(emp => selected.some(sel => sel.id === emp.id))
    );
  }, [selected, filteredEmployees]);

  const handleToggle = (employee: Employee) => {
    setSelected(prev =>
      prev.some(sel => sel.id === employee.id)
        ? prev.filter(sel => sel.id !== employee.id)
        : [...prev, employee]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filteredEmployees.map(e => e.id));
      setSelected(prev => prev.filter(p => !filteredIds.has(p.id)));
    } else {
      const newSelection = [...selected];
      const selectedIds = new Set(selected.map(s => s.id));
      filteredEmployees.forEach(emp => {
        if (!selectedIds.has(emp.id)) {
          newSelection.push(emp);
        }
      });
      setSelected(newSelection);
    }
  };

  const handleClearSelection = () => {
    setSelected([]);
  };

  const handleContinue = () => {
    if (selected.length === 0) {
        toast.warn('Please select at least one employee to continue.');
        return;
    }
    const payload = selected.map(s => ({ userId: s.id, userName: s.username }));
    dispatch(setAssignedEmployees(payload));
    onNext();
  };

  const selectedCount = selected.length;
  const totalCount = employees.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Select Audience</h2>
        <div className="text-sm text-gray-600">{selectedCount} of {totalCount} employees selected</div>
      </div>

      <input
        type="text"
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      />

      <div className="flex justify-between items-center mb-2">
        <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline">{allSelected ? 'Unselect All Shown' : 'Select All Shown'}</button>
        <button onClick={handleClearSelection} className="text-sm text-red-600 hover:underline">Clear Selection</button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto border p-4 rounded-md bg-white shadow-inner">
        {loading && <p>Loading employees...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && filteredEmployees.length === 0 && <p className="text-gray-500">No employees found.</p>}
        {!loading && !error && filteredEmployees.map((employee) => (
          <label key={employee.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.some(sel => sel.id === employee.id)}
              onChange={() => handleToggle(employee)}
              className="w-4 h-4 accent-indigo-600"
            />
            {employee.username}
          </label>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8 gap-4">
        {/* --- 3. Apply the Props to the Button --- */}
        <button 
          onClick={onSaveAndExit} 
          
          className="px-6 py-3 rounded-lg font-medium border border-gray-500 text-gray-700 bg-white transition hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          Save & Exit
        </button>
        <button 
          onClick={handleContinue} 
          disabled={selectedCount === 0} 
          className={`px-8 py-3 rounded-lg font-medium shadow-md transition ${selectedCount === 0 ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        > 
          Next ({selectedCount})
        </button>
      </div>
      
    </div>
  );
};

export default SelectAudienceStep;
