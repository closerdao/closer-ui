import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { FaArrowLeft } from '@react-icons/all-files/fa/FaArrowLeft';
import { NextApiRequest } from 'next';
import { ParsedUrlQuery } from 'querystring';

import models from '../../../models';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

interface Props {
  lesson: any;
  error?: string;
}

const EditLessonPage = ({ lesson, error }: Props) => {
  const router = useRouter();
  const onUpdate = async (
    name: string,
    value: any,
    option?: any,
    actionType?: string,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option?._id) {
        await api.post(`/moderator/lesson/${lesson._id}/add`, option);
    }
  };
  if (!lesson) {
    return <Heading>{__('events_slug_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${__('learn_edit_heading')} ${lesson.name}`}</title>
      </Head>
      <div className="main-content">
        {error && <div className="error-box">{error}</div>}
        <Link
          href={`/learn/${lesson.slug}`}
          className="mr-2 italic flex flex-row items-center justify-start"
        >
          <FaArrowLeft className="mr-1" /> {__('generic_back')}
        </Link>
        <Heading level={2} className="flex justify-start items-center">
          {__('learn_edit_heading')}{' '} <i>{lesson.title}</i>
        </Heading>
        {!process.env.NEXT_PUBLIC_STRIPE_PUB_KEY && (
          <div className="my-4 error-box italic">
            {__('events_no_stripe_integration')}
          </div>
        )}
        <EditModel
          id={lesson._id}
          endpoint="/lesson"
          fields={models.lesson}
          initialData={lesson}
          onSave={(lesson) => router.push(`/learn/${lesson.slug}`)}
          onUpdate={onUpdate}
          allowDelete
          deleteButton="Delete lesson"
          onDelete={() => router.push('/')}
        />
      </div>
    </>
  );
};

EditLessonPage.getInitialProps = async ({
  req,
  query,
}: {
  req: NextApiRequest;
  query: ParsedUrlQuery;
}) => {
  try {
    if (!query.slug) {
      throw new Error('No event');
    }
    const {
      data: { results: lesson },
    } = await api.get(`/lesson/${query.slug}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`,
      },
    });

    return { lesson };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EditLessonPage;
