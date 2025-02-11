import Head from 'next/head';

import { useEffect, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const LearnDashboardPage = () => {
  const t = useTranslations();

  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isAdmin = user?.roles.includes('admin');
  const CHARGES_LIMIT = 1000;

  const [preparedCourseData, setPreparedCourseData] = useState([]);

  const userFilter = {
    where: {
      type: 'product',
      'meta.productType': 'lesson',
    },
    limit: CHARGES_LIMIT,
  };

  const groupByCourse = (
    arr: { courseId: string; buyerId: string; amount: number }[],
  ) => {
    const result: {
      courseId: string;
      buyers: { id: string; amount: number }[];
    }[] = [];

    const map = new Map<string, Map<string, number>>();

    arr.forEach(({ courseId, buyerId, amount }) => {
      if (!map.has(courseId)) {
        map.set(courseId, new Map());
      }

      const buyerMap = map.get(courseId)!;
      buyerMap.set(buyerId, (buyerMap.get(buyerId) || 0) + amount);
    });

    map.forEach((buyerMap, courseId) => {
      const buyers = Array.from(buyerMap.entries()).map(([id, amount]) => ({
        id,
        amount,
      }));

      result.push({ courseId, buyers });
    });

    return result;
  };

  const loadData = async () => {
    const [chargesRes, learnRes] = await Promise.all([
      platform.charge.get(userFilter),
      platform.lesson.get(),
    ]);

    const charges = chargesRes?.results?.toJS();
    const courses = learnRes?.results?.toJS();
    const userIds = [
      ...new Set(charges?.map((charge: any) => charge.createdBy)),
    ];

    const usersRes = await platform.user.get({
      where: {
        _id: { $in: userIds },
      },
      limit: 1000,
    });
    const users = usersRes?.results.toJS();

    const courseData =
      users &&
      charges?.map((charge: any) => {
        return {
          courseId: charge.productId,
          buyerId: charge.createdBy,
          amount: charge.amount.total.val,
        };
      });
    const groupedData = courseData && groupByCourse(courseData);

    const preparedData = groupedData?.map((group: any) => {
      return {
        course: courses.find((course: any) => course._id === group.courseId),
        buyers: users
          .filter((user: any) =>
            group.buyers.some((buyer: any) => buyer.id === user._id),
          )
          .map((groupBuyer: any) => {
            return {
              ...groupBuyer,
              amount: group.buyers.find(
                (buyer: any) => buyer.id === groupBuyer._id,
              )?.amount,
            };
          }),
      };
    });

    setPreparedCourseData(preparedData);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!isSpaceHost && !isAdmin) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('learn_heading')}</title>
      </Head>
      <AdminLayout>
        <section className="flex flex-col gap-4 mb-12 ">
          <div className="md:max-w-3xl">
            <div className="mb-6 flex justify-between flex-col sm:flex-row gap-4">
              <Heading>{t('learn_heading')}</Heading>
            </div>
            <div className="flex flex-col gap-4">
              {preparedCourseData && preparedCourseData.length > 0
                ? preparedCourseData.map((course: any, index: number) => {
                    return (
                      <div
                        className="flex flex-col gap-4"
                        key={course?.course ? course.course._id : index}
                      >
                        {JSON.stringify(course)}
                        <div className="font-bold">
                          {course?.course
                            ? course.course.title
                            : 'Deleted course'}
                        </div>
                        <div className="space-y-4 sm:space-y-1">
                          {course?.buyers &&
                            course.buyers.length > 0 &&
                            course.buyers.map((buyer: any, index: number) => {
                              return (
                                <div
                                  className="flex flex-col sm:flex-row justify-between sm:space-x-4 text-sm"
                                  key={buyer._id + index}
                                >
                                  <div className="sm:w-1/3">
                                    {buyer?.screenname}
                                  </div>
                                  <div className="sm:w-1/3">{buyer?.email}</div>
                                  <div className="text-left sm:text-right sm:w-1/3 border-b sm:border-b-0">
                                    €{buyer?.amount}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })
                : t('learn_no_data')}
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

LearnDashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default LearnDashboardPage;
