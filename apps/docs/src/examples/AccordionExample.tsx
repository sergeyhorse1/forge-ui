import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function AccordionExample() {
  return (
    <Preview>
      <Accordion type="single" collapsible defaultValue="shipping" className="w-full max-w-md">
        <AccordionItem value="shipping">
          <AccordionTrigger>How does shipping work?</AccordionTrigger>
          <AccordionContent>Orders ship within two business days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>What is the return policy?</AccordionTrigger>
          <AccordionContent>Returns are accepted within 30 days of delivery.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Preview>
  )
}
