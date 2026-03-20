import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Mail, Send, Clock, Webhook, Filter, ListOrdered, CopyX, SplitSquareHorizontal, Smartphone } from 'lucide-react'; // All icons from Lucide

interface SectionItem {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  onClick?: () => void;
}

interface RightPanelProps {
  onAddAction: (type: 'send' | 'receive') => void;
}

const RightPanel: React.FC<RightPanelProps> = React.memo(({ onAddAction }) => {
  const [open, setOpen] = useState<string | null>('Trigger');

  const sections: { [key: string]: SectionItem[] } = {
    Trigger: [
      { icon: Mail, title: 'Message Receive', desc: 'Trigger for the WhatsApp', onClick: () => onAddAction('receive') },
      { icon: Send, title: 'Message Send', desc: 'Trigger for the Email', onClick: () => onAddAction('send') },
      { icon: Clock, title: 'Schedule', desc: 'Trigger for the schedule' },
      { icon: Webhook, title: 'Webhook', desc: 'Trigger for the Webhook' },
    ],
    Conditions: [
      { icon: Filter, title: 'Filter', desc: 'Remove items matching a condition' },
      { icon: ListOrdered, title: 'Limit', desc: 'Restrict the number of items' },
      { icon: CopyX, title: 'Remove Duplicates', desc: 'Delete items with matching field values' },
      { icon: SplitSquareHorizontal, title: 'Split Out', desc: 'Turn a list into separate items' },
    ],
    Actions: [
      { icon: Smartphone, title: 'WhatsApp', desc: 'Send a WhatsApp message' },
      { icon: Mail, title: 'Email', desc: 'Send an Email' },
      { icon: Webhook, title: 'Webhook', desc: 'Trigger Webhook action' },
    ],
  };

  const toggle = (section: string) => {
    setOpen(open === section ? null : section);
  };

  return (
    <aside className="w-72 border-l bg-blue-50 p-6 flex flex-col gap-4 overflow-y-auto"> {/* Figma-matched padding */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search" className="w-full rounded-lg border px-3 py-2 pl-10 text-sm focus:ring focus:ring-blue-200" />
      </div>
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="bg-white rounded-lg shadow">
          <div onClick={() => toggle(section)} className="flex items-center justify-between px-3 py-2 cursor-pointer">
            <span className="font-medium">{section} ({items.length})</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ${open === section ? 'rotate-180' : ''}`} /> {/* Smooth transition */}
          </div>
          {open === section && (
            <div className="px-2 pb-2 transition-all duration-300"> {/* Smooth transition */}
              {items.map((item) => (
                <div 
                  key={item.title} 
                  onClick={() => item.onClick?.()} // Fixed: Use optional chaining to safely call onClick
                  className={`flex items-start gap-3 px-2 py-2 rounded-md hover:bg-gray-50 ${
                    typeof item.onClick === 'function' ? 'cursor-pointer' : 'cursor-default' // Fixed: Use typeof check for className
                  }`}
                >
                  <item.icon className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
});

export default RightPanel;