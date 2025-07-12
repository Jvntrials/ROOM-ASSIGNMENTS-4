import React from 'react';
import { Room } from '../../types';
import { PlusIcon, TrashIcon } from '../icons';

interface RoomManagerProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const RoomManager: React.FC<RoomManagerProps> = ({ rooms, setRooms }) => {
  const handleAddRoom = () => {
    const newId = `R${Date.now()}`;
    const newRoom: Room = { id: newId, name: 'New Room', capacity: 40 };
    setRooms([...rooms, newRoom]);
  };

  const handleUpdateRoom = (id: string, field: keyof Room, value: string | number) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Manage Rooms</h3>
        <button onClick={handleAddRoom} className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-700">
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
      <ul className="space-y-3">
        {rooms.map(room => (
          <li key={room.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={room.name}
                onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)}
                className="w-1/2 bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md"
                placeholder="Room Name"
              />
              <input
                type="number"
                value={room.capacity}
                onChange={(e) => handleUpdateRoom(room.id, 'capacity', parseInt(e.target.value) || 0)}
                className="w-1/4 bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md"
                placeholder="Capacity"
              />
              <div className="flex-grow"></div>
              <button onClick={() => handleDeleteRoom(room.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-gray-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomManager;
