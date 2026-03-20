import React, { useState } from 'react';
import { Search, ChevronDown, Package, Send, Clock, Share2, Filter, List, Trash2, Divide, Smartphone, Mail } from 'lucide-react';

interface SectionItem {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

const contactDetailsSections: Record<string, SectionItem[]> = {
  Trigger: [
    { icon: Package, title: 'Message Receive', description: 'Trigger for the WhatsApp' },
    { icon: Send, title: 'Message Send', description: 'Trigger for the Email' },
    { icon: Clock, title: 'Schedule', description: 'Trigger for the schedule' },
    { icon: Share2, title: 'Webhook', description: 'Trigger for the Webhook' },
  ],
  Conditions: [
    { icon: Filter, title: 'Filter', description: 'Remove items matching a condition' },
    { icon: List, title: 'Limit', description: 'Restrict the number of items' },
    { icon: Trash2, title: 'Remove Duplicates', description: 'Delete items with matching field values' },
    { icon: Divide, title: 'Split Out', description: 'Turn a list inside a item(s) into separate items' },
  ],
  Actions: [
    { icon: Smartphone, title: 'WhatsApp', description: 'Remove items matching a condition' },
    { icon: Mail, title: 'Email', description: 'Restrict the number of items' },
    { icon: Share2, title: 'Webhook', description: 'Delete items with matching field values' },
  ],
};

const ContactsDetailsSidebar: React.FC = () => {
  const [openSection, setOpenSection] = useState<string>('Trigger');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  // Helper to filter items by search term
  const filterItems = (items: SectionItem[]) => {
    if (!searchTerm.trim()) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <aside className="w-72 bg-blue-50 p-6 border-l overflow-y-auto">
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-gray-300 pl-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Accordion Sections */}
      {Object.entries(contactDetailsSections).map(([section, items]) => {
        const filteredItems = filterItems(items);
        return (
          <section key={section} className="mb-4 bg-white rounded-lg shadow">
            <button
              onClick={() => toggleSection(section)}
              className="flex items-center justify-between w-full px-4 py-3 font-semibold text-gray-700 rounded-t-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-expanded={openSection === section}
            >
              <span>{section} ({filteredItems.length})</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transform transition-transform duration-300 ${
                  openSection === section ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openSection === section && (
              <ul className="p-4 space-y-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 rounded-md px-3 py-2">
                      <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{title}</p>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-gray-400 text-sm">No matching items</p>
                )}
              </ul>
            )}
          </section>
        );
      })}
    </aside>
  );
};

export default ContactsDetailsSidebar;