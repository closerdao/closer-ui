import { __ } from '../utils/helpers';
import Layout from './Layout';

const PageError = ({ error }) => (
  <Layout>
    <div className="max-w-screen-sm mx-auto p-8 h-full">
      <h1 className="page-title pb-2 flex space-x-1 items-center mt-8">
        <span className="mr-1">🚨</span>
        <span>{__('page_error_title')}</span>
      </h1>
      <div className="mt-16 flex flex-col gap-16">
        <div className="text-center">
          <p className="text-lg">{error}</p>
        </div>
      </div>
    </div>
  </Layout>
);

export default PageError;
