import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/staff';
import StaffLayout from '../../components/layout/StaffLayout';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import {
  IconBookOpen, IconExclamationTriangle, IconUsers, IconLibrary,
  IconBanknote, IconArrowUpTray, IconArrowDownTray, IconChevronRight,
} from '../../components/ui/Icons';

function StatCard({ Icon, label, value, iconBg, iconColor, valueBold = 'text-primary-900', to }) {
  const content = (
    <div className="bg-white rounded-xl border border-parchment-200 p-5 hover:shadow-md hover:border-parchment-300 transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <IconChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-400 transition-colors" />
      </div>
      <p className={`text-3xl font-bold font-serif ${valueBold}`}>{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' VNĐ';
}

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {/* Decorative rule */}
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-parchment-200 to-transparent hidden md:block" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                Icon={IconBookOpen}
                label="Đang mượn"
                value={data?.dangMuon}
                iconBg="bg-primary-50"
                iconColor="text-primary-600"
                to="/staff/loans"
              />
              <StatCard
                Icon={IconExclamationTriangle}
                label="Quá hạn"
                value={data?.quaHan}
                iconBg={data?.quaHan > 0 ? 'bg-red-50' : 'bg-gray-50'}
                iconColor={data?.quaHan > 0 ? 'text-red-500' : 'text-gray-400'}
                valueBold={data?.quaHan > 0 ? 'text-red-600' : 'text-primary-900'}
                to="/staff/loans?trangThai=qua_han"
              />
              <StatCard
                Icon={IconUsers}
                label="Bạn đọc HĐ"
                value={data?.banDocHoatDong}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                to="/staff/members"
              />
              <StatCard
                Icon={IconLibrary}
                label="Tài liệu HĐ"
                value={data?.taiLieuHoatDong}
                iconBg="bg-gold-200/60"
                iconColor="text-gold-600"
                to="/staff/documents"
              />
            </div>

            {/* Công nợ banner */}
            {data?.tongCongNo > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <IconBanknote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Tổng công nợ chưa thu</p>
                    <p className="text-xl font-bold font-serif text-amber-800 mt-0.5">{formatVND(data.tongCongNo)}</p>
                  </div>
                </div>
                <Link
                  to="/staff/fines"
                  className="btn-primary bg-amber-600 hover:bg-amber-700 text-sm shrink-0"
                >
                  Xem phiếu phạt
                </Link>
              </div>
            )}

            {/* Quick actions */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Thao tác nhanh</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/staff/checkout"
                  className="group bg-primary-900 hover:bg-primary-800 text-white rounded-xl p-5 flex items-center gap-4 transition-all border border-primary-800 hover:border-primary-700"
                >
                  <div className="w-14 h-14 bg-white/5 group-hover:bg-gold-500/15 rounded-xl flex items-center justify-center transition-colors shrink-0">
                    <IconArrowUpTray className="w-7 h-7 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg font-serif">Cho mượn sách</p>
                    <p className="text-white/40 text-sm mt-0.5">Quét mã thẻ + mã bản sao</p>
                  </div>
                  <IconChevronRight className="ml-auto w-5 h-5 text-white/20 group-hover:text-gold-400 transition-colors shrink-0" />
                </Link>

                <Link
                  to="/staff/return"
                  className="group bg-white hover:bg-parchment-50 text-primary-900 rounded-xl p-5 flex items-center gap-4 transition-all border border-parchment-200 hover:border-primary-300 hover:shadow-md"
                >
                  <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors shrink-0">
                    <IconArrowDownTray className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg font-serif">Nhận trả sách</p>
                    <p className="text-gray-400 text-sm mt-0.5">Quét mã bản sao</p>
                  </div>
                  <IconChevronRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
