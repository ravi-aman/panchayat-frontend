'use client';

import { useState } from 'react';
import { Switch } from '../ui/switch';
export default function NotificationTab() {
  const [settings, setSettings] = useState({
    personalized: true,
    webinars: true,
    features: true,
    security: false,
    marketing: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    {
      title: 'Personalized Offers',
      description: 'Receive offers made special for you',
      key: 'personalized',
    },
    {
      title: 'Online Webinars',
      description: 'Get notified about upcoming webinars',
      key: 'webinars',
    },
    {
      title: 'New Features',
      description: 'Updates about new features and product releases',
      key: 'features',
    },
    {
      title: 'Security and Billing',
      description: 'Account security and notifications about billing',
      key: 'security',
    },
    {
      title: 'Marketing',
      description: 'Receive marketing newsletters about our new products.',
      key: 'marketing',
    },
  ] as const;

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between border-b border-gray-200 pb-4"
        >
          <div>
            <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <Switch checked={settings[item.key]} onChange={() => toggle(item.key)} />
        </div>
      ))}
    </div>
  );
}
