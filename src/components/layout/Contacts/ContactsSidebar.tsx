import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { X, Search, Users, Folder, Tag, Plus } from 'lucide-react';
import { selectContacts, selectSegments, selectContactLists } from '../../../store/contactSlice'; // Fixed path
import { Contact, Segment, ContactList } from '../../../store/contactSlice'; // Fixed path

interface ContactsSidebarProps {
  onClose: () => void;
}

const ContactsSidebar: React.FC<ContactsSidebarProps> = React.memo(({ onClose }) => {
  const contacts = useSelector(selectContacts);
  const segments = useSelector(selectSegments);
  const contactLists = useSelector(selectContactLists);
  const [activeTab, setActiveTab] = useState<'contacts' | 'lists' | 'segments'>('contacts');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredContacts = useMemo(() => 
    contacts.filter((c: Contact) => 
      c.name.toLowerCase().includes(search.toLowerCase()) && 
     (filter === 'all' || c.segment === filter)

    ), [contacts, search, filter]
  );

  return (
    <aside className="w-80 border-r bg-white flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('contacts')}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Contacts
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'lists' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('lists')}
          >
            <Folder className="w-4 h-4 inline mr-1" />
            Lists
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'segments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('segments')}
          >
            <Tag className="w-4 h-4 inline mr-1" />
            Segments
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'contacts' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Segment</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Segments</option>
                <option value="Premium">Premium</option>
                <option value="Regular">Regular</option>
                <option value="New">New</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredContacts.map((contact: Contact) => (
                <div key={contact.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{contact.segment}
</span>
                  </div>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
              ))}
              {filteredContacts.length === 0 && <div className="text-center py-8 text-gray-500">No contacts found</div>}
            </div>
          </div>
        )}
        {activeTab === 'lists' && (
          <div className="space-y-3">
            {contactLists.map((list: ContactList) => (
              <div key={list.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{list.name}</h3>
                    <p className="text-sm text-gray-600">{list.count || 0} contacts</p>
                  </div>
                  <Folder className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'segments' && (
          <div className="space-y-3">
            {segments.map((segment: Segment) => (
              <div key={segment.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{segment.name}</h3>
                    <p className="text-sm text-gray-600">{segment.count || 0} contacts</p>
                  </div>
                  <Tag className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-6 border-t">
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Contact
        </button>
      </div>
    </aside>
  );
});

export default ContactsSidebar;