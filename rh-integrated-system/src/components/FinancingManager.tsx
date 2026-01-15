'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { FinancingRecord, SalesRecord } from '@/types';

// OC Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKHlDDZ4GFGI8u6oOhfOulD_XFzL3qZBQ",
  authDomain: "hadaf-pa.firebaseapp.com",
  projectId: "hadaf-pa",
  storageBucket: "hadaf-pa.appspot.com",
  messagingSenderId: "755281209375",
  appId: "1:755281209375:web:3a9040a2f0031ea2b14d2a",
  measurementId: "G-XNBQ73GMJ2"
};

const OC_APP_NAME = "oc-app";
const app = !getApps().find(a => a.name === OC_APP_NAME) 
  ? initializeApp(firebaseConfig, OC_APP_NAME) 
  : getApp(OC_APP_NAME);
const db = getFirestore(app);

interface FinancingManagerProps {
  onFinancingChange: (financing: FinancingRecord[]) => void;
}

export default function FinancingManager({ onFinancingChange }: FinancingManagerProps) {
  const [financing, setFinancing] = useState<FinancingRecord[]>([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(47.65); // Updated default rate for today
  const [financingCurrency, setFinancingCurrency] = useState<'SAR' | 'USD' | 'EGP'>('EGP');

  const [visibleTransactions, setVisibleTransactions] = useState(10);

  useEffect(() => {
    fetchExchangeRate();

    const transactionsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
      const financingList: FinancingRecord[] = querySnapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        name: docSnapshot.data().name || '',
        cost: docSnapshot.data().cost || 0,
        timestamp: docSnapshot.data().timestamp
      }));
      setFinancing(financingList);
      onFinancingChange(financingList);
      console.log(`Fetched ${financingList.length} transactions from Firestore`);
    }, (error) => {
      console.error('Error listening to transactions:', error);
    });

    return () => {
      unsubscribeTransactions();
    };
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();
      setExchangeRate(data.rates.EGP || 47.5);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }
  };

  const convertToUSD = (amount: number, currency: string) => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return exchangeRate > 0 ? amount / exchangeRate : amount / 47.5;
      default: return amount;
    }
  };

  const addFinancialTransaction = async () => {
    if (!name.trim() || !cost || parseFloat(cost) <= 0) {
      alert('يرجى إدخال اسم العملية وتكلفة صحيحة.');
      return;
    }

    try {
      const costInUSD = convertToUSD(parseFloat(cost), financingCurrency);
      const finalCost = isPositive ? costInUSD : -costInUSD;
      
      await addDoc(collection(db, "transactions"), { 
        name: name.trim(), 
        cost: finalCost, 
        timestamp: serverTimestamp() 
      });
      
      setName('');
      setCost('');
      setIsPositive(true);
    } catch (error) {
      console.error('Error adding financial transaction:', error);
      alert('حدث خطأ أثناء إضافة العملية المالية.');
    }
  };

  const deleteFinancialTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      alert('حدث خطأ أثناء حذف العملية المالية.');
    }
  };

  const getTotalFinancing = () => {
    return financing.reduce((sum, record) => sum + record.cost, 0);
  };

  const getPositiveTransactions = () => {
    return financing.filter(record => record.cost > 0);
  };

  const getNegativeTransactions = () => {
    return financing.filter(record => record.cost < 0);
  };

  const getTotalByType = (isPositiveType: boolean) => {
    return financing
      .filter(record => (record.cost > 0) === isPositiveType)
      .reduce((sum, record) => sum + Math.abs(record.cost), 0);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 text-right">التمويل والنفقات</h2>
      </div>
      
      <div className="bg-gray-700 rounded-lg p-2 border-2 border-blue-500 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center text-gray-100">صافي التمويل العام المتاح</h3>
        <div className="text-2xl font-bold text-blue-400 text-center mb-2">
          ${getTotalFinancing().toFixed(2)}
        </div>
        <div className="flex justify-center space-x-4 space-x-reverse text-xs text-gray-400">
          <span>{(getTotalFinancing() * 3.75).toFixed(2)} ريال</span>
          <span>{(getTotalFinancing() * exchangeRate).toFixed(2)} جنيه</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="اسم العملية"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="md:col-span-2 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="number"
          placeholder="المبلغ"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="md:col-span-1 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Separate Currency Bar */}
      <div className="bg-gray-900 rounded-lg p-1 mb-4">
        <div className="grid grid-cols-3 gap-1">
          {(['SAR', 'USD', 'EGP'] as const).map((curr) => (
            <label key={curr} className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${financingCurrency === curr ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
              <input
                type="radio"
                name="fin-currency"
                checked={financingCurrency === curr}
                onChange={() => setFinancingCurrency(curr)}
                className="hidden"
              />
              <span className="text-xs font-bold">{curr === 'SAR' ? 'ريال' : curr === 'USD' ? 'دولار' : 'جنيه'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transaction Type Bar */}
      <div className="bg-gray-900 rounded-lg p-1 mb-6">
        <div className="grid grid-cols-2 gap-1">
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${isPositive ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              name="fin-type"
              checked={isPositive}
              onChange={() => setIsPositive(true)}
              className="hidden"
            />
            <span className="text-xs font-bold">إيراد</span>
          </label>
          <label className={`flex items-center justify-center py-2 px-4 rounded-md cursor-pointer transition-all ${!isPositive ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <input
              type="radio"
              name="fin-type"
              checked={!isPositive}
              onChange={() => setIsPositive(false)}
              className="hidden"
            />
            <span className="text-xs font-bold">مصروف</span>
          </label>
        </div>
      </div>

      <button
        onClick={addFinancialTransaction}
        className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors mb-6"
      >
        إضافة
      </button>

      <div className="space-y-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-right text-gray-100">سجل العمليات (تمويل ومصروفات)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-right pb-2 text-gray-300 w-[60%]">العملية</th>
                  <th className="text-right pb-2 text-gray-300 w-[15%]">التاريخ</th>
                  <th className="text-right pb-2 text-gray-300 w-[20%]">المبلغ</th>
                  <th className="text-right pb-2 text-gray-300 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {financing.slice(0, visibleTransactions).map((record) => (
                  <tr key={record.id} className={`${record.cost > 0 ? 'bg-green-900/20' : 'bg-red-900/20'} transition-colors`}>
                    <td className="py-3 px-2 text-gray-100 font-medium">
                      <div className="flex items-center">
                        <span className={`w-1 h-6 ml-3 rounded-full ${record.cost > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {record.name}
                      </div>
                    </td>
                    <td className="py-3 text-gray-300">
                      {record.timestamp ? new Date(record.timestamp.seconds * 1000).toLocaleDateString("ar-EG") : '...'}
                    </td>
                    <td className={`py-3 font-bold ${record.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div>{record.cost > 0 ? '+' : '-'}${Math.abs(record.cost).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {financingCurrency === 'SAR' ? `${(Math.abs(record.cost) * 3.75).toFixed(2)} ريال` : 
                         financingCurrency === 'EGP' ? `${(Math.abs(record.cost) * exchangeRate).toFixed(2)} جنيه` : 
                         ''}
                      </div>
                    </td>
                    <td className="py-3 text-left pl-2">
                      <button
                        onClick={() => deleteFinancialTransaction(record.id)}
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
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              إجمالي العمليات: <span className="text-gray-100 font-semibold">{financing.length}</span>
            </p>
            <div className="flex flex-col items-end space-y-1">
              <div className="flex space-x-4 space-x-reverse">
                <p className="text-sm text-green-400">
                  التمويل: ${getTotalByType(true).toFixed(2)}
                </p>
                <p className="text-sm text-red-400">
                  المصروفات: ${getTotalByType(false).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-0.5 text-[10px] text-gray-500">
                 <span>{(getTotalByType(true) * 3.75).toFixed(2)} ريال / {(getTotalByType(false) * 3.75).toFixed(2)} ريال</span>
                 <span>{(getTotalByType(true) * exchangeRate).toFixed(2)} جنيه / {(getTotalByType(false) * exchangeRate).toFixed(2)} جنيه</span>
               </div>
            </div>
          </div>
        </div>

        {financing.length > visibleTransactions && (
          <button
            onClick={() => setVisibleTransactions(prev => prev + 10)}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors mb-4 border border-gray-600"
          >
            إظهار المزيد من العمليات ▼
          </button>
        )}
      </div>
    </div>
  );
}
