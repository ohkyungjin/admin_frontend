import React, { useState } from 'react';
import { Card, Button } from 'antd';
import format from 'date-fns/format';
import { FuneralCertificateModal } from '../FuneralCertificateModal';

export const UpcomingEvents = ({ events, onEventClick, onDeleteEvent }) => {
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleOpenCertificate = (event, reservation) => {
    event.stopPropagation();
    setSelectedReservation(reservation);
    setCertificateModalVisible(true);
  };

  return (
    <>
      <Card className="!shadow-sm !rounded-2xl !border-0 sm:!rounded-xl xs:!p-3">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 sm:text-base sm:mb-4">예약현황</h2>
        
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-3">Today</h3>
          {events.length > 0 ? (
            events
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .map(event => {
                const eventHour = new Date(event.start).getHours();
                const isAM = eventHour < 12;
                return (
                  <div
                    key={event.id}
                    className={`p-4 sm:p-3 rounded-xl mb-3 cursor-pointer transition-all hover:shadow-sm ${
                      event.resource.status === 'pending' ? 
                        `${isAM ? 'bg-gradient-to-r from-orange-50 to-orange-50/50' : 'bg-gradient-to-r from-yellow-50 to-yellow-50/50'}` :
                      event.resource.status === 'confirmed' ? 
                        `${isAM ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50' : 'bg-gradient-to-r from-green-50 to-green-50/50'}` :
                      event.resource.status === 'in_progress' ? 
                        `${isAM ? 'bg-gradient-to-r from-blue-50 to-blue-50/50' : 'bg-gradient-to-r from-sky-50 to-sky-50/50'}` :
                      `${isAM ? 'bg-gradient-to-r from-slate-50 to-slate-50/50' : 'bg-gradient-to-r from-gray-50 to-gray-50/50'}`
                    } ${
                      isAM ? 'border-l-4 border-blue-200' : 'border-l-4 border-orange-200'
                    } group relative`}
                    onClick={() => onEventClick(event)}
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => onDeleteEvent(e, event.resource.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-gray-200 hover:border-red-200 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-400 hover:text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {event.resource.customer?.profile_image ? (
                          <img 
                            src={event.resource.customer.profile_image} 
                            alt={event.resource.customer?.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 truncate">
                          {event.resource.customer?.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.resource.assigned_staff?.name ? `담당: ${event.resource.assigned_staff.name}` : '담당자 미지정'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          isAM ? 'bg-white/80 text-blue-600' : 'bg-white/80 text-orange-600'
                        }`}>
                          {format(new Date(event.start), 'HH:mm')}
                          <span className="ml-1 text-[10px] opacity-60">{isAM ? 'AM' : 'PM'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex gap-2">
                        {event.resource.package_name && (
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 rounded-lg text-[11px] border border-purple-200/50">
                            💫 {event.resource.package_name}
                          </span>
                        )}
                        {event.resource.premium_line?.name && (
                          <span className="px-2 py-1 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 rounded-lg text-[11px] border border-amber-200/50">
                            ✨ {event.resource.premium_line.name}
                          </span>
                        )}
                      </div>
                      {event.resource.status === 'completed' && event.resource.need_death_certificate && (
                        <Button
                          type="text"
                          size="small"
                          className="flex items-center p-0 text-green-600"
                          onClick={(e) => handleOpenCertificate(e, event.resource)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50/30 rounded-xl">
              <p className="text-xs">예약이 없습니다</p>
            </div>
          )}
        </div>
      </Card>

      <FuneralCertificateModal
        visible={certificateModalVisible}
        onCancel={() => {
          setCertificateModalVisible(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
      />
    </>
  );
}; 