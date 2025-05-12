'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailTemplates } from './templates';
import { EmailStatus } from './status';

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Email Management</h1>
      
      <Tabs defaultValue="templates" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="status">Email Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <Card>
            <CardContent className="pt-6">
              <EmailTemplates />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card>
            <CardContent className="pt-6">
              <EmailStatus />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
