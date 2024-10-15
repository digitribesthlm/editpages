// /pages/edit/[id].js
import { useRouter } from 'next/router';
import PageEditor from '../../components/PageEditor';

export default function EditPage() {
  const router = useRouter();
  const { id, accessId } = router.query;

  if (!id || !accessId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">SEO Page Information Manager</h1>
        <PageEditor id={id} accessId={accessId} />
      </div>
    </div>
  );
}