'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaChartBar, FaClipboardList } from 'react-icons/fa'; // Add more icons if needed

interface ProcessItem {
  processId: number;
  processName: string;
}

const processIcons: { [key: string]:any } = {
  Survey: <FaChartBar className="text-blue-500 text-3xl" />,
  Polls: <FaClipboardList className="text-blue-500 text-3xl" />,
  Tasks: <FaCheckCircle className="text-blue-500 text-3xl" />,
  Default: <FaCheckCircle className="text-blue-500 text-3xl" />,
};

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('username');
    if (userData) {
      setUsername(userData);
    }
  }, []);

  useEffect(() => {
    async function fetchProcesses() {
      try {
        const res = await fetch('http://localhost:5000/process');
        const data = await res.json();
        console.log('Fetched processes:', data);
        setProcesses(data);
      } catch (err) {
        console.error('Failed to fetch processes:', err);
      }
    }

    fetchProcesses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Good Morning, <span className="font-bold">{username}!</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {processes.map((process) => (
          <div
            key={process.processId}
            className="bg-blue-50 hover:bg-blue-100 p-6 rounded-xl shadow flex items-center space-x-4 cursor-pointer"
            onClick={() =>
              router.push(`/events?process=${process.processId}&&name=${process.processName}`)
            }
          >
            {/* Dynamic icon based on process name (optional mapping) */}
            {processIcons[process.processName] || processIcons['Default']}
            <div>
              <p className="text-xl font-medium text-blue-800">
                {process.processName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
