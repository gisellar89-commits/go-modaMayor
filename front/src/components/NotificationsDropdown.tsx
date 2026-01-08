"use client";
import React from "react";
import { AppNotification } from "../hooks/useNotifications";

interface Props {
  notifications: AppNotification[];
  onMarkAsRead: (id?: number) => void;
}

export default function NotificationsDropdown({ notifications, onMarkAsRead }: Props) {
  return (
    <div className="w-[280px] sm:w-80 bg-white border shadow-lg rounded-lg p-2 max-w-[calc(100vw-16px)]">
      <div className="font-semibold px-2 py-1 border-b text-gray-800">Notificaciones</div>
      <div className="max-h-64 overflow-y-auto overflow-x-hidden">
        {notifications.length === 0 && (
          <div className="p-4 text-sm text-gray-500">No tenés notificaciones nuevas.</div>
        )}
        <ul className="divide-y">
          {notifications.map((n, idx) => {
            const id = (n as any).ID || (n as any).id;
            return (
              <li key={id ?? idx} className={`px-3 py-2 ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-gray-800 break-words overflow-hidden">{n.message}</div>
                  <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{n.read ? '' : 'Nuevo'}</div>
                </div>
                <div className="mt-2 flex justify-end">
                  {!n.read && (
                    <button onClick={() => onMarkAsRead(id)} className="text-xs text-blue-600 hover:underline">Marcar como leído</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
