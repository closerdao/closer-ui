import { ChangeEvent, useState } from 'react';

import { ObjectId } from 'bson';
import { useTranslations } from 'next-intl';

import { Button, Card, Checkbox, Heading, Input } from '../ui';

interface LearnOption {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  lessons: {
    title: string;
    fullText: string;
    videoUrl: string;
    isFree: boolean;
    _id: string;
  }[];
}

interface LearnEditorProps {
  value: LearnOption[];
  onChange: (value: LearnOption[]) => void;
  required: boolean;
}

const LearnEditor = ({ value = [], onChange, required }: LearnEditorProps) => {
  const t = useTranslations();
  const [options, setOptions] = useState<LearnOption[]>(value);

  const updateOptions = (update: LearnOption[]) => {
    setOptions(update);
    onChange && onChange(update);
  };

  const updateOption = (index: number, option: LearnOption) => {
    const update = options.map((o, i) => (i === index ? option : o));
    updateOptions(update);
  };

  const handleAddOption = () => {
    updateOptions(
      options.concat({
        id: new ObjectId().toString(),
        title: '',
        description: '',
        lessons: [],
      }),
    );
  };

  const removeOption = (index: number) => {
    updateOptions(options.filter((o, i) => index !== i));
  };

  const handleInputChange = (
    index: number,
    field: keyof Pick<LearnOption, 'title' | 'description'>,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    updateOption(index, {
      ...options[index],
      [field]: e.target.value,
    });
  };

  const handleAddLesson = (moduleIndex: number) => {
    const updatedOptions = [...options];
    updatedOptions[moduleIndex].lessons.push({
      title: '',
      fullText: '',
      videoUrl: '',
      isFree: false,
      _id: new ObjectId().toString(),
    });
    updateOptions(updatedOptions);
  };

  const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedOptions = [...options];
    updatedOptions[moduleIndex].lessons = updatedOptions[
      moduleIndex
    ].lessons.filter((_, i) => i !== lessonIndex);
    updateOptions(updatedOptions);
  };

  const handleLessonChange = (
    moduleIndex: number,
    lessonIndex: number,
    field: keyof LearnOption['lessons'][0],
    value: string | boolean,
  ) => {
    const updatedOptions = [...options];
    updatedOptions[moduleIndex].lessons[lessonIndex] = {
      ...updatedOptions[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    updateOptions(updatedOptions);
  };

  return (
    <section className="border-2 rounded-lg p-4 flex flex-col gap-6">
      {options &&
        options.map((option, index) => (
          <Card key={option._id || option.id || index} className="w-full">
            <Input
              label={t('learn_module_title')}
              value={option.title}
              isRequired={required}
              placeholder="Introduction"
              onChange={(e) => handleInputChange(index, 'title', e)}
            />
            <Input
              label={t('learn_module_description')}
              value={option.description}
              isRequired={required}
              placeholder="Module description..."
              onChange={(e) => handleInputChange(index, 'description', e)}
            />
            <Card className="space-y-4">
              <Heading level={4}>{t('learn_module_lessons')}</Heading>
              {option.lessons.map((lesson, lessonIndex) => (
                <Card key={lesson._id} className="p-4 space-y-4">
                  <Input
                    label={t('learn_lesson_title')}
                    value={lesson.title}
                    isRequired={required}
                    placeholder="Lesson title"
                    onChange={(e) =>
                      handleLessonChange(
                        index,
                        lessonIndex,
                        'title',
                        e.target.value,
                      )
                    }
                  />
                  <Input
                    label={t('learn_lesson_full_text')}
                    value={lesson.fullText}
                    isRequired={required}
                    placeholder="Lesson content..."
                    onChange={(e) =>
                      handleLessonChange(
                        index,
                        lessonIndex,
                        'fullText',
                        e.target.value,
                      )
                    }
                  />
                  <Input
                    label={t('learn_lesson_video_url')}
                    value={lesson.videoUrl}
                    placeholder="Video URL"
                    onChange={(e) =>
                      handleLessonChange(
                        index,
                        lessonIndex,
                        'videoUrl',
                        e.target.value,
                      )
                    }
                  />
                  <Checkbox
                    isChecked={lesson.isFree}
                    onChange={(e) =>
                      handleLessonChange(
                        index,
                        lessonIndex,
                        'isFree',
                        e.target.checked,
                      )
                    }
                  >
                    {t('learn_lesson_is_free')}
                  </Checkbox>
                  <Button
                    variant="secondary"
                    className="w-fit border-error text-error"
                    onClick={() => handleRemoveLesson(index, lessonIndex)}
                    type="button"
                  >
                    {t('learn_lesson_delete')}
                  </Button>
                </Card>
              ))}
              <Button
                variant="secondary"
                className="w-fit"
                onClick={() => handleAddLesson(index)}
                type="button"
              >
                {t('learn_lesson_add')}
              </Button>
            </Card>

            <Button
              variant="secondary"
              className="w-fit border-error text-error"
              onClick={() => removeOption(index)}
              type="button"
            >
              {t('learn_remove_module')}
            </Button>
          </Card>
        ))}
      <Button onClick={handleAddOption} className="w-fit" type="button">
        {t('learn_add_module')}
      </Button>
    </section>
  );
};

export default LearnEditor;
