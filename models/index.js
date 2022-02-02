export default {
  channel: [
    { name: 'name', label: 'Channel Name', type: 'text', placeholder: 'Mauritius co-housing', required: true },
    { name: 'description', label: 'Description', type: 'longtext', placeholder: 'A place to co-conspire' },
    {
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ]
    },
  ],
  user: [
    { name: 'screenname', label: 'Full name', type: 'text', placeholder: 'John Snow', required: true },
    {
      name: 'settings.newsletter_weekly',
      label: 'Weekly summary email',
      type: 'switch'
    }
  ],
  event: [
    { name: 'name', label: 'Event title', type: 'text', placeholder: 'My event', required: true },
    { name: 'description', label: 'Description', type: 'longtext', placeholder: '' },
    { name: 'location', label: 'Location (link)', type: 'text', placeholder: 'https://zoom.com/wakeup' },
    { name: 'price', label: 'Price', type: 'currency', placeholder: '0.00' },
    { name: 'start', label: 'Start date', type: 'date', required: true },
    { name: 'end', label: 'End', type: 'date', required: true },
    {
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ]
    }
  ],
  listing: [
    { name: 'name', label: 'Listing name', type: 'text', placeholder: 'Spacious loft', required: true },
    { name: 'description', label: 'Description', type: 'longtext', placeholder: '' },
    { name: 'price', label: 'Price (€)', type: 'number', placeholder: '10.00', required: true },
    { name: 'quantity', label: 'Quantity available', type: 'text', placeholder: '1', required: false },
  ],
  task: [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'Plant tomatoes in the garden', required: true },
    { name: 'description', label: 'Summary of work', type: 'longtext', placeholder: `- Establish farming beds
- Make soil
- Plant seeds` },
    { name: 'due', label: 'Due date', type: 'date', required: false, default: null },
    { name: 'tags', label: 'Skills required', type: 'tags', placeholder: 'Add skill' },
    {
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [
        { label: 'Public (visible to anyone)', value: 'public' },
        { label: 'Private (only members can apply)', value: 'private' },
      ]
    },
    { name: 'rewards', label: 'Rewards', type: 'currencies' }
  ],
  listing: [
    { name: 'name', label: 'Listing name', type: 'text', placeholder: 'Spacious loft', required: true },
    { name: 'description', label: 'Description', type: 'longtext', placeholder: '' },
    {
      name: 'channel',
      label: 'Channel',
      type: 'select',
      options: []
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Shared room', value: 'shared room' },
        { label: 'Private room', value: 'private room' },
        { label: 'Glamping tent', value: 'glamping tent' },
        { label: 'Camping', value: 'camping' },
        { label: 'Van (parking)', value: 'van' },
      ]
    },
    { name: 'price', label: 'Price (€)', type: 'number', placeholder: '10.00', required: true },
    { name: 'quantity', label: 'Quantity available', type: 'text', placeholder: '1', required: false },
  ],
  booking: [
    { name: 'start', label: 'Start date', type: 'date' },
    { name: 'end', label: 'End', type: 'date' },
  ],
  application: [
    {
      name: 'inspiration',
      label: 'What is the most inspiring thing you\'ve seen recently? Any events/community/book/project etc.',
      type: 'longtext',
      placeholder: 'Project Heart in Tulum'
    },
    {
      name: 'home',
      label: 'What does home mean to you?',
      type: 'longtext',
      placeholder: ''
    },
    {
      name: 'gift',
      label: 'What will you bring to the community?',
      type: 'longtext',
      placeholder: 'Any special skills? Workshops you can give? Can you help with construction? Or gardening?'
    },
    { name: 'name', label: 'What\'s your name?', type: 'text', placeholder: 'John Snow', required: true },
    { name: 'phone', label: 'What\'s your phone number? (include country code)', type: 'phone', placeholder: '+35108892645' },
    { name: 'email', label: 'What\'s your email?', type: 'text', placeholder: 'you@awesomeproject.org', required: true },
    {
      name: 'dream',
      label: 'What do you dream of?',
      type: 'longtext',
      placeholder: ''
    },
  ]
};