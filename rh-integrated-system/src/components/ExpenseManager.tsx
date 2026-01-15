'use client';

import React, { useState, useEffect } from 'react';
import { database, ref, push, onValue, remove } from '@/lib/firebase';
import { Expense } from '@/types';

interface ExpenseManagerProps {
  onExpensesChange: (expenses: Expense[]) => void;
}

export default function ExpenseManager({ onExpensesChange }: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseType, setExpenseType] = useState<'operational' | 'purchases'>('operational');

  useEffect(() => {
    const expensesRef = ref(database, 'expenses');
    
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expensesList: Expense[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setExpenses(expensesList);
        onExpensesChange(expensesList);
      }
    });

    return () => unsubscribe();
  }, [onExpensesChange]);

  const addExpense = () => {
    if (!expenseName.trim() || !expenseCost || parseFloat(expenseCost) <= 0) {
      alert('يرجى إدخال اسم مسار الإنفاق وتكلفة صحيحة.');
      return;
    }

    const date = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    const expenseData = {
      name: expenseName.trim(),
      cost: parseFloat(expenseCost),
      expenseType,
      date
    };

    push(ref(database, 'expenses'), expenseData)
      .then(() => {
        setExpenseName('');
        setExpenseCost('');
        setExpenseType('operational');
      })
      .catch((error) => {
        console.error('Error adding expense:', error);
        alert('حدث خطأ أثناء إضافة مسار الإنفاق.');
      });
  };

  const deleteExpense = (expenseId: string) => {
    remove(ref(database, `expenses/${expenseId}`))
      .catch((error) => {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف مسار الإنفاق.');
      });
  };

  const getExpensesByType = (type: 'operational' | 'purchases') => {
    return expenses.filter(expense => expense.expenseType === type);
  };

  const getTotalByType = (type: 'operational' | 'purchases') => {
    return expenses
      .filter(expense => expense.expenseType === type)
      .reduce((sum, expense) => sum + expense.cost, 0);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 text-right">إدارة النفقات</h2>
        <button
          onClick={addExpense}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          إضافة
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="مسار الإنفاق"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
          className="md:col-span-2 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="number"
          placeholder="التكلفة ($)"
          value={expenseCost}
          onChange={(e) => setExpenseCost(e.target.value)}
          className="md:col-span-1 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Radio Buttons Bar */}
      <div className="bg-gray-900 rounded-lg p-3 mb-6">
        <div className="flex items-center justify-end space-x-8 space-x-reverse">
          <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
            <input
              type="radio"
              value="operational"
              checked={expenseType === 'operational'}
              onChange={(e) => setExpenseType(e.target.value as 'operational')}
              className="ml-2"
            />
            <span className="text-xs ml-2">مصارف تشغيلية</span>
          </label>
          <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
            <input
              type="radio"
              value="purchases"
              checked={expenseType === 'purchases'}
              onChange={(e) => setExpenseType(e.target.value as 'purchases')}
              className="ml-2"
            />
            <span className="text-xs ml-2">مشتريات</span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {(['operational', 'purchases'] as const).map((type) => (
          <div key={type} className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-right text-gray-100">
              {type === 'operational' ? 'المصارف التشغيلية' : 'المشتريات'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right pb-2 text-gray-300 w-[60%]">مسار الإنفاق</th>
                    <th className="text-right pb-2 text-gray-300 w-[15%]">التاريخ</th>
                    <th className="text-right pb-2 text-gray-300 w-[20%]">التكلفة</th>
                    <th className="text-right pb-2 text-gray-300 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {getExpensesByType(type).map((expense) => (
                    <tr key={expense.id} className="border-b">
                      <td className="py-2 text-gray-200">{expense.name}</td>
                      <td className="py-2 text-gray-200">{expense.date}</td>
                      <td className="py-2 text-gray-200">${expense.cost.toFixed(2)}</td>
                      <td className="py-2">
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right font-semibold mt-3 text-gray-100">
              {type === 'operational' ? 'إجمالي المصارف التشغيلية' : 'إجمالي المشتريات'}: ${getTotalByType(type).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
