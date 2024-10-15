// /pages/index.js
import { useRouter } from 'next/router';
import PageList from '../components/PageList';

export default function Home() {
  const router = useRouter();
  const { accessId } = router.query;

  if (!accessId) {
    return <div>Please provide an access ID</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">SEO Page Information Manager!</h1>
        <PageList accessId={accessId} />
      </div>
    </div>
  );
}