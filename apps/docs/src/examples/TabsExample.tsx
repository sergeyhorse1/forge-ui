import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function TabsExample() {
  return (
    <Preview>
      <Tabs defaultValue="overview" className="w-full max-w-sm">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Your dashboard summary.</TabsContent>
        <TabsContent value="activity">Recent activity feed.</TabsContent>
        <TabsContent value="settings">Workspace settings.</TabsContent>
      </Tabs>
    </Preview>
  )
}
