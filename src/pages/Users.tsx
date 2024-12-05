import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteUser } from '../lib/firebase/auth';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: any;
}

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setShowPasswordPrompt(true);
  };

  const handleDelete = async (isAuthenticated: boolean) => {
    if (!isAuthenticated || !selectedUser) {
      setShowPasswordPrompt(false);
      setSelectedUser(null);
      return;
    }

    try {
      await deleteUser(selectedUser.uid);
      showSuccessNotification('Пользователь успешно удален');
    } catch (error) {
      showErrorNotification('Ошибка при удалении пользователя');
    } finally {
      setShowPasswordPrompt(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>
              <p className="text-sm text-gray-500">Управление пользователями системы</p>
            </div>
          </div>
        </div>

        {/* Поиск */}
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <input
              type="text"
              placeholder="Поиск по email или имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Нет пользователей</h3>
            <p className="text-gray-500">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'Список пользователей пуст'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li key={user.uid}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Без имени'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          user.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.emailVerified ? 'Подтвержден' : 'Не подтвержден'}
                        </div>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => {
            setShowPasswordPrompt(false);
            setSelectedUser(null);
          }}
          onSuccess={() => handleDelete(true)}
        />
      )}
    </div>
  );
};