'use client';

import React, { useState, useEffect } from 'react';
import { database, ref, push, onValue, remove, doc, getDoc, db } from '@/lib/firebase';
import { Project } from '@/types';

interface ProjectManagerProps {
  onProjectsChange: (projects: Project[]) => void;
}

export default function ProjectManager({ onProjectsChange }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectCost, setProjectCost] = useState('');
  const [projectType, setProjectType] = useState<'egypt' | 'saudi' | 'mah'>('egypt');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'SAR' | 'EGP'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(47.65); // Updated default rate for today

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        // Try fetching from live API first
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        if (data.rates && data.rates.EGP) {
          setExchangeRate(data.rates.EGP);
          console.log("Fetched live exchange rate:", data.rates.EGP);
          return;
        }
      } catch (error) {
        console.error("Error fetching live exchange rate, falling back to Firestore:", error);
      }

      // Fallback to Firestore if API fails
      const docRef = doc(db, "exchangeRates", "EGP");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setExchangeRate(docSnap.data().rate);
      } else {
        console.log("No such document for exchange rate in Firestore!");
      }
    };

    fetchExchangeRate();

    const projectsRef = ref(database, 'projects');
    
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectsList: Project[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setProjects(projectsList);
        onProjectsChange(projectsList);
      }
    });

    return () => unsubscribe();
  }, [onProjectsChange]);

  const convertToUSD = (amount: number, currency: 'USD' | 'SAR' | 'EGP') => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return exchangeRate > 0 ? amount / exchangeRate : amount / 50;
      case "USD": return amount;
      default: return amount;
    }
  };

  const convertToSelectedCurrency = (amount: number, targetCurrency: 'USD' | 'SAR' | 'EGP') => {
    if (!amount) return 0;
    let amountInUSD = amount;

    switch (targetCurrency) {
      case "SAR": return amountInUSD * 3.75;
      case "EGP": return amountInUSD * exchangeRate;
      case "USD": return amountInUSD;
      default: return amountInUSD;
    }
  };

  const addProject = () => {
    if (!projectName.trim() || !projectCost || parseFloat(projectCost) <= 0) {
      alert('يرجى إدخال اسم المشروع وتكلفة صحيحة.');
      return;
    }

    const costInUSD = convertToUSD(parseFloat(projectCost), selectedCurrency);
    const date = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    
    const projectData = {
      name: projectName.trim(),
      cost: costInUSD,
      projectType,
      date
    };

    push(ref(database, 'projects'), projectData)
      .then(() => {
        setProjectName('');
        setProjectCost('');
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        alert('حدث خطأ أثناء إضافة المشروع.');
      });
  };

  const deleteProject = (projectId: string) => {
    remove(ref(database, `projects/${projectId}`))
      .catch((error) => {
        console.error('Error deleting project:', error);
        alert('حدث خطأ أثناء حذف المشروع.');
      });
  };

  const getProjectsByType = (type: 'egypt' | 'saudi' | 'mah') => {
    return projects.filter(project => project.projectType === type);
  };

  const getTotalByType = (type: 'egypt' | 'saudi' | 'mah') => {
    return projects
      .filter(project => project.projectType === type)
      .reduce((sum, project) => sum + project.cost, 0);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 text-right">دخل المكتب</h2>
        <div className="text-xl text-gray-400 text-left" contentEditable={true} suppressContentEditableWarning={true}>
          لشهر {new Date().toLocaleDateString('ar-EG', { month: 'long' })} لعام {new Date().getFullYear()}
        </div>
      </div>

      {/* إجمالي دخل المكتب */}
      <div className="bg-gray-700 rounded-lg p-2 border-2 border-green-500 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center text-gray-100">إجمالي دخل المكتب</h3>
        <div className="text-2xl font-bold text-green-400 text-center mb-2">
          ${(getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')).toFixed(2)}
        </div>
        <div className="flex justify-center space-x-4 space-x-reverse text-xs text-gray-400">
          <span>{((getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')) * 3.75).toFixed(2)} ريال</span>
          <span>{((getTotalByType('egypt') + getTotalByType('saudi') + getTotalByType('mah')) * exchangeRate).toFixed(2)} جنيه</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="اسم المشروع"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="md:col-span-2 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="المبلغ"
          value={projectCost}
          onChange={(e) => setProjectCost(e.target.value)}
          className="md:col-span-1 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Currency Selection */}
      <div className="bg-gray-900 rounded-lg p-1 mb-4">
        <div className="grid grid-cols-3 gap-1">
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${selectedCurrency === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="USD"
              checked={selectedCurrency === 'USD'}
              onChange={() => setSelectedCurrency('USD')}
              className="hidden"
            />
            <span className="text-xs font-bold">دولار</span>
          </label>
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${selectedCurrency === 'SAR' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="SAR"
              checked={selectedCurrency === 'SAR'}
              onChange={() => setSelectedCurrency('SAR')}
              className="hidden"
            />
            <span className="text-xs font-bold">ريال</span>
          </label>
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${selectedCurrency === 'EGP' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="EGP"
              checked={selectedCurrency === 'EGP'}
              onChange={() => setSelectedCurrency('EGP')}
              className="hidden"
            />
            <span className="text-xs font-bold">جنيه</span>
          </label>
        </div>
      </div>

      {/* Radio Buttons Bar (Project Type) */}
      <div className="bg-gray-900 rounded-lg p-1 mb-6">
        <div className="grid grid-cols-3 gap-1">
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${projectType === 'egypt' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="egypt"
              checked={projectType === 'egypt'}
              onChange={(e) => setProjectType(e.target.value as 'egypt')}
              className="hidden"
            />
            <span className="text-xs font-bold">مصر</span>
          </label>
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${projectType === 'saudi' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="saudi"
              checked={projectType === 'saudi'}
              onChange={(e) => setProjectType(e.target.value as 'saudi')}
              className="hidden"
            />
            <span className="text-xs font-bold">المملكة</span>
          </label>
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${projectType === 'mah' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              value="mah"
              checked={projectType === 'mah'}
              onChange={(e) => setProjectType(e.target.value as 'mah')}
              className="hidden"
            />
            <span className="text-xs font-bold">MAH/MOH</span>
          </label>
        </div>
      </div>

      <button
        onClick={addProject}
        className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-6"
      >
        إضافة مشروع
      </button>

      <div className="space-y-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-right text-gray-100">سجل مشاريع الدخل</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-right pb-2 text-gray-300 w-[60%]">المشروع</th>
                  <th className="text-right pb-2 text-gray-300 w-[15%]">التاريخ</th>
                  <th className="text-right pb-2 text-gray-300 w-[20%]">التكلفة</th>
                  <th className="text-right pb-2 text-gray-300 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {projects.map((project) => (
                  <tr key={project.id} className={`${
                    project.projectType === 'egypt' ? 'bg-blue-900/10' : 
                    project.projectType === 'saudi' ? 'bg-green-900/10' : 
                    'bg-purple-900/10'
                  } transition-colors`}>
                    <td className="py-3 px-2 text-gray-100 font-medium">
                      <div className="flex items-center">
                        <span className={`w-1 h-6 ml-3 rounded-full ${
                          project.projectType === 'egypt' ? 'bg-blue-500' : 
                          project.projectType === 'saudi' ? 'bg-green-500' : 
                          'bg-purple-500'
                        }`}></span>
                        <span className="ml-2 text-lg">
                          {project.projectType === 'egypt' ? '🇪🇬' : 
                           project.projectType === 'saudi' ? '🇸🇦' : '💼'}
                        </span>
                        {project.name}
                      </div>
                    </td>
                    <td className="py-3 text-gray-300">{project.date}</td>
                    <td className="py-3 font-bold text-gray-100">
                      <div>${project.cost.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {selectedCurrency === 'SAR' ? `${(project.cost * 3.75).toFixed(2)} ريال` : 
                         selectedCurrency === 'EGP' ? `${(project.cost * exchangeRate).toFixed(2)} جنيه` : 
                         ''}
                      </div>
                    </td>
                    <td className="py-3 text-left pl-2">
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="حذف"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-600">
            <div className="text-center">
              <p className="text-sm text-blue-400 font-semibold">
                مصر 🇪🇬: ${getTotalByType('egypt').toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">
                {(getTotalByType('egypt') * exchangeRate).toFixed(2)} جنيه
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-400 font-semibold">
                المملكة 🇸🇦: ${getTotalByType('saudi').toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">
                {(getTotalByType('saudi') * 3.75).toFixed(2)} ريال
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-purple-400 font-semibold">
                MAH/MOH 💼: ${getTotalByType('mah').toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
