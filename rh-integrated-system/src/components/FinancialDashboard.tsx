'use client';

import React from 'react';
import { FinancialSummary } from '@/types';

interface FinancialDashboardProps {
  summary: FinancialSummary;
}

export default function FinancialDashboard({ summary }: FinancialDashboardProps) {
  const {
    totalIncome,
    totalExpenses,
    netProfit,
    marketingShare,
    mainOfficeShare,
    clearanceResult,
    totalSaudi,
    totalMah,
    totalEgypt,
    totalOperational,
    totalPurchases,
    totalFinancing,
    totalSalesProfit
  } = summary;

  const handleTransfer = () => {
    if (clearanceResult > 0) {
      alert(`تم تحويل مبلغ $${clearanceResult.toFixed(2)} إلى المكتب الرئيسي.`);
    } else if (clearanceResult < 0) {
      alert(`يجب على المكتب الرئيسي تحويل مبلغ $${Math.abs(clearanceResult).toFixed(2)} إلى مكتب التسويق.`);
    } else {
      alert('لا يوجد مبالغ للتحويل.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg shadow-lg p-6 mb-8">
      <div className="text-center mb-6">
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">تفاصيل الدخل</h3>
          <div className="space-y-2 text-right text-gray-300">
            <p>مشاريع مصر: <span className="text-white font-semibold">${totalEgypt.toFixed(2)}</span></p>
            <p>مشاريع المملكة: <span className="text-white font-semibold">${totalSaudi.toFixed(2)}</span></p>
            <p>مشاريع MAH/MOH: <span className="text-white font-semibold">${totalMah.toFixed(2)}</span></p>
            <p className="border-t border-gray-600 pt-2 font-semibold text-blue-400">نصيب مكتب التسويق: ${marketingShare.toFixed(2)}</p>
            <p className="font-semibold text-purple-400">نصيب المكتب الرئيسي: ${mainOfficeShare.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-6 inline-block border border-gray-600">
          <h3 className="text-xl font-semibold mb-3 text-gray-200">نتيجة المقاصة</h3>
          <div className={`text-2xl font-bold mb-4 ${clearanceResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${clearanceResult.toFixed(2)}
          </div>
          <button
            onClick={handleTransfer}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors border border-gray-500"
          >
            التحويل الآن
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar for Financial Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 py-2 px-4 shadow-lg z-50 border-t border-gray-700">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-2 text-center border border-gray-600">
              <h3 className="text-xs font-semibold mb-1 text-gray-200">إجمالي الدخل</h3>
              <div className="text-lg font-bold text-green-400">${totalIncome.toFixed(2)}</div>
            </div>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-2 text-center border border-gray-600">
              <h3 className="text-xs font-semibold mb-1 text-gray-200">إجمالي التمويل</h3>
              <div className="text-lg font-bold text-green-400">${totalFinancing.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
