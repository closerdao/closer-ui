import { Heading } from 'closer';
import {
  Clock,
  Euro,
  FileQuestion,
  FileSignature,
  FileText,
  MapPin,
  MonitorPlay,
  Phone,
} from 'lucide-react';

export default function MembershipTimeline() {
  const timelineSteps = [
    {
      id: 1,
      title:
        'Learning about Earthbound through our <a target="_blank" class="underline" href="https://docs.google.com/document/d/1BG-p8vUO78FXtT34cTca5aSiZRw8gtBu/edit?usp=drivesdk&ouid=106312022063837634874&rtpof=true&sd=true">documents</a>, information meetings etc.',
      icon: <FileText className="h-5 w-5 text-accent" />,
      position: 'left',
    },
    {
      id: 2,
      title: 'Filling out the <a target="_blank" class="underline" href="https://qhtmijgonhi.typeform.com/to/VtYUkHBf">membership questionnaire</a>',

      icon: <FileQuestion className="h-5 w-5 text-accent" />,
      position: 'right',
    },
    {
      id: 3,
      title: 'An initial call with the membership working group',
      icon: <Phone className="h-5 w-5 text-accent" />,
      position: 'left',
    },
    {
      id: 4,
      title: 'A visit to Earthbound',
      icon: <MapPin className="h-5 w-5 text-accent" />,
      position: 'right',
    },
    {
      id: 5,
      title:
        '2 phases of long-term living with us; an initial 3 months and then another 6 months integration',
      icon: <Clock className="h-5 w-5 text-accent" />,
      position: 'left',
    },
    {
      id: 6,
      title:
        'During this time, learning about the Les Pas-Sages model (webinars)',
      icon: <MonitorPlay className="h-5 w-5 text-accent" />,
      position: 'right',
    },
    {
      id: 7,
      title:
        'Becoming a shareholder and putting an initial investment into the project',
      icon: <Euro className="h-5 w-5 text-accent" />,
      position: 'left',
    },
    {
      id: 8,
      title: 'Signing a "right-of-use" contract',
      icon: <FileSignature className="h-5 w-5 text-accent" />,
      position: 'right',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <Heading level={2} className="font-bold text-accent uppercase text-2xl">
          Membership Process includes:
        </Heading>
      </div>

      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-accent"></div>

        <div className="space-y-12">
          {timelineSteps.map((step) => (
            <div key={step.id} className="relative flex items-center">
              {/* Circle with icon in the middle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-accent bg-dominant">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div
                className={`w-full grid grid-cols-2 gap-4 ${
                  step.position === 'right' ? 'text-left' : 'text-right'
                }`}
              >
                {step.position === 'left' ? (
                  <>
                    <div className="pr-8 py-2" dangerouslySetInnerHTML={{ __html: step.title }} />
                    <div></div>
                  </>
                ) : (
                  <>
                    <div></div>
                    <div className="pl-8 py-2" dangerouslySetInnerHTML={{ __html: step.title }} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
